import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaPhone, FaCalendarAlt, FaEnvelope, FaUser, FaInfoCircle } from "react-icons/fa";
import { SiCashapp } from "react-icons/si";
import { CitaModal } from './Cita_recha_ace';
import '../styles/citas_pen.css';

export function Citas_pendi() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [accionModal, setAccionModal] = useState(null);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);

    useEffect(() => {
        cargarCitasPendientes();
    }, []);

    const cargarCitasPendientes = async () => {
        const token = localStorage.getItem('token_pro');
        
        try {
            const response = await fetch('`${API_URL}/citas/profesional?estado=pendiente', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCitas(data);
            } else {
                try {
                    const errorData = await response.json();
                    console.error('Error al cargar citas:', response.status, errorData);
                    alert(`Error del servidor: ${errorData.error || errorData.message || 'Error desconocido'}`);
                } catch {
                    console.error('Error al cargar citas:', response.status);
                    alert(`Error del servidor (${response.status}). Verifica la consola del backend.`);
                }
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error al conectar con el servidor. Verifica que el backend esté ejecutándose.');
        } finally {
            setCargando(false);
        }
    };

    const formatearFecha = (fecha) => {
        const date = new Date(fecha + 'T00:00:00');
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', opciones);
    };

    const formatearHora = (hora) => {
        try {
            const [h, m] = hora.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m));
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return hora;
        }
    };

    const abrirModal = (cita, accion) => {
        setCitaSeleccionada(cita);
        setAccionModal(accion);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setCitaSeleccionada(null);
        setAccionModal(null);
    };

    const confirmarAccion = async (datos) => {
        if (!citaSeleccionada) return;

        setProcesando(citaSeleccionada.id);
        const token = localStorage.getItem('token_pro');

        try {
            const body = accionModal === 'aceptar' 
                ? {
                    accion: 'aceptar',
                    lugar: datos.lugar,
                    modalidad: datos.modalidad
                }
                : {
                    accion: 'rechazar',
                    motivo_rechazo: datos.motivo || 'No especificado'
                };

            const response = await fetch(``${API_URL}/citas/${citaSeleccionada.id}/responder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert(accionModal === 'aceptar' ? 'Cita aceptada exitosamente' : 'Cita rechazada');
                setCitas(citas.filter(cita => cita.id !== citaSeleccionada.id));
                cerrarModal();
            } else {
                const error = await response.json();
                alert(error.error || `Error al ${accionModal} la cita`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        } finally {
            setProcesando(null);
        }
    };

    if (cargando) {
        return (
            <div>Cargando citas pendientes...</div>
        );
    }

    if (citas.length === 0) {
        return (
            <div>No tienes citas pendientes</div>
        );
    }

    return (
        <>
            {citas.map((cita) => (
                <section key={cita.id} className='citasPendientesContenedor'>
                    <div className="citasPendientesContent">
                        <div className="citasPendientesGridPrincipal">
                            {/* Cliente Section */}
                            <div className="citasPendientesSeccionTarjeta">
                                <div className="citasPendientesSeccionEncabezado">
                                    <FaUser className="citasPendientesIconoSeccion"/>
                                    <h2>Clientes</h2>
                                </div>
                                <div className="citasPendientesCabeceraProf">
                                    <div className="citasPendientesItemInfo">
                                        <div className="citasPendientesEtiquetaInfo">
                                            <h4>Nombre</h4>
                                        </div>
                                        <div className="citasPendientesValorInfo">
                                            <span>{cita.cliente_nombre}</span>
                                        </div>
                                    </div>
                                    <div className="citasPendientesItemInfo">
                                        <div className="citasPendientesEtiquetaInfo">
                                            <h4>Correo</h4>
                                        </div>
                                        <div className="citasPendientesValorInfo">
                                            <FaEnvelope className="citasPendientesIconoInline" />
                                            <span>{cita.cliente_correo}</span>
                                        </div>
                                    </div>
                                    <div className="citasPendientesItemInfo">
                                        <div className="citasPendientesEtiquetaInfo">
                                            <h4>Teléfono</h4>
                                        </div>
                                        <div className="citasPendientesValorInfo">
                                            <FaPhone className="citasPendientesIconoInline" />
                                            <span>{cita.cliente_telefono}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fecha y Hora Section */}
                            <div className="citasPendientesSeccionTarjeta">
                                <div className="citasPendientesSeccionEncabezado">
                                    <FaCalendarAlt className="citasPendientesIconoSeccion"/>
                                    <h2>Fecha y Hora</h2>
                                </div>

                                <div className="citasPendientesItemInfo">
                                    <div className="citasPendientesEtiquetaInfo">
                                        <h4>Fecha</h4>
                                    </div>
                                    <div className="citasPendientesValorInfo">
                                        <span>{formatearFecha(cita.fecha)}</span>
                                    </div>
                                </div>

                                <div className="citasPendientesItemInfo">
                                    <div className="citasPendientesEtiquetaInfo">
                                        <h4>Horario</h4>
                                    </div>
                                    <div className="citasPendientesValorInfo">
                                        <span>{formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}</span>
                                    </div>
                                </div>

                                <div className="citasPendientesItemInfo">
                                    <div className="citasPendientesEtiquetaInfo">
                                        <h4>Duración</h4>
                                    </div>
                                    <div className="citasPendientesValorInfo">
                                        <span>{cita.duracion} hora(s)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Motivo y Notas Section */}
                            <div className="citasPendientesSeccionTarjeta">
                                <div className="citasPendientesSeccionEncabezado">
                                    <FaInfoCircle className="citasPendientesIconoSeccion"/>
                                    <h2>Detalles</h2>
                                </div>

                                {cita.motivo && (
                                    <div className="citasPendientesItemInfo">
                                        <div className="citasPendientesEtiquetaInfo">
                                            <h4>Motivo de la Consulta</h4>
                                        </div>
                                        <div className="citasPendientesValorInfo">
                                            <span>{cita.motivo}</span>
                                        </div>
                                    </div>
                                )}

                                {cita.notas_cliente && (
                                    <div className="citasPendientesItemInfo">
                                        <div className="citasPendientesEtiquetaInfo">
                                            <h4>Notas Adicionales</h4>
                                        </div>
                                        <div className="citasPendientesValorInfo">
                                            <span>{cita.notas_cliente}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Total a Pagar Section */}
                        <div className="citasPendientesSeccionPago">
                            <div className="citasPendientesTotalPago">
                                <SiCashapp className="citasPendientesIconoPago" />
                                <div className="citasPendientesContenidoPago">
                                    <span className="citasPendientesEtiquetaPago">Total a Pagar</span>
                                    <span className="citasPendientesMontoPequeno">${parseFloat(cita.monto_total).toLocaleString('es-CO')} COP</span>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="citasPendientesBotonesAccion">
                                <button 
                                    className="citasPendientesBotonRechazar"
                                    onClick={() => abrirModal(cita, 'rechazar')}
                                    disabled={procesando === cita.id}
                                >
                                    <FaTimes />
                                    {procesando === cita.id ? 'Procesando...' : 'Rechazar'}
                                </button>
                                <button 
                                    className="citasPendientesBotonAceptar"
                                    onClick={() => abrirModal(cita, 'aceptar')}
                                    disabled={procesando === cita.id}
                                >
                                    <FaCheck />
                                    {procesando === cita.id ? 'Procesando...' : 'Aceptar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {modalAbierto && (
                <CitaModal 
                    accion={accionModal}
                    onConfirmar={confirmarAccion}
                    onCancelar={cerrarModal}
                />
            )}
        </>
    );
}