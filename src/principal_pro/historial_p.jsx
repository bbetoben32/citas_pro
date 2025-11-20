import HistorialPro  from '../historial/historial_pro';
import "../styles/historial_pro.css";

export function Historial_Pro() {
  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>Tus citas ya concluidas</h1>
        <p className='subtitulo-seccion'>Te invitamos a recordar tus citas pasadas.</p>
      </div>

      <HistorialPro />
    </section>
  );
}