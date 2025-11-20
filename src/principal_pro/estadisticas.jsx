import React, { useState, useEffect } from 'react';
import { ResumenCards } from '../panel/ResumenCards';
import { GraficoEstados } from '../panel/GraficoEstados';
import { GraficoMensual } from '../panel/GraficoMensual';
import { TablaTopClientes } from '../panel/TablaTopClientes';
import { GraficoHorarios } from '../panel/GraficoHorarios';
import "../styles/estadisticas.css";
import "../styles/buscar.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function Estadisticas() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '',
    hora_fin: ''
  });

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token_pro');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Construir URL con filtros
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      
      const url = `${API_URL}/citas/estadisticas${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setEstadisticas(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const aplicarFiltros = () => {
    cargarEstadisticas();
  };

  const limpiarFiltros = () => {
    setFiltros({ fecha_inicio: '', fecha_fin: '' });
    setTimeout(() => cargarEstadisticas(), 100);
  };

  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  if (loading) {
    return (
      <section className="pagos-pendientes-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pagos-pendientes-container">
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button onClick={cargarEstadisticas} className="btn-retry">
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-seccion">
        <h1 className='titulo-seccion'>Panel de Estadísticas</h1>
        <p className='subtitulo-seccion'>Analiza el rendimiento de tu servicio</p>
      </div>

      {/* Filtros estilo Buscar */}
      <div className="barra-busqueda-avanzada">
        <div className="filtros-busqueda">
          <div className="filtro-fecha-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => actualizarFiltro('fecha_inicio', e.target.value)}
              className="selector-filtro"
            />
          </div>
          <div className="filtro-fecha-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => actualizarFiltro('fecha_fin', e.target.value)}
              className="selector-filtro"
            />
          </div>
          <button onClick={aplicarFiltros} className="btn-aplicar-buscar">
            Aplicar Filtros
          </button>
          <button onClick={limpiarFiltros} className="btn-limpiar-buscar">
            Limpiar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <ResumenCards resumen={estadisticas.resumen} />

      {/* Grid de Gráficos */}
      <div className="graficos-grid">
        <div className="grafico-col-2">
          <GraficoEstados data={estadisticas.citas_por_estado} />
        </div>
        <div className="grafico-col-2">
          <GraficoHorarios data={estadisticas.horarios_populares} />
        </div>
      </div>

      <div className="grafico-full">
        <GraficoMensual data={estadisticas.citas_por_mes} />
      </div>

      <div className="grafico-full">
        <TablaTopClientes data={estadisticas.top_clientes} />
      </div>
    </section>
  );
}