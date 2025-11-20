import {Citas_pendi} from '../citaspendientes/citas_pendi';
import "../styles/pagos.css";

export function Confirmar() {
  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>Tus Citas Por Confirmar</h1>
        <p className='subtitulo-seccion'>Acepta o rechaza</p>
      </div>

      <Citas_pendi />
    </section>
  );
}