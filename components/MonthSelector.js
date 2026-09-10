"use client";

import { useRouter, useSearchParams } from 'next/navigation';

export default function MonthSelector({ currentMonth, currentYear, role }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (e) => {
    const val = e.target.value;
    if (!val) {
       router.push('?');
       return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('month', val);
    router.push(`?${params.toString()}`);
  };

  const selectedValue = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  if (role === 'ADMIN') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label className="input-label" style={{ marginBottom: 0 }}>Consultar Mês:</label>
        <input 
          type="month" 
          value={selectedValue} 
          onChange={handleMonthChange} 
          className="input-field" 
          style={{ width: 'auto', padding: '6px 12px' }} 
        />
      </div>
    );
  }

  // Se for funcionário, gerar lista dos últimos 3 a 5 meses
  const options = [];
  const startD = new Date();
  
  for (let i = 0; i < 4; i++) {
    const d = new Date(startD.getFullYear(), startD.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const val = `${yr}-${mo.toString().padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label className="input-label" style={{ marginBottom: 0 }}>Visualizar Meses:</label>
      <select 
        value={selectedValue} 
        onChange={handleMonthChange} 
        className="input-field" 
        style={{ width: 'auto', padding: '6px 12px' }}
      >
        {options.map((opt, i) => (
          <option key={opt.val} value={opt.val}>{i === 0 ? 'Mês Atual' : opt.label}</option>
        ))}
      </select>
    </div>
  );
}
