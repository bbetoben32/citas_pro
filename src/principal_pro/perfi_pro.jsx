import { useState, useEffect } from 'react';
import { ConfiguracionPerfilProfesional } from '../perfil/perfil_pro.jsx';
import "../styles/pagos.css";
import "../styles/perfil-foto.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function Perfilpro() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  const obtenerDatosUsuario = async () => {
    const token = localStorage.getItem("token_pro");
    
    if (!token) {
      setCargando(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/profesionales/perfil`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });

      const resultado = await response.json();

      if (response.ok) {
        const nombre = resultado.nombre || resultado.nombre_completo || resultado.name || "Usuario";
        setNombreUsuario(nombre);
        setUserId(resultado.id);
        
        if (resultado.foto) {
          setFotoPerfil(resultado.foto);
        }
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setSubiendoFoto(true);

    const formData = new FormData();
    formData.append('foto', archivo);
    formData.append('_only_foto', 'true');

    try {
      const token = localStorage.getItem("token_pro");
      const response = await fetch(`${API_URL}/profesionales/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await obtenerDatosUsuario();
      } else {
        const error = await response.json();
        console.error('Error del servidor:', error);
        alert(error.error || 'Error al subir la foto');
      }
    } catch (error) {
      console.error("Error al subir foto:", error);
      alert('Error al subir la foto');
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  };

  const obtenerUrlFoto = () => {
    if (!fotoPerfil) return null;
    
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    
    return `${API_URL}${fotoPerfil}`;
  };

  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <div className="perfil-header">
          <div className="foto-perfil-container">
            <div className="foto-perfil-wrapper">
              {obtenerUrlFoto() ? (
                <img 
                  src={obtenerUrlFoto()} 
                  alt="Foto de perfil" 
                  className="foto-perfil-img"
                />
              ) : (
                <div className="foto-perfil-placeholder">
                  <svg 
                    className="foto-perfil-icon" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              
              <label className="foto-perfil-label">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={manejarCambioFoto}
                  disabled={subiendoFoto}
                  className="foto-perfil-input"
                />
                <div className="foto-perfil-overlay">
                  {subiendoFoto ? (
                    <div className="foto-perfil-loader"></div>
                  ) : (
                    <svg 
                      className="foto-perfil-camera" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  )}
                </div>
              </label>
            </div>
          </div>
          
          <div className="perfil-info">
            <h1 className='titulo-seccion'>
              Hola {cargando ? "..." : nombreUsuario}
            </h1>
            <p className='subtitulo-seccion'>Gestiona tu perfil</p>
          </div>
        </div>
      </div>

      <ConfiguracionPerfilProfesional />
    </section>
  );
}
