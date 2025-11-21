import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/menu.css";

export function Menu({ seccionActiva, cambiarSeccion }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const handleCambiarSeccion = (seccion) => {
    cambiarSeccion(seccion);
    if (window.innerWidth <= 768) {
      setMenuAbierto(false);
    }
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleCerrarSesion = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("token_pro");
    localStorage.removeItem("profesionalId");
    localStorage.removeItem("clienteId");
    
    navigate("/");
  };

  return (
    <>
      <button className="btn-hamburguesa" onClick={toggleMenu}>
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className={`contenedor-principal ${menuAbierto ? "menu-abierto" : ""}`}>
        <aside className="barra-lateral">
          <nav className="navegacion-dashboard">
            <a 
              href="#buscar" 
              className={`item-navegacion ${seccionActiva === "buscar" ? "activo" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleCambiarSeccion("buscar");
              }}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <span className="texto-nav">Buscar Profesional</span>
            </a>
            <a 
              href="#citas" 
              className={`item-navegacion ${seccionActiva === "citas" ? "activo" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleCambiarSeccion("citas");
              }}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-calendar-days"></i>
              </span>
              <span className="texto-nav">Mis Citas</span>
            </a>
            <a 
              href="#pagos" 
              className={`item-navegacion ${seccionActiva === "pagos" ? "activo" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleCambiarSeccion("pagos");
              }}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-credit-card"></i>
              </span>
              <span className="texto-nav">Pagos Pendientes</span>
            </a>
            <a 
              href="#historial" 
              className={`item-navegacion ${seccionActiva === "historial" ? "activo" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleCambiarSeccion("historial");
              }}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-clipboard"></i>
              </span>
              <span className="texto-nav">Historial</span>
            </a>
            <a 
              href="#perfil" 
              className={`item-navegacion ${seccionActiva === "perfil" ? "activo" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleCambiarSeccion("perfil");
              }}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-circle-user"></i>
              </span>
              <span className="texto-nav">Mi Perfil</span>
            </a>

            {/* Botón de cerrar sesión */}
            <button 
              className="item-navegacion btn-cerrar-sesion"
              onClick={handleCerrarSesion}
            >
              <span className="icono-nav">
                <i className="fa-solid fa-right-from-bracket"></i>
              </span>
              <span className="texto-nav">Cerrar Sesión</span>
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
