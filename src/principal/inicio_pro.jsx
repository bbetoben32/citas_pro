import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "../principal_pro/menu_pro.jsx";
import { Confirmar } from "../principal_pro/confirmar.jsx";
import { CitasPendientes } from "../principal_pro/citas_pro.jsx";
import { HistorialPrro } from "../principal_pro/historial_p.jsx";
import {Perfilpro} from "../principal_pro/perfi_pro.jsx";
import {Estadisticas} from "../principal_pro/estadisticas.jsx";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function InicioPro() {
    const navigate = useNavigate();
    //const [nombre, setNombre] = useState("");
    const [cargando, setCargando] = useState(true);
    const [seccionActiva, setSeccionActiva] = useState("confirmar");

    useEffect(() => {
        const verificarAutenticacion = async () => {
            const token = localStorage.getItem('token_pro');
            
            if (!token) {
                navigate('/sesion');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/profesionales/perfil`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const datos = await response.json();
                    //setNombre(datos.nombre);
                    localStorage.setItem('nombre_pro', datos.nombre);
                    localStorage.setItem('profesionalId', datos.id);
                } else {
                    localStorage.removeItem('token_pro');
                    localStorage.removeItem('profesionalId');
                    localStorage.removeItem('nombre_pro');
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
            case "confirmar":
                return <Confirmar />;
            case "citas":
                return <CitasPendientes/>;
            case "historial":
                return <HistorialPrro/>;
            case "perfil":
                return <Perfilpro/>;
            case "estadisticas":
                return <Estadisticas/>;
            default:
                return <Confirmar />;
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