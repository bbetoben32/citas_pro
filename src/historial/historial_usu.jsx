import { useState, useEffect } from 'react';
import { FaPhone, FaCalendarAlt, FaBook, FaCheckCircle } from "react-icons/fa";

export function Historial_usu() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        const token = localStorage.getItem('token');
        setCargando(true);
        
        try {
            // Obtener todas las citas del cliente (sin filtrar por estado)
            let url = '`${API_URL}/citas/cliente';
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const ahora = new Date();
                
                // Filtrar citas que ya pasaron (fecha + hora_fin < ahora)
                const citasPasadas = data.filter(cita => {
                    const fechaHoraFin = new Date(`${cita.fecha}T${cita.hora_fin}`);
                    return fechaHoraFin < ahora;
                });
                
                // Ordenar de más reciente a más antigua
                const citasOrdenadas = citasPasadas.sort((a, b) => {
                    const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`);
                    const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`);
                    return fechaB - fechaA;
                });
                
                setCitas(citasOrdenadas);
            } else {
                console.error('Error al cargar historial');
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
        return <div>Cargando historial...</div>;
    }

    if (citas.length === 0) {
        return <div>No tienes citas en tu historial</div>;
    }

    return (
        <>
            {citas.map((cita) => (
                <section className='cr historial-card' key={cita.id}>
                    <div className="encabezado-historial">
                        <span>Cita completada</span>
                        <div className="estado-badge">
                            <FaCheckCircle className="badge-icon" />
                            <span>Finalizada</span>
                        </div>
                    </div>

                    <div className="content">
                        <div className="info-main-card-historial">
                            {/* Sección Información de la Cita */}
                            <div className="section section-destacada">
                                <div className="section-header">
                                    <FaCalendarAlt className="section-icon" />
                                    <h2>Información de la Cita</h2>
                                </div>
                                
                                <div className="info-item">
                                    <div className="info-label">
                                        <h4>Profesional</h4>
                                    </div>
                                    <div className="info-value info-destacada">
                                        {cita.profesional_nombre}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">
                                        <h4>Profesión</h4>
                                    </div>
                                    <div className="info-value">
                                        {cita.ocupacion}
                                    </div>
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
                            </div>

                            {/* Sección Detalles del Servicio */}
                            <div className="section">
                                <div className="section-header">
                                    <FaBook className="section-icon" />
                                    <h2>Detalles del Servicio</h2>
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

                                <div className="info-item">
                                    <div className="info-label">
                                        <h4>Duración</h4>
                                    </div>
                                    <div className="info-value">
                                        {cita.duracion} hora(s)
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

                            {/* Sección Contacto */}
                            <div className="section">
                                <div className="section-header">
                                    <FaPhone className="section-icon" />
                                    <h2>Contacto</h2>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">
                                        <h4>Teléfono Profesional</h4>
                                    </div>
                                    <div className="info-value">
                                        <FaPhone className="inline-icon" />
                                        {cita.profesional_telefono}
                                    </div>
                                </div>

                                {cita.observaciones && (
                                    <div className="info-item">
                                        <div className="info-label">
                                            <h4>Observaciones</h4>
                                        </div>
                                        <div className="info-value info-observaciones">
                                            {cita.observaciones}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ))}
        </>
    );
}