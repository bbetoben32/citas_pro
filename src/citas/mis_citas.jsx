import { useState, useEffect } from 'react';
import { FaPhone, FaCalendarAlt, FaBook, FaClock } from "react-icons/fa";
import { RecordatorioButton } from './recordatorio_button';
import API_URL from '../config/api';

export function Mi_Citas() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarCitas();
    }, []);

    const cargarCitas = async () => {
        const token = localStorage.getItem('token');
        setCargando(true);
        
        try {
            let url = 'http://localhost:5000/citas/cliente?estado=pagada';
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const ahora = new Date();
                const citasFuturas = data.filter(cita => {
                    const fechaCita = new Date(`${cita.fecha}T${cita.hora_inicio}`);
                    return fechaCita >= ahora;
                });
                const citasOrdenadas = citasFuturas.sort((a, b) => {
                    const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`);
                    const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`);
                    return fechaA - fechaB;
                });
                setCitas(citasOrdenadas);
            } else {
                console.error('Error al cargar citas');
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
        return <div>No tienes citas pagadas</div>;
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
                                {/* Sección Profesional */}
                                <div className="section">
                                    <div className="section-header">
                                        <h2>Profesional</h2>
                                    </div>
                                    <div className="profesional-header">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <h4>Nombre</h4>
                                            </div>
                                            <div className="info-value">
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
                                                <h4>Teléfono</h4>
                                            </div>
                                            <div className="info-value">
                                                <FaPhone className="inline-icon" />
                                                {cita.profesional_telefono}
                                            </div>
                                        </div>
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