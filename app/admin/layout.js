import { redirect } from 'next/navigation';
import { getSession, deleteSession } from '@/lib/session';

export default async function AdminLayout({ children }) {
  const session = await getSession();
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--success-color)' }}>
          Patinhas de Ouro | Admin
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Logado como Admin
          </span>
          <form action="/api/auth/logout" method="POST" style={{ display: 'inline' }}>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }}>
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
