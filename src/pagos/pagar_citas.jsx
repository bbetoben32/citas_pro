import { useState, useEffect, useCallback } from "react";
import '../styles/pagar_citas.css'
import { FaPhone } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { FaBook } from "react-icons/fa";
import { FaClock } from "react-icons/fa";
import PayPalButtonCita from "./PayPalButtonCita";

function Citas() {
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tiemposRestantes, setTiemposRestantes] = useState({});

    // Función para calcular tiempo restante hasta 30 min antes de la cita
    const calcularTiempoRestante = useCallback((fecha, horaInicio) => {
        const ahora = new Date();
        const fechaCita = new Date(`${fecha}T${horaInicio}`);
        const limite = new Date(fechaCita.getTime() - 30 * 60 * 1000);
        
        const diferencia = limite.getTime() - ahora.getTime();
        
        if (diferencia <= 0) {
            return { expirado: true, texto: "⏰ Tiempo agotado" };
        }
        
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        
        let texto = "";
        if (dias > 0) texto += `${dias}d `;
        if (horas > 0) texto += `${horas}h `;
        texto += `${minutos}m`;
        
        const urgencia = diferencia < 60 * 60 * 1000 ? "critico" : 
                        diferencia < 24 * 60 * 60 * 1000 ? "urgente" : "normal";
        
        return { expirado: false, texto, urgencia, diferencia };
    }, []);

    const cargarCitasAceptadas = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(
                "http://localhost:5000/citas/cliente?estado=aceptada",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) {
                let mensaje = `Error ${response.status}`;
                try {
                    const err = await response.json();
                    mensaje = err.error || err.message || mensaje;
                } catch {}
                throw new Error(mensaje);
            }
            const data = await response.json();
            
            const citasValidas = data.filter(cita => {
                const tiempo = calcularTiempoRestante(cita.fecha, cita.hora_inicio);
                return !tiempo.expirado;
            });
            
            setCitas(citasValidas);
            
            if (data.length > citasValidas.length) {
                console.log(`🚫 ${data.length - citasValidas.length} cita(s) expirada(s) detectada(s)`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCargando(false);
        }
    }, [calcularTiempoRestante]);

    // Cargar citas al montar
    useEffect(() => {
        cargarCitasAceptadas();
    }, [cargarCitasAceptadas]);

    // Actualizar contadores cada segundo
    useEffect(() => {
        if (citas.length === 0) return;

        const interval = setInterval(() => {
            const nuevosTiempos = {};
            let hayExpirados = false;

            citas.forEach(cita => {
                const tiempo = calcularTiempoRestante(cita.fecha, cita.hora_inicio);
                nuevosTiempos[cita.id] = tiempo;
                if (tiempo.expirado) {
                    hayExpirados = true;
                }
            });

            setTiemposRestantes(nuevosTiempos);

            if (hayExpirados) {
                console.log("🔄 Cita expirada detectada, recargando...");
                cargarCitasAceptadas();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [citas, calcularTiempoRestante, cargarCitasAceptadas]);

    // Verificar con el servidor cada 2 minutos
    useEffect(() => {
        const verificarConServidor = setInterval(() => {
            console.log("🔄 Verificando estado con el servidor...");
            cargarCitasAceptadas();
        }, 2 * 60 * 1000);

        return () => clearInterval(verificarConServidor);
    }, [cargarCitasAceptadas]);

    const onPagoExitoso = (citaId) => {
        setCitas((prev) => prev.filter((c) => c.id !== citaId));
    };

    const formatearFecha = (fecha) => {
        const date = new Date(fecha + "T00:00:00");
        return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatearHora = (hora) => {
        try {
            const [h, m] = hora.split(":");
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m));
            return date.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return hora;
        }
    };

    if (cargando) {
        return <div>Cargando...</div>;
    }

    if (citas.length === 0) {
        return <div>No hay citas pendientes</div>;
    }

    return (
        <>
            {citas.map((cita) => {
                const tiempo = tiemposRestantes[cita.id] || calcularTiempoRestante(cita.fecha, cita.hora_inicio);

                return (
                    <section className='cr' key={cita.id}>
                        <div className="encabezado">
                            <span>Pago pendiente - Cita aceptada</span>
                            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <FaClock /> Pagar en: {tiempo.texto}
                            </span>
                        </div>

                        <div className="content">
                            {/* Tarjeta única con grid de 3 columnas */}
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
                                </div>
                            </div>

                            {/* Sección de pago */}
                            <div className="payment-section">
                                <div className="payment-container">
                                    <div className="payment-info">
                                        <div className="payment-amount">
                                            <p>${parseFloat(cita.monto_total).toLocaleString("es-CO")} COP</p>
                                        </div>
                                    </div>
                                    
                                    <div className="payment-button-container">
                                        <PayPalButtonCita cita={cita} onPagoExitoso={onPagoExitoso} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}
        </>
    );
}

export default Citas;