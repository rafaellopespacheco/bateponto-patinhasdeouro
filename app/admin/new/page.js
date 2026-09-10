import { createUser } from '@/app/admin/actions';
import Link from 'next/link';

export default function NewEmployeePage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Novo Funcionário</h1>
        <Link href="/admin" className="btn-secondary">Voltar</Link>
      </div>

      <div className="glass-panel" style={{ padding: '32px', maxWidth: '600px' }}>
        <form action={createUser}>
          <div className="input-group">
            <label className="input-label">Nome Completo</label>
            <input type="text" name="name" className="input-field" required />
          </div>
          
          <div className="input-group">
            <label className="input-label">Email de Login</label>
            <input type="email" name="email" className="input-field" required />
          </div>

          <div className="input-group">
            <label className="input-label">Senha Provisória</label>
            <input type="password" name="password" className="input-field" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Valor Hora (R$)</label>
              <input type="number" step="0.01" name="hourlyRate" className="input-field" defaultValue="0.00" required />
            </div>

            <div className="input-group">
              <label className="input-label">Horário de Entrada Esp. (HH:MM)</label>
              <input type="time" name="expectedEntryTime" className="input-field" defaultValue="08:00" required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Tempo Limite de Almoço (minutos)</label>
            <input type="number" name="lunchBreakLimitMin" className="input-field" defaultValue="60" required />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <input type="checkbox" id="canViewPreview" name="canViewPreview" style={{ width: '18px', height: '18px' }} />
            <label htmlFor="canViewPreview" className="input-label" style={{ cursor: 'pointer' }}>
              Permitir que o funcionário veja o Painel de Prévia Financeira
            </label>
          </div>

          <button type="submit" className="btn-primary">Criar Funcionário</button>
        </form>
      </div>
    </div>
  );
}
