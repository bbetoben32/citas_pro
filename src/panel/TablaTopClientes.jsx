import React from 'react';
import { Award, Mail } from 'lucide-react';
import '../styles/estadisticas.css';

export function TablaTopClientes({ data }) {
  return (
    <div className="grafico-card">
      <h3 className="grafico-titulo">
        <Award size={20} style={{ marginRight: '8px' }} />
        Top 10 Clientes Frecuentes
      </h3>
      <div className="tabla-container">
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Total Citas</th>
              <th>Total Pagado</th>
              <th>Promedio/Cita</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay datos de clientes disponibles
                </td>
              </tr>
            ) : (
              data.map((cliente, index) => {
                const promedio = cliente.total_citas > 0 
                  ? (cliente.total_pagado / cliente.total_citas).toFixed(0)
                  : 0;
                
                return (
                  <tr key={index}>
                    <td>
                      <span className={`ranking-badge ${index < 3 ? 'top-three' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="cliente-info">
                        <p className="cliente-nombre">{cliente.nombre}</p>
                        <p className="cliente-correo">
                          <Mail size={14} />
                          {cliente.correo}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{cliente.total_citas}</span>
                    </td>
                    <td>
                      <span className="monto-pagado">
                        ${cliente.total_pagado.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="monto-promedio">${promedio}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}