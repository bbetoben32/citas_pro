import { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
import { FaPhone, FaCalendarAlt, FaBook, FaUser } from "react-icons/fa";
import { RecordatorioButton } from './recordatorio_button';

export function MiCitaspro() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarCitas();
    }, []);

    const cargarCitas = async () => {
        const token = localStorage.getItem('token_pro');
        
        if (!token) {
            console.error('❌ No hay token en localStorage');
            alert('No hay sesión activa. Por favor inicia sesión nuevamente.');
            setCargando(false);
            return;
        }
        
        console.log('🔑 Token siendo usado:', token.substring(0, 20) + '...');
        setCargando(true);
        
        try {
            // Cambio: endpoint para profesionales
            let url = '`${API_URL}/citas/profesional?estado=pagada';
            
            console.log('📡 Llamando a:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Datos recibidos del servidor:', data);
                console.log('Cantidad de citas:', data.length);
                
                const ahora = new Date();
                const citasFuturas = data.filter(cita => {
                    const fechaCita = new Date(`${cita.fecha}T${cita.hora_inicio}`);
                    return fechaCita >= ahora;
                });
                console.log('Citas futuras:', citasFuturas.length);
                
                const citasOrdenadas = citasFuturas.sort((a, b) => {
                    const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`);
                    const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`);
                    return fechaA - fechaB;
                });
                setCitas(citasOrdenadas);
            } else {
                console.error('Error al cargar citas. Status:', response.status);
                const errorText = await response.text();
                console.error('Error detalles:', errorText);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    const formatearFecha = (fecha) => {
        const date = new Date(fecha + 'T00:00:00');
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (hora) => {
        try {
            const [h, m] = hora.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m));
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return hora;
        }
    };

    if (cargando) {
        return <div>Cargando...</div>;
    }

    if (citas.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>No tienes citas pagadas programadas</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                    Aquí aparecerán las citas confirmadas y pagadas que los clientes agenden contigo.
                </p>
            </div>
        );
    }

    return (
        <>
            {citas.map((cita) => {
                return (
                    <section className='cr' key={cita.id}>
                        <div className="encabezado">
                            <span>Cita pagada y confirmada</span>
                        </div>

                        <div className="content">
                            <div className="info-main-card">
                                {/* Sección Cliente (cambio principal) */}
                                <div className="section">
                                    <div className="section-header">
                                        <FaUser className="section-icon" />
                                        <h2>Cliente</h2>
                                    </div>
                                    <div className="profesional-header">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <h4>Nombre</h4>
                                            </div>
                                            <div className="info-value">
                                                {cita.cliente_nombre}
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">
                                                <h4>Teléfono</h4>
                                            </div>
                                            <div className="info-value">
                                                <FaPhone className="inline-icon" />
                                                {cita.cliente_telefono}
                                            </div>
                                        </div>
                                        {cita.cliente_email && (
                                            <div className="info-item">
                                                <div className="info-label">
                                                    <h4>Email</h4>
                                                </div>
                                                <div className="info-value">
                                                    {cita.cliente_email}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sección Fecha y Hora */}
                                <div className="section">
                                    <div className="section-header">
                                        <FaCalendarAlt className="section-icon" />
                                        <h2>Fecha y Hora</h2>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Fecha</h4>
                                        </div>
                                        <div className="info-value">
                                            {formatearFecha(cita.fecha)}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Horario</h4>
                                        </div>
                                        <div className="info-value">
                                            {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Duración</h4>
                                        </div>
                                        <div className="info-value">
                                            {cita.duracion} hora(s)
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Detalles de la Cita */}
                                <div className="section">
                                    <div className="section-header">
                                        <FaBook className="section-icon" />
                                        <h2>Detalles de la Cita</h2>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Modalidad</h4>
                                        </div>
                                        <div className="info-value">
                                            {cita.modalidad.charAt(0).toUpperCase() + cita.modalidad.slice(1)}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Ubicación</h4>
                                        </div>
                                        <div className="info-value">
                                            {cita.lugar}
                                        </div>
                                    </div>

                                    {cita.motivo && (
                                        <div className="info-item">
                                            <div className="info-label">
                                                <h4>Motivo</h4>
                                            </div>
                                            <div className="info-value">
                                                {cita.motivo}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botón de recordatorio */}
                            <RecordatorioButton cita={cita} />
                        </div>
                    </section>
                );
            })}
        </>
    );
}