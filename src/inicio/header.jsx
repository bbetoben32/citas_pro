import React, { useState } from 'react';
import { InicioSesion } from '../login/inicio_sesion';
import '../styles/header.css';

const Header = () => {
  const [showLogin, setShowLogin] = useState(false);

  const handleOpenLogin = (e) => {
    e.preventDefault();
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  return (
    <>
      <header className="header">
        <div className="inicio-container">
          <div className="header-contenido">
            <div className="logo">
              <div className="logo-link">
                <img src="./img/logo.png" alt="logo-img" className="logo-img" />
              </div>
            </div>
            <div className="acciones_usuario">
              <a href="#" className="btn inicio" onClick={handleOpenLogin}>
                <i className="fas fa-right-to-bracket"></i> Ingreso
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de login con overlay */}
      {showLogin && (
        <div className="header-modal-overlay" onClick={handleCloseLogin}>
          <div className="header-modal-content" onClick={(e) => e.stopPropagation()}>
            <Inicio_Sesion />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;