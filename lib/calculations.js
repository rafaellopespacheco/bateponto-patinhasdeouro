// lib/calculations.js

export function groupRecordsByDay(records) {
  const groups = {};
  for (const record of records) {
    const dateStr = new Date(record.timestamp).toLocaleDateString('pt-BR');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(record);
  }
  return groups;
}

export function generateMonthCalendarLogic(year, month, records, freeDaysString) {
  const freeDays = freeDaysString ? freeDaysString.split(',').map(Number) : [0, 1];
  const groups = groupRecordsByDay(records);
  const calendar = [];

  // month is 1-indexed (1 = Jan)
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentMonthIdx = month - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, currentMonthIdx, i);
    const dateStr = d.toLocaleDateString('pt-BR');
    const dayOfWeek = d.getDay();
    const dayRecords = groups[dateStr] || [];

    const isFuture = d > today;

    const hasFalta = dayRecords.find(r => r.type === 'FALTA');
    const hasAtestado = dayRecords.find(r => r.type === 'ATESTADO');

    if (hasAtestado) {
      calendar.push({ date: dateStr, timestamp: d, records: dayRecords, status: 'ATESTADO' });
    } else if (hasFalta) {
      calendar.push({ date: dateStr, timestamp: d, records: dayRecords, status: 'FALTA' });
    } else if (dayRecords.length > 0) {
      calendar.push({ date: dateStr, timestamp: d, records: dayRecords, status: 'TRABALHADO' });
    } else {
      let status = 'FALTA_AUTOMATICA';
      if (isFuture) {
        status = 'FUTURO';
      } else if (freeDays.includes(dayOfWeek)) {
        status = dayOfWeek === 0 ? 'DOMINGO' : 'LIBERADO';
      }
      calendar.push({ date: dateStr, timestamp: d, records: [], status });
    }
  }

  return calendar;
}

export function generateAnalytics(calendar, hourlyRate) {
  let totalHours = 0;
  let workedDays = 0;
  let sundaysWorked = 0;
  let faltas = 0;
  let atestados = 0;
  let notWorkedDays = 0;

  for (const day of calendar) {
    if (day.status === 'FALTA' || day.status === 'FALTA_AUTOMATICA') faltas++;
    if (day.status === 'ATESTADO') atestados++;
    if (day.status === 'NAO_TRABALHADO' || day.status === 'DOMINGO' || day.status === 'LIBERADO') {
      notWorkedDays++;
    }

    if (day.status === 'TRABALHADO') {
      workedDays++;
      if (day.timestamp.getDay() === 0) sundaysWorked++;

      const records = day.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const entrada = records.find(r => r.type === 'ENTRADA');
      const saida = records.find(r => r.type === 'SAIDA');

      if (entrada && saida) {
        const diffMs = new Date(saida.timestamp).getTime() - new Date(entrada.timestamp).getTime();
        totalHours += diffMs / (1000 * 60 * 60);
      } else if (entrada && !saida) {
        // Se ainda está ativo hoje
        const isToday = new Date().toLocaleDateString('pt-BR') === day.date;
        if (isToday) {
          const currentDiffMs = new Date().getTime() - new Date(entrada.timestamp).getTime();
          totalHours += currentDiffMs / (1000 * 60 * 60);
        }
      }
    }
  }

  return {
    totalHours,
    totalEarnings: totalHours * hourlyRate,
    workedDays,
    sundaysWorked,
    faltas,
    atestados,
    notWorkedDays
  };
}

// Retro-compatibility and shared logic
export function calculateLunchExcess(records, lunchLimitMin) {
  let excessMin = 0;
  const groups = groupRecordsByDay(records);
  for (const date in groups) {
    const dayRecords = groups[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const pausa = dayRecords.find(r => r.type === 'PAUSA_ALMOCO');
    const retorno = dayRecords.find(r => r.type === 'RETORNO_ALMOCO');
    if (pausa && retorno) {
      const diffMs = new Date(retorno.timestamp).getTime() - new Date(pausa.timestamp).getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin > lunchLimitMin) excessMin += (diffMin - lunchLimitMin);
    }
  }
  return excessMin;
}

export function calculatePunctuality(records, expectedEntryStr) {
  const stats = { onTime: 0, early: 0, late: 0 };
  const groups = groupRecordsByDay(records);
  let expectedH = 8, expectedM = 0;
  if (expectedEntryStr) {
    const parts = expectedEntryStr.split(':');
    expectedH = parseInt(parts[0], 10);
    expectedM = parseInt(parts[1], 10);
  }
  const TOLERANCE_MINUTES = 10;

  for (const date in groups) {
    const dayRecords = groups[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const entrada = dayRecords.find(r => r.type === 'ENTRADA');
    if (entrada) {
      const dt = new Date(entrada.timestamp);
      const expectedDate = new Date(dt);
      expectedDate.setHours(expectedH, expectedM, 0, 0);
      const diffMin = (dt.getTime() - expectedDate.getTime()) / 60000;
      if (Math.abs(diffMin) <= TOLERANCE_MINUTES) stats.onTime++;
      else if (diffMin < -TOLERANCE_MINUTES) stats.early++;
      else if (diffMin > TOLERANCE_MINUTES) stats.late++;
    }
  }
  return stats;
}

export function calculateTotalEarnings(records, hourlyRate) {
  // We can map this to the new analytics function without generating full month, but actually
  // the new generateAnalytics is much better. For retro-compat, we generate a pseudo calendar here:
  // Actually just keep the old logic to return exact same as before:
  const groups = groupRecordsByDay(records);
  let totalHours = 0;
  for (const date in groups) {
    const dayRecords = groups[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const entrada = dayRecords.find(r => r.type === 'ENTRADA');
    const saida = dayRecords.find(r => r.type === 'SAIDA');
    if (entrada && saida) {
      totalHours += (new Date(saida.timestamp).getTime() - new Date(entrada.timestamp).getTime()) / (1000 * 60 * 60);
    }
  }
  return totalHours * hourlyRate;
}
