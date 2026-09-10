import { prisma } from '@/lib/db';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { generateMonthCalendarLogic, generateAnalytics } from '@/lib/calculations';
import MonthSelector from '@/components/MonthSelector';

export default async function AdminPage(props) {
  const searchParams = await props.searchParams;
  
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

  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    orderBy: { name: 'asc' }
  });

  const monthRecords = await prisma.timeRecord.findMany({
    where: { timestamp: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { timestamp: 'asc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>Gestão de Funcionários</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Mês: {refMonth.toString().padStart(2, '0')}/{refYear}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <MonthSelector currentMonth={refMonth} currentYear={refYear} role="ADMIN" />
          <Link href="/admin/new" className="btn-primary" style={{ width: 'auto', padding: '10px 16px', display: 'inline-block' }}>
            + Novo Funcionário
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>Nome</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>Valor Hora</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', color: 'var(--success-color)', whiteSpace: 'nowrap' }}>À Pagar (Mês)</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>Prévia Ativa?</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            ) : (
              users.map(user => {
                const userRecords = monthRecords.filter(r => r.userId === user.id);
                const calendar = generateMonthCalendarLogic(refYear, refMonth, userRecords, user.freeDays);
                const analytics = generateAnalytics(calendar, user.hourlyRate);

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{user.name}<br/><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</span></td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>R$ {user.hourlyRate.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--success-color)', whiteSpace: 'nowrap' }}>R$ {analytics.totalEarnings.toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                      backgroundColor: user.canViewPreview ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: user.canViewPreview ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      {user.canViewPreview ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/edit/${user.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Editar</Link>
                    <Link href={`/admin/ponto/${user.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Ponto</Link>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
