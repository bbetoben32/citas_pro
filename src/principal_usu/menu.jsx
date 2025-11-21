import "../styles/menu.css"

export function Menu({ seccionActiva, cambiarSeccion }) {
  return (
    <div className="contenedor-principal">
      <aside className="barra-lateral">
        <nav className="navegacion-dashboard">
          <a 
            href="#buscar" 
            className={`item-navegacion ${seccionActiva === "buscar" ? "activo" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              cambiarSeccion("buscar");
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
              cambiarSeccion("citas");
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
              cambiarSeccion("pagos");
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
              cambiarSeccion("historial");
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
              cambiarSeccion("perfil");
            }}
          >
            <span className="icono-nav">
              <i className="fa-solid fa-circle-user"></i>
            </span>
            <span className="texto-nav">Mi Perfil</span>
          </a>
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
  );
}
