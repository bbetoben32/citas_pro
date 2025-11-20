import Citas from '../pagos/pagar_citas';
import "../styles/pagos.css";

export function PagosPendientes() {
  return (
    <section className="pagos-pendientes-container">
      <div className="encabezado-pagos">
        <h1 className='titulo-seccion'>Paga Tus Citas</h1>
        <p className='subtitulo-seccion'>Paga tus citas programadas para continuar</p>
      </div>

      <Citas />
    </section>
  );
}