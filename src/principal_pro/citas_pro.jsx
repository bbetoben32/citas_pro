import {Mi_Citas_pro} from '../citas/mis_citas_pro';
import "../styles/pagos.css";

export function Citas_Pendientes() {
  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>Tus Citas</h1>
        <p className='subtitulo-seccion'>Establece un recordatorio de tus citas</p>
      </div>

      <Mi_Citas_pro />
    </section>
  );
}