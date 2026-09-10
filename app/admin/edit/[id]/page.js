import { updateUser } from '@/app/admin/actions';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function EditEmployeePage({ params }) {
  const { id } = await params;
  
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return <div>Usuário não encontrado.</div>;
  }

  const updateAction = updateUser.bind(null, id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Editar: {user.name}</h1>
        <Link href="/admin" className="btn-secondary">Voltar</Link>
      </div>

      <div className="glass-panel" style={{ padding: '32px', maxWidth: '600px' }}>
        <form action={updateAction}>
          <div className="input-group">
            <label className="input-label">Nome Completo</label>
            <input type="text" name="name" className="input-field" defaultValue={user.name} required />
          </div>
          
          <div className="input-group">
            <label className="input-label">Email de Login</label>
            <input type="email" name="email" className="input-field" defaultValue={user.email} required />
          </div>

          <div className="input-group">
            <label className="input-label">Nova Senha (deixe em branco para manter a atual)</label>
            <input type="password" name="password" className="input-field" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Valor Hora (R$)</label>
              <input type="number" step="0.01" name="hourlyRate" className="input-field" defaultValue={user.hourlyRate} required />
            </div>

            <div className="input-group">
              <label className="input-label">Horário de Entrada Esp. (HH:MM)</label>
              <input type="time" name="expectedEntryTime" className="input-field" defaultValue={user.expectedEntryTime} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Tempo Limite de Almoço (minutos)</label>
            <input type="number" name="lunchBreakLimitMin" className="input-field" defaultValue={user.lunchBreakLimitMin} required />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <input type="checkbox" id="canViewPreview" name="canViewPreview" defaultChecked={user.canViewPreview} style={{ width: '18px', height: '18px' }} />
            <label htmlFor="canViewPreview" className="input-label" style={{ cursor: 'pointer' }}>
              Permitir que o funcionário veja o Painel de Prévia Financeira
            </label>
          </div>

          <button type="submit" className="btn-primary">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}
