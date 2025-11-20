import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "../principal_usu/menu.jsx";
import { BuscarProfesional } from "../principal_usu/buscar.jsx";
import { PagosPendientes } from "../principal_usu/pagos.jsx";
import { CitasPendientes } from "../principal_usu/citas.jsx";
import { Historial_u } from "../principal_usu/historial.jsx";
import {Perfil} from "../principal_usu/perfi.jsx";

export function InicioUsuario() {
    const navigate = useNavigate();
    //const [nombre, setNombre] = useState("");
    const [cargando, setCargando] = useState(true);
    const [seccionActiva, setSeccionActiva] = useState("buscar");

    useEffect(() => {
        const verificarAutenticacion = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/sesion');
                return;
            }

            try {
                const response = await fetch('`${API_URL}/clientes/perfil', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const datos = await response.json();
                    //setNombre(datos.nombre);
                    localStorage.setItem('nombre_usu', datos.nombre);
                    localStorage.setItem('clienteId', datos.id);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('clienteId');
                    localStorage.removeItem('nombre_usu');
                    navigate('/sesion');
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                navigate('/sesion');
            } finally {
                setCargando(false);
            }
        };

        verificarAutenticacion();
    }, [navigate]);

    const cambiarSeccion = (seccion) => {
        setSeccionActiva(seccion);
    };

    const renderizarContenido = () => {
        switch(seccionActiva) {
            case "buscar":
                return <BuscarProfesional />;
            case "citas":
                return <CitasPendientes />;
            case "pagos":
                return <PagosPendientes />;
            case "historial":
                return <Historial_u/>;
          
            case "perfil":
                return <Perfil  />
            default:
                return <BuscarProfesional />;
        }
    };

    if (cargando) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666'
            }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Cargando...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Menu seccionActiva={seccionActiva} cambiarSeccion={cambiarSeccion} />
            <div style={{ 
                flex: 1, 
                backgroundColor: '#f5f7fa', 
                overflow: 'auto',
                padding: seccionActiva === 'chat' ? '0' : '2rem'
            }}>
                {renderizarContenido()}
            </div>
        </div>
    );
}