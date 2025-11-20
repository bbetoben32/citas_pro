import { useState, useEffect } from 'react';
import { ConfiguracionPerfil } from '../perfil/perfil.jsx';
import "../styles/pagos.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function Perfil() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerNombreUsuario = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setCargando(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/clientes/perfil`, {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`
          }
        });

        const resultado = await response.json();

        if (response.ok) {
          const nombre = resultado.nombre || resultado.nombre_completo || resultado.name || "Usuario";
          setNombreUsuario(nombre);
        }
      } catch (error) {
        console.error("Error al obtener el nombre:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerNombreUsuario();
  }, []);

  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>
          Hola {cargando ? "..." : nombreUsuario}
        </h1>
        <p className='subtitulo-seccion'>Gestiona tu perfil</p>
      </div>

      <ConfiguracionPerfil />
    </section>
  );
}