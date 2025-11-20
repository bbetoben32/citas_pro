"use client"

import { useState } from "react"
import { InicionSesionUsuPro } from "./inicio_sesion_usu_pro"
import { RegistroUsu } from "./registro_usu"
import { RegistroPro } from "./registro_pro"
import "./auth.css"

export function InicioSesion() {
  const [activeTab, setActiveTab] = useState("login")
  const [registerType, setRegisterType] = useState("cliente")
  const [mensaje, setMensaje] = useState("")

  const handleRegistroExitoso = () => {
    setActiveTab("login")
    setMensaje("¡Registro completado! Ahora puedes iniciar sesión")
    setTimeout(() => setMensaje(""), 5000)
  }

  return (
    <section className="auth-wrapper">
      <div className="auth-main">
        {/* Tabs de navegación principal */}
        <div className="auth-nav">
          <div
            className={`auth-nav-item ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login")
              setMensaje("")
            }}
          >
            <i className="fas fa-unlock-alt"></i> Iniciar Sesión
          </div>
          <div
            className={`auth-nav-item ${activeTab === "register" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("register")
              setMensaje("")
            }}
          >
            <i className="fas fa-user-plus"></i> Registrarse
          </div>
        </div>

        {mensaje && (
          <div className="auth-mensaje success" style={{ margin: "20px", textAlign: "center" }}>
            {mensaje}
          </div>
        )}

        {/* Contenido */}
        <div className="auth-content">
          {activeTab === "login" && <InicionSesionUsuPro />}

          {activeTab === "register" && (
            <div className="auth-register-section">
              {/* Tabs para seleccionar tipo de usuario a registrarse */}
              <div className="auth-type-selector">
                <button
                  type="button"
                  className={`auth-type-btn ${registerType === "cliente" ? "active" : ""}`}
                  onClick={() => setRegisterType("cliente")}
                >
                  <i className="fas fa-user"></i> Cliente
                </button>
                <button
                  type="button"
                  className={`auth-type-btn ${registerType === "profesional" ? "active" : ""}`}
                  onClick={() => setRegisterType("profesional")}
                >
                  <i className="fas fa-briefcase"></i> Profesional
                </button>
              </div>

              {/* Componentes de registro */}
              {registerType === "cliente" && <RegistroUsu onRegistroExitoso={handleRegistroExitoso} />}
              {registerType === "profesional" && <RegistroPro onRegistroExitoso={handleRegistroExitoso} />}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}