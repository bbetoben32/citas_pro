import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import '../styles/estadisticas.css';

export function GraficoMensual({ data }) {
  const dataFormateada = data.map(item => {
    const [year, month] = item.mes.split('-');
    const fecha = new Date(year, month - 1);
    const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    
    return {
      mes: nombreMes,
      citas: item.total,
      ingresos: item.ingresos
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value" style={{ color: '#FFD700' }}>
            Citas: {payload[0].value}
          </p>
          <p className="tooltip-value" style={{ color: '#87CEEB' }}>
            Ingresos: ${payload[1].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grafico-card">
      <h3 className="grafico-titulo">Tendencia de Citas e Ingresos (Últimos 6 Meses)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dataFormateada}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mes" stroke="#6b7280" />
          <YAxis yAxisId="left" stroke="#6b7280" />
          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="citas" 
            stroke="#FFD700" 
            strokeWidth={2}
            name="Citas"
            dot={{ fill: '#FFD700', r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="ingresos" 
            stroke="#87CEEB" 
            strokeWidth={2}
            name="Ingresos ($)"
            dot={{ fill: '#87CEEB', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}