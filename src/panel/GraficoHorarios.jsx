import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import '../styles/estadisticas.css';

export function GraficoHorarios({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">{payload[0].value} citas agendadas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grafico-card">
      <h3 className="grafico-titulo">
        <Clock size={20} style={{ marginRight: '8px' }} />
        Horarios Más Solicitados
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="hora" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="total" 
            fill="#87CEEB" 
            radius={[8, 8, 0, 0]}
            name="Citas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}