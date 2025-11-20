import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../styles/estadisticas.css';

export function GraficoEstados({ data }) {
  const COLORES = {
    'pendiente': '#FFD700',
    'confirmada': '#87CEEB',
    'cancelada': '#87CEEB',
    'completada': '#FFD700'
  };

  const dataFormateada = data.map(item => ({
    name: item.estado.charAt(0).toUpperCase() + item.estado.slice(1),
    value: item.total,
    estado: item.estado
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value} citas</p>
        </div>
      );
    }
    return null;
  };

  const labelRenderer = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`;

  return (
    <div className="grafico-card">
      <h3 className="grafico-titulo">Distribución de Citas por Estado</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataFormateada}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={labelRenderer}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {dataFormateada.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORES[entry.estado] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}