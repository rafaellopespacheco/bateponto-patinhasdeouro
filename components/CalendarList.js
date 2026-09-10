"use client";
import { useState } from 'react';
import Link from 'next/link';
import { deleteTimeRecord } from '@/app/admin/actions';

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

export default function CalendarList({ calendar, isAdmin, userId }) {
  const [showFuture, setShowFuture] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredCalendar = showFuture ? calendar : calendar.filter(d => d.status !== 'FUTURO');

  const handlePrint = () => {
    setMenuOpen(false);
    window.print();
  };

  const handleDigitalPDF = async () => {
    setMenuOpen(false);
    const html2pdf = (await import('html2pdf.js')).default;
    
    let element = document.getElementById('pdf-export-area');
    if (!element) {
        element = document.getElementById('fallback-pdf-area');
    }
    
    const opt = {
      margin:       5,
      filename:     `extrato-ponto-${userId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
          scale: 2,
          backgroundColor: '#0f172a', /* Força fundo para bater com opacity */
          scrollY: 0,
          useCORS: true,
          ignoreElements: (element) => {
             if (element.classList && element.classList.contains('no-print')) {
                return true;
             }
             return false;
          }
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px' }}>Extrato Mensal Completo</h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => setShowFuture(!showFuture)} 
            className="btn-secondary" 
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            {showFuture ? 'Ocultar Dias Futuros' : 'Mostrar Dias Futuros'}
          </button>
          
          {isAdmin && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="btn-secondary" 
                style={{ width: '36px', height: '36px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                title="Opções de Exportação PDF"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
              </button>
              
              {menuOpen && (
                 <div style={{ 
                    position: 'absolute', right: 0, top: '44px',
                    backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px',
                    width: '200px', boxShadow: 'var(--shadow-lg)', zIndex: 50
                 }}>
                    <button onClick={handlePrint} className="btn-secondary" style={{ fontSize: '13px', textAlign: 'left', padding: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      📑 Visual Simples / Impresso
                    </button>
                    <button onClick={handleDigitalPDF} className="btn-primary" style={{ fontSize: '13px', textAlign: 'left', padding: '8px' }}>
                      📲 Baixar Estilizado (Cores)
                    </button>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div id="fallback-pdf-area" className="print-area-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredCalendar.map((day) => {
            let rowColor = 'rgba(0,0,0,0.2)';
            let statusLabel = '';
            let isWarning = false;
            let isDanger = false;

            if (day.status === 'TRABALHADO') {
               statusLabel = 'Trabalhado';
            } else if (day.status === 'DOMINGO' || day.status === 'LIBERADO') {
               statusLabel = day.status === 'DOMINGO' ? 'Domingo' : 'Folga / Liberado';
               rowColor = 'rgba(255,255,255,0.02)';
            } else if (day.status === 'FALTA' || day.status === 'FALTA_AUTOMATICA') {
               statusLabel = 'FALTA';
               rowColor = 'rgba(239, 68, 68, 0.1)';
               isDanger = true;
            } else if (day.status === 'ATESTADO') {
               statusLabel = 'Atestado Médico';
               rowColor = 'rgba(234, 179, 8, 0.1)';
               isWarning = true;
            } else if (day.status === 'FUTURO') {
               statusLabel = 'Data Futura';
               rowColor = 'transparent';
               isWarning = false;
            }

            return (
               <div key={day.date} className="calendar-row" style={{ 
                 backgroundColor: rowColor, 
                 padding: '16px', 
                 borderRadius: '8px',
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 pageBreakInside: 'avoid',
                 borderLeft: isDanger ? '4px solid var(--danger-color)' : (isWarning ? '4px solid var(--warning-color)' : '4px solid transparent')
               }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '15px' }}>
                      {day.date}
                    </h4>
                    <span style={{ fontSize: '12px', color: isDanger ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                      {statusLabel}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {day.records.length === 0 && day.status === 'TRABALHADO' && (
                      <span style={{ color: 'var(--text-secondary)' }}>Sem registros parciais</span>
                    )}
                    {day.records.map(r => {
                      const dt = new Date(r.timestamp);
                      let badgeColor = 'var(--text-secondary)';
                      
                      if (r.type === 'ENTRADA') badgeColor = 'var(--success-color)';
                      if (r.type === 'SAIDA') badgeColor = 'var(--danger-color)';
                      if (r.type === 'PAUSA_ALMOCO' || r.type === 'RETORNO_ALMOCO') badgeColor = 'var(--warning-color)';
                      
                      return (
                        <div key={r.id} style={{ 
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '4px 10px', borderRadius: '20px', 
                          backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${badgeColor}`,
                          fontSize: '13px'
                        }}>
                          <span style={{ color: badgeColor }}>{getLabelByType(r.type)}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {isAdmin && (
                             <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                               <Link href={`/admin/ponto/${userId}/edit/${r.id}`} className="no-print" style={{ color: 'var(--accent-color)', fontSize: '11px', textDecoration: 'none' }}>
                                 ✏️ Editar
                               </Link>
                               <button onClick={async () => {
                                 if(confirm('Tem certeza que deseja excluir esse ponto?')) {
                                   await deleteTimeRecord(r.id, userId);
                                 }
                               }} className="no-print" style={{ color: 'var(--danger-color)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                 🗑️ Excluir
                               </button>
                             </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
