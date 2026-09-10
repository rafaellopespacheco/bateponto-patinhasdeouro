"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClockInterface({ nextAction, nextActionLabel, todayRecords }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePunchClock = async () => {
    if (nextAction === 'DONE') return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: nextAction }),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar.');
      }
      router.refresh(); // Refresh para o servidor Nextjs atualizar a UI do layout/page.js
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLabelByType = (type) => {
    switch (type) {
      case 'ENTRADA': return 'Entrada';
      case 'PAUSA_ALMOCO': return 'Pausa Almoço';
      case 'RETORNO_ALMOCO': return 'Retorno Almoço';
      case 'SAIDA': return 'Saída';
      default: return type;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Controle de Ponto Hoje</h2>
      
      {nextAction !== 'DONE' ? (
        <button 
          onClick={handlePunchClock} 
          disabled={loading}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            backgroundColor: nextAction === 'ENTRADA' ? 'var(--success-color)' : 
                             nextAction === 'SAIDA' ? 'var(--danger-color)' : 'var(--warning-color)',
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            boxShadow: 'var(--shadow-lg)',
            transition: 'transform 0.1s',
            transform: loading ? 'scale(0.95)' : 'scale(1)',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Registrando...' : nextActionLabel}
        </button>
      ) : (
        <div style={{
          width: '200px', height: '200px', borderRadius: '50%', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          border: '2px solid var(--border-color)', color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>
          Dia Finalizado
        </div>
      )}

      {error && <div className="error-text" style={{ marginTop: '16px' }}>{error}</div>}

      <div style={{ marginTop: '32px', width: '100%' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Registros de Hoje:</h3>
        {todayRecords.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--border-color)' }}>Nenhum ponto batido ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todayRecords.map(record => (
              <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: '500' }}>{getLabelByType(record.type)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
