import React, { useState } from 'react';
import API_URL from '../config/api';
import { AgendarCita } from './agendar';
import '../styles/InfoPro.css';

export function InfoPro({ profesional, onClose, visible }) {
    const [showAgendarCita, setShowAgendarCita] = useState(false);

    if (!visible || !profesional) return null;

    const handleScheduleClick = () => {
        setShowAgendarCita(true);
    };

    const abrirCV = () => {
        if (profesional.cv) {
            if (profesional.cv.startsWith('http')) {
                window.open(profesional.cv, '_blank');
            } else {
                window.open(`http://localhost:5000${profesional.cv}`, '_blank');
            }
        }
    };

    const abrirLinkedIn = () => {
        if (profesional.linkedin) {
            window.open(profesional.linkedin, '_blank');
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header">
                        <button 
                            className="close-btn" 
                            onClick={onClose}
                            aria-label="Cerrar modal"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        
                        <div className="header-content">
                            <h1 className="professional-name">{profesional.nombre}</h1>
                            <p className="professional-title">{profesional.ocupacion}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="modal-content">
                        {/* Quick Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label">Experiencia</p>
                                <p className="stat-value">{profesional.exp} años</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Tarifa/Hora</p>
                                <p className="stat-value">${profesional.tarifa.toLocaleString('es-CO')} COP</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="contact-section">
                            <h2 className="section-title">Información de Contacto</h2>
                            <div className="contact-grid">
                                <div className="contact-item">
                                    <i className="fas fa-envelope"></i>
                                    <span>{profesional.correo}</span>
                                </div>
                                <div className="contact-item">
                                    <i className="fas fa-phone"></i>
                                    <span>{profesional.telefono}</span>
                                </div>
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="links-section">
                            <h2 className="section-title">Documentos y Enlaces</h2>
                            <div className="links-grid">
                                {profesional.cv && (
                                    <button onClick={abrirCV} className="btn btn-primary">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Ver CV
                                    </button>
                                )}
                                {profesional.linkedin && (
                                    <button onClick={abrirLinkedIn} className="btn btn-linkedin">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                        LinkedIn
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bottom Schedule Button */}
                        <button 
                            className="btn btn-schedule btn-full" 
                            onClick={handleScheduleClick}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Agendar Cita
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Agendar Cita */}
            {showAgendarCita && (
                <AgendarCita 
                    profesional={profesional}
                    visible={showAgendarCita}
                    onClose={() => setShowAgendarCita(false)}
                />
            )}
        </>
    );
}