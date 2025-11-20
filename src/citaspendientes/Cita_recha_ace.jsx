import { useState } from 'react';
import { FaTimes, FaCheck, FaMapMarkerAlt, FaVideo, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import './CitasModal.css';

export function CitaModal({ accion, onConfirmar, onCancelar }) {
    const [lugar, setLugar] = useState('');
    const [linkTeams, setLinkTeams] = useState('');
    const [modalidad, setModalidad] = useState('presencial');
    const [motivo, setMotivo] = useState('');
    const [errorLink, setErrorLink] = useState('');

    const validarLinkTeams = (link) => {
        const teamsPatterns = [
            /^https:\/\/teams\.microsoft\.com\//i,
            /^https:\/\/teams\.live\.com\//i,
            /^https:\/\/.*\.teams\.microsoft\.com\//i
        ];
        
        return teamsPatterns.some(pattern => pattern.test(link));
    };

    const manejarCambioLink = (e) => {
        const nuevoLink = e.target.value;
        setLinkTeams(nuevoLink);
        
        if (nuevoLink.trim() && !validarLinkTeams(nuevoLink)) {
            setErrorLink('El enlace debe ser de Microsoft Teams');
        } else {
            setErrorLink('');
        }
    };

    const manejarConfirmacion = () => {
        if (accion === 'aceptar') {
            if (modalidad === 'presencial' && !lugar.trim()) {
                return;
            }
            
            if (modalidad === 'virtual') {
                if (!linkTeams.trim()) {
                    setErrorLink('Debe proporcionar un enlace de Teams');
                    return;
                }
                if (!validarLinkTeams(linkTeams)) {
                    setErrorLink('El enlace debe ser de Microsoft Teams');
                    return;
                }
            }
            
            onConfirmar({ 
                lugar: modalidad === 'presencial' ? lugar : linkTeams, 
                modalidad 
            });
        } else {
            onConfirmar({ motivo });
        }
    };

    return (
        <div className="cita-modal-overlay">
            <div className="cita-modal-container">
                <div className="cita-modal-header">
                    <h2 className={`cita-modal-header-title ${accion === 'aceptar' ? 'cita-modal-aceptar' : 'cita-modal-rechazar'}`}>
                        {accion === 'aceptar' ? (
                            <>
                                <FaCheck className="cita-modal-header-icon" /> Aceptar Cita
                            </>
                        ) : (
                            <>
                                <FaTimes className="cita-modal-header-icon" /> Rechazar Cita
                            </>
                        )}
                    </h2>
                    <p className="cita-modal-header-subtitle">
                        {accion === 'aceptar' 
                            ? 'Complete los detalles para confirmar la cita' 
                            : 'Indique el motivo del rechazo'}
                    </p>
                </div>

                <div className="cita-modal-body">
                    {accion === 'aceptar' ? (
                        <>
                            <div className="cita-modal-form-group">
                                <label className="cita-modal-form-label">
                                    Modalidad de la cita
                                </label>
                                <div className="cita-modal-modalidad-container">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalidad('presencial');
                                            setLinkTeams('');
                                            setErrorLink('');
                                        }}
                                        className={`cita-modal-modalidad-button ${modalidad === 'presencial' ? 'cita-modal-modalidad-active' : ''}`}
                                    >
                                        <div className="cita-modal-modalidad-icon-wrapper">
                                            <FaBuilding className="cita-modal-modalidad-icon" />
                                        </div>
                                        <span className="cita-modal-modalidad-text">Presencial</span>
                                        <span className="cita-modal-modalidad-description">En consultorio u oficina</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalidad('virtual');
                                            setLugar('');
                                        }}
                                        className={`cita-modal-modalidad-button ${modalidad === 'virtual' ? 'cita-modal-modalidad-active' : ''}`}
                                    >
                                        <div className="cita-modal-modalidad-icon-wrapper">
                                            <FaVideo className="cita-modal-modalidad-icon" />
                                        </div>
                                        <span className="cita-modal-modalidad-text">Virtual</span>
                                        <span className="cita-modal-modalidad-description">Por Microsoft Teams</span>
                                    </button>
                                </div>
                            </div>

                            {modalidad === 'presencial' && (
                                <div className="cita-modal-form-group">
                                    <label className="cita-modal-form-label">
                                        <FaMapMarkerAlt className="cita-modal-label-icon" />
                                        Lugar de la cita
                                    </label>
                                    <input
                                        type="text"
                                        value={lugar}
                                        onChange={(e) => setLugar(e.target.value)}
                                        placeholder="Ej: Consultorio 3, Calle 45 #12-34, Torre Empresarial"
                                        className="cita-modal-form-input"
                                    />
                                    <p className="cita-modal-form-hint">
                                        Especifique la dirección completa donde se realizará la cita
                                    </p>
                                </div>
                            )}

                            {modalidad === 'virtual' && (
                                <div className="cita-modal-form-group">
                                    <label className="cita-modal-form-label">
                                        <FaVideo className="cita-modal-label-icon" />
                                        Enlace de Microsoft Teams
                                    </label>
                                    <input
                                        type="url"
                                        value={linkTeams}
                                        onChange={manejarCambioLink}
                                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                                        className={`cita-modal-form-input ${errorLink ? 'cita-modal-input-error' : ''}`}
                                    />
                                    {errorLink && (
                                        <div className="cita-modal-error-message">
                                            <FaExclamationTriangle className="cita-modal-error-icon" />
                                            {errorLink}
                                        </div>
                                    )}
                                    <p className="cita-modal-form-hint">
                                        Pegue aquí el enlace de la reunión de Microsoft Teams
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="cita-modal-form-group">
                            <label className="cita-modal-form-label">
                                Motivo del rechazo
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Explique brevemente por qué rechaza esta cita. Esto ayudará al cliente a entender su decisión..."
                                rows={5}
                                className="cita-modal-form-textarea"
                            />
                            <p className="cita-modal-form-hint">
                                Sea claro y profesional en su respuesta
                            </p>
                        </div>
                    )}
                </div>

                <div className="cita-modal-footer">
                    <button
                        onClick={onCancelar}
                        className="cita-modal-button cita-modal-button-cancelar"
                    >
                        <FaTimes className="cita-modal-button-icon" />
                        Cancelar
                    </button>
                    <button
                        onClick={manejarConfirmacion}
                        className={`cita-modal-button cita-modal-button-confirmar ${accion === 'aceptar' ? 'cita-modal-button-aceptar' : 'cita-modal-button-rechazar'}`}
                    >
                        <FaCheck className="cita-modal-button-icon" />
                        {accion === 'aceptar' ? 'Confirmar Aceptación' : 'Confirmar Rechazo'}
                    </button>
                </div>
            </div>
        </div>
    );
}