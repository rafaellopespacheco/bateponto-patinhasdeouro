import { prisma } from '@/lib/db';
import Link from 'next/link';
import { updateTimeRecord } from '@/app/admin/actions';

export default async function EditTimeRecordPage({ params }) {
  const { id, recordId } = await params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  const record = await prisma.timeRecord.findUnique({
    where: { id: recordId }
  });

  if (!user || !record) {
    return <div>Registro não localizado.</div>;
  }

  const dt = new Date(record.timestamp);
  // Remove fuso horário deslocamento extraindo a string raw formatada yyyy-MM-dd e HH:mm
  const dateStr = dt.toISOString().split('T')[0];
  const timeStr = dt.toTimeString().split(' ')[0].slice(0, 5);

  const updateAction = updateTimeRecord.bind(null, recordId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Editar Ponto: {user.name}</h1>
        <Link href={`/admin/ponto/${id}`} className="btn-secondary">Voltar</Link>
      </div>

      <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px' }}>
        <form action={updateAction}>
          <div className="input-group">
            <label className="input-label">Tipo de Ponto</label>
            <select name="type" className="input-field" defaultValue={record.type} required>
              <option value="ENTRADA">Entrada</option>
              <option value="PAUSA_ALMOCO">Pausa Almoço</option>
              <option value="RETORNO_ALMOCO">Retorno Almoço</option>
              <option value="SAIDA">Saída</option>
              <option value="FALTA" style={{ color: 'var(--danger-color)' }}>Falta Computada</option>
              <option value="ATESTADO" style={{ color: 'var(--warning-color)' }}>Atestado Médico</option>
            </select>
          </div>
          
          <div className="input-group">
            <label className="input-label">Data Realizada</label>
            <input type="date" name="date" className="input-field" defaultValue={dateStr} required />
          </div>

          <div className="input-group">
            <label className="input-label">Hora (Atual: {timeStr})</label>
            <input type="time" name="time" className="input-field" defaultValue={timeStr} required />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Salvar Alteração
          </button>
        </form>
      </div>
    </div>
  );
}
