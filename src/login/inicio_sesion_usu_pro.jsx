"use client"
import API_URL from '../config/api.js';
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { PasswordToggle } from "./PasswordToggle.jsx"
import "./auth.css"

export function InicionSesionUsuPro() {
  const navigate = useNavigate()
  const [userType, setUserType] = useState("cliente")
  const [showPassword, setShowPassword] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje("")

    const formData = new FormData(e.target)
    const data = {
      correo: formData.get("correo"),
      contrasena: formData.get("password"),
    }

    const endpoint =
      userType === "cliente" 
        ? "http://localhost:5000/clientes/login" 
        : "http://localhost:5000/profesionales/login"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const resultado = await response.json()

      if (response.ok) {
        if (userType === "cliente") {
          localStorage.setItem("token", resultado.token)
          localStorage.setItem("clienteId", resultado.usuario.id)
          localStorage.setItem("nombre_usu", resultado.usuario.nombre)
          setMensaje("Entrando...")
          
          setTimeout(() => {
            navigate("/principal_usu")
          }, 100)
        } else {
          localStorage.setItem("token_pro", resultado.token)
          localStorage.setItem("profesionalId", resultado.usuario.id)
          localStorage.setItem("nombre_pro", resultado.usuario.nombre)
          setMensaje("Entrando...")
          
          setTimeout(() => {
            navigate("/principal_pro")
          }, 100)
        }
      } else {
        setMensaje(`Error: ${resultado.error}`)
        setCargando(false)
      }
    } catch (error) {
      setMensaje("Error de conexión")
      console.error("Error:", error)
      setCargando(false)
    }
  }

  return (
    <div className="auth-form-panel">
      <h2>Bienvenido</h2>

      {/* Botones de tipo de usuario */}
      <div className="auth-login-types">
        <button
          type="button"
          className={`auth-login-btn ${userType === "cliente" ? "active" : ""}`}
          onClick={() => setUserType("cliente")}
        >
          <i className="fas fa-user"></i> Cliente
        </button>
        <button
          type="button"
          className={`auth-login-btn ${userType === "profesional" ? "active" : ""}`}
          onClick={() => setUserType("profesional")}
        >
          <i className="fas fa-briefcase"></i> Profesional
        </button>
      </div>

      {mensaje && (
        <div className={`auth-mensaje ${mensaje.includes("Error") ? "error" : "success"}`}>
          {mensaje}
        </div>
      )}

      {/* Formulario de inicio de sesión */}
      <form onSubmit={handleLogin}>
        <div className="auth-field-group">
          <label htmlFor="correo_login">
            <i className="fas fa-envelope"></i> CORREO ELECTRÓNICO
          </label>
          <input type="email" id="correo_login" name="correo" required placeholder="ejemplo@correo.com" />
        </div>

        <div className="auth-field-group auth-password-field">
          <label htmlFor="password_login">
            <i className="fas fa-lock"></i> CONTRASEÑA
          </label>
          <div className="auth-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password_login"
              name="password"
              required
              placeholder="Ingresa tu contraseña"
            />
            <PasswordToggle fieldId="password_login" onToggle={togglePasswordVisibility} showPassword={showPassword} />
          </div>
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={cargando}>
          <i className="fas fa-sign-in-alt"></i>
          <span>{cargando ? "Cargando..." : "Acceder"}</span>
        </button>
      </form>
    </div>
  )
}