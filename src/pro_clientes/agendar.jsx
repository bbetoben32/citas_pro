import React, { useState, useEffect } from 'react';
import '../styles/agendar.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function AgendarCita({ profesional, onClose, visible }) {
    const [formData, setFormData] = useState({
        fecha: '',
        hora_inicio: '',
        duracion: 1,
        motivo: '',
        notas_cliente: ''
    });

    const [resumen, setResumen] = useState({
        duracionTexto: '1 hora',
        montoTotal: 0
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && profesional) {
            calcularTotal(formData.duracion);
            const today = new Date().toISOString().split('T')[0];
            const fechaInput = document.getElementById('fecha');
            if (fechaInput) {
                fechaInput.min = today;
            }
            
            // Configurar hora mínima (3 horas después de ahora)
            const horaInput = document.getElementById('hora_inicio');
            if (horaInput && formData.fecha === today) {
                const ahora = new Date();
                ahora.setHours(ahora.getHours() + 3);
                const horaMinima = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
                horaInput.min = horaMinima;
            }
        }
    }, [visible, profesional, formData.fecha]);

    const calcularTotal = (duracion) => {
        const duracionNum = parseFloat(duracion);
        const total = profesional.tarifa * duracionNum;
        
        let duracionTexto;
        if (duracionNum === 0.5) {
            duracionTexto = '30 minutos';
        } else if (duracionNum === 1) {
            duracionTexto = '1 hora';
        } else if (duracionNum % 1 === 0) {
            duracionTexto = `${duracionNum} horas`;
        } else {
            const horas = Math.floor(duracionNum);
            const minutos = (duracionNum % 1) * 60;
            duracionTexto = `${horas} hora${horas > 1 ? 's' : ''} ${minutos} minutos`;
        }
        
        setResumen({
            duracionTexto,
            montoTotal: total
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'duracion') {
            calcularTotal(value);
        }
        
        // Actualizar restricción de hora cuando cambia la fecha
        if (name === 'fecha') {
            const today = new Date().toISOString().split('T')[0];
            const horaInput = document.getElementById('hora_inicio');
            
            if (horaInput) {
                if (value === today) {
                    const ahora = new Date();
                    ahora.setHours(ahora.getHours() + 3);
                    const horaMinima = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
                    horaInput.min = horaMinima;
                } else {
                    horaInput.removeAttribute('min');
                }
            }
        }
    };

    const calcularHoraFin = (horaInicio, duracion) => {
        const [horas, minutos] = horaInicio.split(':').map(Number);
        const duracionMinutos = duracion * 60;
        
        const totalMinutos = horas * 60 + minutos + duracionMinutos;
        const horaFin = Math.floor(totalMinutos / 60) % 24;
        const minutosFin = totalMinutos % 60;
        
        return `${String(horaFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Validar token
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor inicia sesión.');
            return;
        }

        setLoading(true);

        const horaFin = calcularHoraFin(formData.hora_inicio, formData.duracion);

        const citaData = {
            profesional_id: profesional.id,
            fecha: formData.fecha,
            hora_inicio: formData.hora_inicio,
            hora_fin: horaFin,
            duracion: parseFloat(formData.duracion),
            motivo: formData.motivo,
            notas_cliente: formData.notas_cliente || null,
            monto_total: resumen.montoTotal
        };

        console.log('📤 Enviando cita:', citaData);

        try {
            const response = await fetch(`${API_URL}/citas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include', // ✅ CRÍTICO para CORS
                body: JSON.stringify(citaData)
            });

            console.log('📥 Response status:', response.status);

            let data;
            try {
                data = await response.json();
                console.log('📥 Response data:', data);
            } catch (parseError) {
                console.error('❌ Error parsing response:', parseError);
                data = { error: 'Error al procesar la respuesta del servidor' };
            }

            if (response.ok) {
                alert('¡Cita solicitada exitosamente! El profesional recibirá una notificación.');
                onClose();
                setFormData({
                    fecha: '',
                    hora_inicio: '',
                    duracion: 1,
                    motivo: '',
                    notas_cliente: ''
                });
            } else {
                alert(data.error || `Error al solicitar la cita (${response.status})`);
            }
        } catch (error) {
            console.error('❌ Error completo:', error);
            alert(`Error al conectar con el servidor: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!visible || !profesional) return null;

    const getIniciales = (nombre) => {
        return nombre
            .split(' ')
            .map(palabra => palabra[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="appointment-container" onClick={(e) => e.stopPropagation()}>
                <div className="appointment-header">
                    <div className="header-content">
                        <div className="professional-info">
                            <div className="professional-avatar">
                                {getIniciales(profesional.nombre)}
                            </div>
                            <div className="professional-details">
                                <h2>{profesional.nombre}</h2>
                                <p>{profesional.ocupacion} · {profesional.exp} años experiencia</p>
                            </div>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="appointment-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3 className="section-title">Fecha y Hora</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        id="fecha"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hora</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        id="hora_inicio"
                                        name="hora_inicio"
                                        value={formData.hora_inicio}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Duración</h3>
                            <div className="form-group">
                                <select
                                    className="form-select"
                                    name="duracion"
                                    value={formData.duracion}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                >
                                    <option value="0.5">30 minutos</option>
                                    <option value="1">1 hora</option>
                                    <option value="1.5">1 hora 30 minutos</option>
                                    <option value="2">2 horas</option>
                                    <option value="2.5">2 horas 30 minutos</option>
                                    <option value="3">3 horas</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Información de la Consulta</h3>
                            <div className="form-group">
                                <label className="form-label">Motivo de la consulta</label>
                                <textarea
                                    className="form-textarea"
                                    name="motivo"
                                    placeholder="Describe brevemente el motivo de tu consulta..."
                                    value={formData.motivo}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notas adicionales</label>
                                <textarea
                                    className="form-textarea"
                                    name="notas_cliente"
                                    placeholder="Información adicional (opcional)..."
                                    value={formData.notas_cliente}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Resumen</h3>
                            <div className="summary-card">
                                <div className="summary-item">
                                    <span className="summary-label">Tarifa por hora</span>
                                    <span className="summary-value">
                                        ${profesional.tarifa.toLocaleString('es-CO')} COP
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Duración</span>
                                    <span className="summary-value">{resumen.duracionTexto}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Total a pagar</span>
                                    <span className="summary-value">
                                        ${resumen.montoTotal.toLocaleString('es-CO')} COP
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-schedule"
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Solicitar Cita
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}