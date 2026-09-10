import { prisma } from '@/lib/db';
import Link from 'next/link';
import { addManualTimeRecord, addBatchManualTimeRecords } from '@/app/admin/actions';
import MonthSelector from '@/components/MonthSelector';
import CalendarList from '@/components/CalendarList';
import { generateMonthCalendarLogic, generateAnalytics } from '@/lib/calculations';

function getLabelByType(type) {
  switch (type) {
    case 'ENTRADA': return 'Entrada';
    case 'PAUSA_ALMOCO': return 'Pausa Almoço';
    case 'RETORNO_ALMOCO': return 'Retorno Almoço';
    case 'SAIDA': return 'Saída';
    case 'FALTA': return 'Falta Computada';
    case 'ATESTADO': return 'Atestado Médico';
    default: return type;
  }
}

export default async function PontoManagePage(props) {
  const { params } = props;
  const searchParams = await props.searchParams;
  const id = (await params).id;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return <div>Usuário não encontrado.</div>;
  }

  // --- REGRAS DE MÊS / FILTRO ---
  const queryMonth = searchParams?.month; 
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

  const startOfMonth = new Date(refYear, refMonth - 1, 1);
  const endOfMonth = new Date(refYear, refMonth, 0, 23, 59, 59, 999);

  const monthRecords = await prisma.timeRecord.findMany({
    where: { userId: id, timestamp: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { timestamp: 'desc' }
  });

  // --- CÁLCULOS ANALÍTICOS ---
  const calendar = generateMonthCalendarLogic(refYear, refMonth, monthRecords, user.freeDays);
  const analytics = generateAnalytics(calendar, user.hourlyRate);

  // --- ACTIONS ---
  const addAction = addManualTimeRecord.bind(null, id);
  const batchAction = addBatchManualTimeRecords.bind(null, id);

  return (
    <div id="pdf-export-area" className="print-area-wrapper">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Gestão de Ponto Individual</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Analisando o Perfil de: <strong style={{color:'white'}}>{user.name}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <MonthSelector currentMonth={refMonth} currentYear={refYear} role="ADMIN" />
          <Link href="/admin" className="btn-secondary">Voltar</Link>
        </div>
      </div>
      
      {/* HEADER DE RELATÓRIO PDF APENAS (Visível na impressão/exportação) */}
      <div style={{ display: 'none', marginBottom: '24px' }} className="print-only-show">
          <h1 style={{ fontSize: '28px', color: '#000' }}>Relatório Oficial de Assiduidade</h1>
          <p style={{ color: '#444' }}>Funcionário: <strong>{user.name}</strong> | Competência: {refMonth.toString().padStart(2, '0')}/{refYear}</p>
          <hr style={{ margin: '16px 0', borderColor: '#CCC' }} />
      </div>

      {/* DASHBOARD ANALÍTICO SUPERIOR */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--accent-color)' }}>Dossiê do Mês ({refMonth.toString().padStart(2, '0')}/{refYear})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Total à Pagar</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color)' }} className="print-text-dark">R$ {analytics.totalEarnings.toFixed(2).replace('.', ',')}</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Horas Líquidas</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold' }} className="print-text-dark">{analytics.totalHours.toFixed(1)}h</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Dias Trabalhados</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold' }} className="print-text-dark">{analytics.workedDays} dias</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Domingos (Plantões)</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: analytics.sundaysWorked > 0 ? 'var(--warning-color)' : 'white' }} className="print-text-dark">{analytics.sundaysWorked}</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Faltas Diretas</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: analytics.faltas > 0 ? 'var(--danger-color)' : 'white' }} className="print-text-dark">{analytics.faltas}</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Atestados (Absenteísmo)</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: analytics.atestados > 0 ? 'var(--warning-color)' : 'white' }} className="print-text-dark">{analytics.atestados}</div>
          </div>
          <div>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="print-text-dark">Dias Livres Observados</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold' }} className="print-text-dark">{analytics.notWorkedDays}</div>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 300px' }} className="no-print">
          {/* FORM TO ADD MANUAL RECORD (Singular) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Registro Único</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Caso o funcionário tenha esquecido de bater o ponto ou tenha faltado, insira manualmente:
            </p>
            <form action={addAction}>
              <div className="input-group">
                <label className="input-label">Tipo de Ponto / Ocorrência</label>
                <select name="type" className="input-field" required>
                  <option value="ENTRADA">Entrada</option>
                  <option value="PAUSA_ALMOCO">Pausa Almoço</option>
                  <option value="RETORNO_ALMOCO">Retorno Almoço</option>
                  <option value="SAIDA">Saída</option>
                  <option value="FALTA" style={{ color: 'var(--danger-color)' }}>Falta Não Justificada</option>
                  <option value="ATESTADO" style={{ color: 'var(--warning-color)' }}>Atestado / Justificada</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Data</label>
                <input type="date" name="date" className="input-field" required />
              </div>
              <div className="input-group">
                <label className="input-label">Horário (HH:MM)</label>
                <input type="time" name="time" className="input-field" required />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Registrar Unidade
              </button>
            </form>
          </div>

          {/* BATCH INSERT FORM */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Inserção em Lote (Dia)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Preencha os horários em lote para o fluxo completo do dia de uma só vez:
            </p>
            <form action={batchAction}>
              <div className="input-group">
                <label className="input-label">Data</label>
                <input type="date" name="date" className="input-field" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px' }}>
                <div className="input-group">
                  <label className="input-label">Entrada</label>
                  <input type="time" name="entrada" className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Pausa</label>
                  <input type="time" name="pausa" className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Retorno</label>
                  <input type="time" name="retorno" className="input-field" />
                </div>
                <div className="input-group">
                  <label className="input-label">Saída</label>
                  <input type="time" name="saida" className="input-field" />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px', backgroundColor: 'var(--success-color)' }}>
                Registrar Lote
              </button>
            </form>
          </div>
        </div>

        {/* LIST OF RECORDS */}
        <div className="glass-panel" style={{ padding: '24px', flex: '2 1 400px' }}>
           <CalendarList calendar={calendar} isAdmin={true} userId={id} />
        </div>
      </div>
    </div>
  );
}
