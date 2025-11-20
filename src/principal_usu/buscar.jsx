import { useEffect, useState } from "react";
import "../styles/buscar.css";
import { InfoPro } from "../pro_clientes/info_pro.jsx";

export function BuscarProfesional() {
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    especialidad: "",
    rangoPrecios: "",
    experiencia: ""
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);

  useEffect(() => {
    obtenerProfesionales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, profesionales]);

  const obtenerProfesionales = async () => {
    try {
      const response = await fetch('`${API_URL}/profesionales/');
      if (response.ok) {
        const datos = await response.json();
        setProfesionales(datos);
        setProfesionalesFiltrados(datos);
        setEspecialidades([...new Set(datos.map(prof => prof.ocupacion))].sort());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = profesionales.filter(prof => {
      const cumpleBusqueda = !filtros.busqueda.trim() || 
        prof.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        prof.ocupacion.toLowerCase().includes(filtros.busqueda.toLowerCase());

      const cumpleEspecialidad = !filtros.especialidad || 
        filtros.especialidad === "Todas las especialidades" ||
        prof.ocupacion.toLowerCase() === filtros.especialidad.toLowerCase();

      const cumplePrecio = !filtros.rangoPrecios || (() => {
        const tarifa = prof.tarifa;
        switch(filtros.rangoPrecios) {
          case "$0 - $50.000": return tarifa <= 50000;
          case "$50.001 - $100.000": return tarifa >= 50001 && tarifa <= 100000;
          case "$100.001 - $200.000": return tarifa >= 100001 && tarifa <= 200000;
          case "Más de $200.000": return tarifa > 200000;
          default: return true;
        }
      })();

      const cumpleExperiencia = !filtros.experiencia || (() => {
        const exp = prof.exp;
        switch(filtros.experiencia) {
          case "0 - 5 años": return exp <= 5;
          case "6 - 10 años": return exp >= 6 && exp <= 10;
          case "11 - 15 años": return exp >= 11 && exp <= 15;
          case "Más de 15 años": return exp > 15;
          default: return true;
        }
      })();

      return cumpleBusqueda && cumpleEspecialidad && cumplePrecio && cumpleExperiencia;
    });

    setProfesionalesFiltrados(resultado);
  };

  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // ✅ NUEVA FUNCIÓN: Obtener URL de la foto
  const obtenerUrlFoto = (profesional) => {
    if (!profesional.foto) {
      return '/img/avatar.png'; // Foto por defecto
    }
    
    // Si la foto es una URL completa (http/https), devolverla tal cual
    if (profesional.foto.startsWith('http')) {
      return profesional.foto;
    }
    
    // Si es una ruta local, construir la URL completa
    return ``${API_URL}${profesional.foto}`;
  };

  const verDetallesProfesional = (profesional) => {
    setProfesionalSeleccionado(profesional);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProfesionalSeleccionado(null);
  };

  if (cargando) {
    return (
      <section className="seccion-contenido activa">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Cargando profesionales...
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="seccion-contenido activa" id="buscar">
        <div className="encabezado-seccion">
          <h1 className="titulo-seccion">Buscar Profesional</h1>
          <p className="subtitulo-seccion">Encuentra al especialista ideal para ti</p>
        </div>

        <div className="barra-busqueda-avanzada">
          <div className="grupo-busqueda">
            <input 
              type="text" 
              className="campo-busqueda" 
              placeholder="Buscar por nombre o especialidad..."
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
            />
            <button className="boton-buscar" onClick={aplicarFiltros}>
              <i className="fas fa-search"></i>
            </button>
          </div>
          <div className="filtros-busqueda">
            <select 
              className="selector-filtro"
              value={filtros.especialidad}
              onChange={(e) => actualizarFiltro('especialidad', e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((esp, index) => (
                <option key={index} value={esp}>{esp}</option>
              ))}
            </select>
            <select 
              className="selector-filtro"
              value={filtros.rangoPrecios}
              onChange={(e) => actualizarFiltro('rangoPrecios', e.target.value)}
            >
              <option value="">Rango de precio</option>
              <option value="$0 - $50.000">$0 - $50.000</option>
              <option value="$50.001 - $100.000">$50.001 - $100.000</option>
              <option value="$100.001 - $200.000">$100.001 - $200.000</option>
              <option value="Más de $200.000">Más de $200.000</option>
            </select>
            <select 
              className="selector-filtro"
              value={filtros.experiencia}
              onChange={(e) => actualizarFiltro('experiencia', e.target.value)}
            >
              <option value="">Años de experiencia</option>
              <option value="0 - 5 años">0 - 5 años</option>
              <option value="6 - 10 años">6 - 10 años</option>
              <option value="11 - 15 años">11 - 15 años</option>
              <option value="Más de 15 años">Más de 15 años</option>
            </select>
          </div>
        </div>

        <div className="grilla-profesionales">
          {profesionalesFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              No se encontraron profesionales con esos criterios
            </div>
          ) : (
            profesionalesFiltrados.map((profesional) => (
              <div 
                key={profesional.id} 
                className="tarjeta-profesional"
                onClick={() => verDetallesProfesional(profesional)}
                style={{ cursor: 'pointer' }}
              >
                <div className="foto-profesional-container">
                  <img 
                    src={obtenerUrlFoto(profesional)}
                    alt={profesional.nombre}
                    className="foto-profesional-circular"
                    onError={(e) => {
                      e.target.src = '/img/avatar.png'; // Fallback si falla la carga
                    }}
                  />
                </div>
                <div className="info-profesional">
                  <h3 className="nombre-profesional">{profesional.nombre}</h3>
                  <p className="especialidad-profesional">{profesional.ocupacion}</p>
                  <p className="experiencia-profesional">
                    {profesional.exp} años de experiencia
                  </p>
                  <div className="precio-profesional">
                    <h3>Precio: ${profesional.tarifa.toLocaleString('es-CO')} COP</h3>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal */}
      <InfoPro 
        profesional={profesionalSeleccionado}
        visible={modalVisible}
        onClose={cerrarModal}
      />
    </>
  );
}
