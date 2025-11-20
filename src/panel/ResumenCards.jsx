import '../styles/estadisticas.css';

export function ResumenCards({ resumen }) {
  const cards = [
    {
      titulo: 'Total Citas',
      valor: resumen.total_citas || 0,
      icon: 'fa-solid fa-calendar-days',
      color: '#87CEEB',
      subtitulo: `${resumen.citas_pagadas || 0} pagadas`
    },
    {
      titulo: 'Ingresos Confirmados',
      valor: `$${(resumen.ingresos_confirmados || 0).toLocaleString()}`,
      icon: 'fa-solid fa-dollar-sign',
      color: '#FFD700',
      subtitulo: 'Pagos recibidos'
    },
    {
      titulo: 'Ingresos Pendientes',
      valor: `$${(resumen.ingresos_pendientes || 0).toLocaleString()}`,
      icon: 'fa-solid fa-chart-line',
      color: '#87CEEB',
      subtitulo: 'Por cobrar'
    },
    {
      titulo: 'Tasa de Cancelación',
      valor: `${resumen.tasa_cancelacion || 0}%`,
      icon: 'fa-solid fa-exclamation-circle',
      color: '#FFD700',
      subtitulo: 'Del total de citas'
    }
  ];

  return (
    <div className="resumen-grid">
      {cards.map((card, index) => {
        return (
          <div key={index} className="resumen-card">
            <div className="resumen-card-header">
              <div className="resumen-icon">
                <i className={card.icon} style={{ color: '#102e50', fontSize: '32px' }}></i>
              </div>
              <h3 className="resumen-card-titulo">{card.titulo}</h3>
            </div>
            <div className="resumen-card-body">
              <p className="resumen-valor">{card.valor}</p>
              <p className="resumen-subtitulo">{card.subtitulo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}