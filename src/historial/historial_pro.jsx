import { useState, useEffect } from 'react';
import { FaPhone, FaCalendarAlt, FaBook, FaCheckCircle, FaEnvelope, FaStickyNote, FaSave, FaEdit } from "react-icons/fa";
import { SiCashapp } from "react-icons/si";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function HistorialPro() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [editandoNota, setEditandoNota] = useState(null);
    const [notaTemp, setNotaTemp] = useState('');
    const [guardandoNota, setGuardandoNota] = useState(null);

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        const token = localStorage.getItem('token_pro');
        setCargando(true);
        
        try {
            const response = await fetch(`${API_URL}/citas/profesional`, {
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

    const iniciarEdicionNota = (cita) => {
        setEditandoNota(cita.id);
        setNotaTemp(cita.notas_profesional || '');
    };

    const cancelarEdicion = () => {
        setEditandoNota(null);
        setNotaTemp('');
    };

    const guardarNota = async (citaId) => {
        setGuardandoNota(citaId);
        const token = localStorage.getItem('token_pro');

        try {
            const response = await fetch(`${API_URL}/citas/${citaId}/notas`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    notas_profesional: notaTemp
                })
            });

            if (response.ok) {
                // Actualizar la cita en el estado local
                setCitas(citas.map(cita => 
                    cita.id === citaId 
                        ? { ...cita, notas_profesional: notaTemp }
                        : cita
                ));
                setEditandoNota(null);
                setNotaTemp('');
                alert('Nota guardada exitosamente');
            } else {
                const error = await response.json();
                alert(error.error || 'Error al guardar la nota');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        } finally {
            setGuardandoNota(null);
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
        return (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
                Cargando historial...
            </div>
        );
    }

    if (citas.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
                No tienes citas en tu historial
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {citas.map((cita) => (
                <section className='cr historial-card-pro' key={cita.id}>
                    <div className="encabezado-historial-pro">
                        <span>Cita completada</span>
                        <div className="estado-badge-pro">
                            <FaCheckCircle className="badge-icon" />
                            <span>Finalizada</span>
                        </div>
                    </div>

                    <div className="content-pro">
                        <div className="info-main--historial-pro">
                            {/* Sección Información del Cliente */}
                            <div className="section-pro section-destacada-pro">
                                <div className="section-header-pro">
                                    <FaCalendarAlt className="section-icon-pro" />
                                    <h2>Información del Cliente</h2>
                                </div>
                                
                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Cliente</h4>
                                    </div>
                                    <div className="info-value-pro info-destacada-pro">
                                        {cita.cliente_nombre}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Correo</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        <FaEnvelope className="inline-icon-pro" />
                                        {cita.cliente_correo}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Teléfono</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        <FaPhone className="inline-icon-pro" />
                                        {cita.cliente_telefono}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Fecha</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        {formatearFecha(cita.fecha)}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Horario</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                                    </div>
                                </div>
                            </div>

                            {/* Sección Detalles del Servicio */}
                            <div className="section-pro">
                                <div className="section-header-pro">
                                    <FaBook className="section-icon-pro" />
                                    <h2>Detalles del Servicio</h2>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Modalidad</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        {cita.modalidad.charAt(0).toUpperCase() + cita.modalidad.slice(1)}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Ubicación</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        {cita.lugar}
                                    </div>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Duración</h4>
                                    </div>
                                    <div className="info-value-pro">
                                        {cita.duracion} hora(s)
                                    </div>
                                </div>

                                {cita.motivo && (
                                    <div className="info-item-pro">
                                        <div className="info-label-pro">
                                            <h4>Motivo</h4>
                                        </div>
                                        <div className="info-value-pro">
                                            {cita.motivo}
                                        </div>
                                    </div>
                                )}

                                <div className="section-header-pro" style={{ marginTop: '16px' }}>
                                    <SiCashapp className="section-icon-pro" />
                                    <h2>Pago</h2>
                                </div>

                                <div className="info-item-pro">
                                    <div className="info-label-pro">
                                        <h4>Monto Total</h4>
                                    </div>
                                    <div className="info-value-pro payment-amount-pro">
                                        ${parseFloat(cita.monto_total).toLocaleString('es-CO')} COP
                                    </div>
                                </div>
                            </div>

                            {/* Sección Notas Profesionales */}
                            <div className="section-pro section-notas-pro">
                                <div className="section-header-pro">
                                    <FaStickyNote className="section-icon-pro" />
                                    <h2>Notas Profesionales</h2>
                                </div>

                                {editandoNota === cita.id ? (
                                    <div className="nota-editor">
                                        <textarea
                                            className="nota-textarea"
                                            value={notaTemp}
                                            onChange={(e) => setNotaTemp(e.target.value)}
                                            placeholder="Escribe tus notas sobre esta cita..."
                                            rows={8}
                                            disabled={guardandoNota === cita.id}
                                        />
                                        <div className="nota-botones">
                                            <button
                                                className="btn-cancelar-nota"
                                                onClick={cancelarEdicion}
                                                disabled={guardandoNota === cita.id}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="btn-guardar-nota"
                                                onClick={() => guardarNota(cita.id)}
                                                disabled={guardandoNota === cita.id}
                                            >
                                                <FaSave />
                                                {guardandoNota === cita.id ? 'Guardando...' : 'Guardar Nota'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="nota-display">
                                        {cita.notas_profesional ? (
                                            <div className="nota-contenido">
                                                <p>{cita.notas_profesional}</p>
                                                <button
                                                    className="btn-editar-nota"
                                                    onClick={() => iniciarEdicionNota(cita)}
                                                >
                                                    <FaEdit />
                                                    Editar Nota
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="nota-vacia">
                                                <p>No hay notas para esta cita</p>
                                                <button
                                                    className="btn-agregar-nota"
                                                    onClick={() => iniciarEdicionNota(cita)}
                                                >
                                                    <FaStickyNote />
                                                    Agregar Nota
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}