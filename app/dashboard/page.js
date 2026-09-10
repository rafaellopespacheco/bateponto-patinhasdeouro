import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import ClockInterface from './ClockInterface';
import { 
  calculatePunctuality, 
  generateMonthCalendarLogic, 
  generateAnalytics 
} from '@/lib/calculations';
import MonthSelector from '@/components/MonthSelector';
import CalendarList from '@/components/CalendarList';

function getLabelByType(type) {
  switch (type) {
    case 'ENTRADA': return 'Entrada';
    case 'PAUSA_ALMOCO': return 'Pausa Almoço';
    case 'RETORNO_ALMOCO': return 'Retorno Almoço';
    case 'SAIDA': return 'Saída';
    case 'FALTA': return 'Falta';
    case 'ATESTADO': return 'Atestado';
    default: return type;
  }
}

export default async function DashboardPage(props) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const userId = session.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Resolve o mês buscado (Padrão: Atual)
  const queryMonth = searchParams?.month; // YYYY-MM
  const now = new Date();
  
  let refYear = now.getFullYear();
  let refMonth = now.getMonth() + 1;

  if (queryMonth) {
    const parts = queryMonth.split('-');
    if (parts.length === 2) {
      refYear = parseInt(parts[0], 10);
      refMonth = parseInt(parts[1], 10);
    }
  }

  // LIMITA O FUNCIONÁRIO A 3 MESES ATRÁS
  const isCurrentMonth = refYear === now.getFullYear() && refMonth === (now.getMonth() + 1);

  // ========== DADOS DO MÊS SOLICITADO ============
  const startOfMonth = new Date(refYear, refMonth - 1, 1);
  const endOfMonth = new Date(refYear, refMonth, 0, 23, 59, 59, 999);

  const monthRecords = await prisma.timeRecord.findMany({
    where: { userId, timestamp: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { timestamp: 'asc' }
  });

  // ========== DADOS DE HOJE (Apenas se o mês na tela for o mês atual) ============
  let todayRecords = [];
  let nextAction = 'ENTRADA';
  let nextActionLabel = 'Registrar Entrada';

  if (isCurrentMonth) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    todayRecords = monthRecords.filter(r => new Date(r.timestamp) >= startOfDay);
    
    const lastRecord = todayRecords[todayRecords.length - 1];
    if (lastRecord) {
      if (lastRecord.type === 'ENTRADA') {
        nextAction = 'PAUSA_ALMOCO'; nextActionLabel = 'Pausa para Almoço';
      } else if (lastRecord.type === 'PAUSA_ALMOCO') {
        nextAction = 'RETORNO_ALMOCO'; nextActionLabel = 'Retorno do Almoço';
      } else if (lastRecord.type === 'RETORNO_ALMOCO') {
        nextAction = 'SAIDA'; nextActionLabel = 'Registrar Saída';
      } else if (lastRecord.type === 'SAIDA') {
        nextAction = 'DONE';
      }
    }
  }

  // ========== ENGINE DE CÁLCULO MENSAL ============
  // Punctuality check usa apenas os registros em si
  const punctuality = calculatePunctuality(monthRecords, user.expectedEntryTime);
  
  // Geração do Calendário Exteso para Preencher Dias Vazios
  const calendar = generateMonthCalendarLogic(refYear, refMonth, monthRecords, user.freeDays);
  
  // Roda Análise no Calendário
  const analytics = generateAnalytics(calendar, user.hourlyRate);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Olá, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo ao seu painel.</p>
        </div>
        
        {/* SELETOR DE MÊS */}
        <MonthSelector currentMonth={refMonth} currentYear={refYear} role="EMPLOYEE" />
      </div>

      {/* METRICS & CLOCK ROW */}
      <div className="hero-grid">
        
        {/* BIG CLOCK CARD */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-color)', opacity: '0.1', filter: 'blur(50px)', borderRadius: '50%' }}></div>
          {isCurrentMonth ? (
             <div style={{ width: '100%' }}>
               <ClockInterface 
                 nextAction={nextAction} 
                 nextActionLabel={nextActionLabel}
                 todayRecords={todayRecords}
               />
             </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Relógio inativo neste mês no passado.
            </p>
          )}
        </div>

        {/* HERO METRICS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {user.canViewPreview && (
            <div className="glass-panel" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
               <span style={{ fontSize: '14px', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Faturamento Bruto</span>
               <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>R$ {analytics.totalEarnings.toFixed(2).replace('.', ',')}</div>
               <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Estimativa ({refMonth.toString().padStart(2, '0')}/{refYear})</span>
            </div>
          )}

          <div className="glass-panel" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
               <span style={{ fontSize: '14px', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Horas Líquidas Feitas</span>
               <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>{analytics.totalHours.toFixed(1)} <span style={{fontSize:'20px', color:'var(--text-secondary)'}}>Hrs</span></div>
               <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Tempo real de trabalho diário</span>
          </div>
        </div>
      </div>

      {/* DETAILED STATS GRID */}
      <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Seu Painel Analítico</h3>
      <div className="stats-grid">
          
          <div className="glass-panel stat-card">
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dias Logados</span>
             <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>{analytics.workedDays}</div>
          </div>
          
          <div className="glass-panel stat-card" style={{ borderBottom: analytics.sundaysWorked > 0 ? '3px solid var(--warning-color)' : '' }}>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plantões (Domingo)</span>
             <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: analytics.sundaysWorked > 0 ? 'var(--warning-color)' : 'white' }}>{analytics.sundaysWorked}</div>
          </div>
          
          <div className="glass-panel stat-card" style={{ borderBottom: analytics.faltas > 0 ? '3px solid var(--danger-color)' : '' }}>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Faltas Diretas</span>
             <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: analytics.faltas > 0 ? 'var(--danger-color)' : 'white' }}>{analytics.faltas}</div>
          </div>
          
          <div className="glass-panel stat-card" style={{ borderBottom: analytics.atestados > 0 ? '3px solid var(--warning-color)' : '' }}>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Atestados (Saúde)</span>
             <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: analytics.atestados > 0 ? 'var(--warning-color)' : 'white' }}>{analytics.atestados}</div>
          </div>
          
          <div className="glass-panel stat-card">
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dias Livres</span>
             <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>{analytics.notWorkedDays}</div>
          </div>
          
      </div>

      {/* PANORAMA GERAL DO MÊS */}
      <div className="glass-panel" style={{ marginTop: '32px', padding: '32px' }}>
         <CalendarList calendar={calendar} isAdmin={false} userId={userId} />
      </div>
    </div>
  );
}

function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}
