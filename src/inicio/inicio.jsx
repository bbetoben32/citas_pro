import Header from "./header"
import "../styles/inicio.css"

const Inicio = () => {
  return (
    <div className="inicio-body">
      <Header />

      <section className="inicio-encabezado">
        <div className="inicio-container">
          <div className="inicio-enc-contenido">
            <h2>Tu bienestar mental es nuestra prioridad</h2>
            <p>Conecta con profesionales especializados en psicología para mejorar tu salud mental y emocional.</p>
          </div>
        </div>
      </section>

      <section className="inicio-info-empresa inicio-container">
        <h2 className="inicio-section-title">
          <i className="fa-solid fa-info-circle"></i> Información de la Empresa
        </h2>
        <div className="inicio-cards">
          <div className="inicio-card">
            <div className="inicio-card-header">
              <h3>Nuestra Misión</h3>
              <span className="inicio-icon-badge">
                <i className="fas fa-bullseye"></i>
              </span>
            </div>
            <div className="inicio-card-body">
              <p>
                Brindar servicios de salud mental de calidad, facilitando el acceso a psicólogos especializados y
                comprometidos con tu bienestar. Ofrecemos atención personalizada, confidencial y profesional para
                ayudarte a alcanzar tu mejor versión emocional y mental.
              </p>
            </div>
          </div>

          <div className="inicio-card">
            <div className="inicio-card-header">
              <h3>Nuestra Visión</h3>
              <span className="inicio-icon-badge">
                <i className="fas fa-eye"></i>
              </span>
            </div>
            <div className="inicio-card-body">
              <p>
                Ser el consultorio psicológico líder, reconocido por nuestra excelencia profesional, innovación en
                métodos terapéuticos y compromiso con la satisfacción de nuestros pacientes. Transformamos vidas a
                través de la salud mental y el desarrollo emocional integral.
              </p>
            </div>
          </div>

          <div className="inicio-card">
            <div className="inicio-card-header">
              <h3>Nuestros Valores</h3>
              <span className="inicio-icon-badge">
                <i className="fas fa-heart"></i>
              </span>
            </div>
            <div className="inicio-card-body">
              <ul className="inicio-valores-list">
                <li>
                  <i className="fas fa-check-circle"></i> Integridad
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Innovación
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Excelencia
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Trabajo en equipo
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Responsabilidad social
                </li>
              </ul>
            </div>
          </div>

          <div className="inicio-card">
            <div className="inicio-card-header">
              <h3>Servicios</h3>
              <span className="inicio-icon-badge">
                <i className="fas fa-cogs"></i>
              </span>
            </div>
            <div className="inicio-card-body">
              <ul className="inicio-servicios-list">
                <li>
                  <i className="fas fa-check-circle"></i> Agendar Citas en Línea
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Terapia Individual y de Pareja
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Atención Psicológica Especializada 24/7
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Inicio