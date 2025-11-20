import {Historial_usu} from '../historial/historial_usu';
import "../styles/historial.css";

export function Historial_u() {
  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>Tus citas ya concluidas</h1>
        <p className='subtitulo-seccion'>Te invitamos a recordar tus citas pasadas.</p>
      </div>

      <Historial_usu />
    </section>
  );
}