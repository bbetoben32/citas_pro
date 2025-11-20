import { FaClock } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function RecordatorioButton({ cita }) {
    const agregarAGoogleCalendar = async () => {
        try {
            const startDate = new Date(`${cita.fecha}T${cita.hora_inicio}`);
            const endDate = new Date(`${cita.fecha}T${cita.hora_fin}`);
            
            const formatoGoogle = (fecha) => {
                return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            const titulo = encodeURIComponent(`Cita con ${cita.profesional_nombre}`);
            const descripcion = encodeURIComponent(
                `Consulta: ${cita.motivo}\n` +
                `Modalidad: ${cita.modalidad}\n` +
                `Lugar: ${cita.lugar || 'Por confirmar'}\n` +
                `Teléfono: ${cita.profesional_telefono}`
            );
            const ubicacion = encodeURIComponent(cita.lugar || '');
            
            const googleCalendarUrl = 
                `https://calendar.google.com/calendar/render?action=TEMPLATE` +
                `&text=${titulo}` +
                `&dates=${formatoGoogle(startDate)}/${formatoGoogle(endDate)}` +
                `&details=${descripcion}` +
                `&location=${ubicacion}` +
                `&ctz=America/Bogota`;

            window.open(googleCalendarUrl, '_blank');

            await enviarRecordatorioPorCorreo();
            
            
            
        } catch (error) {
            
        }
    };

    const enviarRecordatorioPorCorreo = async () => {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('`${API_URL}/citas/recordatorio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cita_id: cita.id
                })
            });

            if (!response.ok) {
                console.error('Error al enviar recordatorio por correo');
            }
        } catch (error) {
            console.error('Error al enviar recordatorio:', error);
        }
    };

    ;

    return (
        <button
            onClick={agregarAGoogleCalendar}
            style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1a5490',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                marginTop: '1rem'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3a6b';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#1a5490';
            }}
        >
            <FaClock />
            Establecer Recordatorio
        </button>
    );
}