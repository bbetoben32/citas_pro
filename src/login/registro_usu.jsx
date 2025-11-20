"use client"
import { useState } from "react"
import { PasswordToggle } from "./PasswordToggle"
import "./auth.css"

export function RegistroUsu({ onRegistroExitoso }) {
  const [paso, setPaso] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)
  const [tempId, setTempId] = useState("")
  const [correoRegistrado, setCorreoRegistrado] = useState("")
  const [codigoDigitado, setCodigoDigitado] = useState("")

  const handleRegistro = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje("")

    const formData = new FormData(e.target)
    const contrasena = formData.get("password")
    const confirmarContrasena = formData.get("confirm_password")

    if (contrasena !== confirmarContrasena) {
      setMensaje("Error: Las contraseñas no coinciden")
      setCargando(false)
      return
    }

    const data = {
      nombre: formData.get("nombre_completo"),
      edad: Number.parseInt(formData.get("edad")),
      ocupacion: formData.get("ocupacion"),
      correo: formData.get("correo"),
      contrasena: contrasena,
      telefono: formData.get("telefono"),
    }

    try {
      const response = await fetch("`${API_URL}/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const resultado = await response.json()

      if (response.ok) {
        setTempId(resultado.temp_id)
        setCorreoRegistrado(resultado.correo)
        
        const responseEnvio = await fetch("`${API_URL}/clientes/enviar-codigo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ temp_id: resultado.temp_id }),
        })

        const resultadoEnvio = await responseEnvio.json()

        if (responseEnvio.ok) {
          setMensaje("Código enviado al correo")
          setPaso(2)
        } else {
          setMensaje(`Error: ${resultadoEnvio.error}`)
        }
      } else {
        setMensaje(`Error: ${resultado.error}`)
      }
    } catch (error) {
      setMensaje("Error de conexión")
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }

  const handleVerificarCodigo = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje("")

    if (!codigoDigitado || codigoDigitado.length !== 6) {
      setMensaje("Error: El código debe tener 6 dígitos")
      setCargando(false)
      return
    }

    try {
      const response = await fetch("`${API_URL}/clientes/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_id: tempId,
          codigo: codigoDigitado,
        }),
      })

      const resultado = await response.json()

      if (response.ok) {
        localStorage.setItem("token", resultado.token)
        localStorage.setItem("clienteId", resultado.id)
        setMensaje("¡Registro exitoso!")
        
        setTimeout(() => {
          if (onRegistroExitoso) {
            onRegistroExitoso()
          }
        }, 100)
      } else {
        setMensaje(`Error: ${resultado.error}`)
      }
    } catch (error) {
      setMensaje("Error de conexión")
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-form-panel auth-register-form">
      {paso === 1 ? (
        <>
          <h2>Crear Cuenta</h2>

          {mensaje && (
            <div className={`auth-mensaje ${mensaje.includes("Error") ? "error" : "success"}`}>
              {mensaje}
            </div>
          )}

          {/* Formulario Cliente */}
          <form id="form-cliente" className="auth-form active" onSubmit={handleRegistro}>
            <div className="auth-field-group">
              <label htmlFor="nombre_completo">
                <i className="fas fa-user"></i> NOMBRE COMPLETO
              </label>
              <input type="text" id="nombre_completo" name="nombre_completo" required placeholder="Tu nombre completo" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="edad">
                <i className="fas fa-birthday-cake"></i> EDAD
              </label>
              <input type="number" id="edad" name="edad" min="0" max="120" required placeholder="Tu edad" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="ocupacion">
                <i className="fas fa-briefcase"></i> OCUPACIÓN
              </label>
              <input type="text" id="ocupacion" name="ocupacion" required placeholder="Tu ocupación" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="telefono">
                <i className="fas fa-phone"></i> TELÉFONO
              </label>
              <input type="tel" id="telefono" name="telefono" maxLength="10" required placeholder="+57 XXX XXXX XXX" />
            </div>

            <div className="auth-field-group full-width">
              <label htmlFor="correo_cliente">
                <i className="fas fa-envelope"></i> CORREO ELECTRÓNICO
              </label>
              <input type="email" id="correo_cliente" name="correo" required placeholder="ejemplo@correo.com" />
            </div>

            <div className="auth-field-group auth-password-field full-width">
              <label htmlFor="password_cliente">
                <i className="fas fa-lock"></i> CONTRASEÑA
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password_cliente"
                  name="password"
                  required
                  placeholder="Crear contraseña"
                />
                <PasswordToggle fieldId="password_cliente" onToggle={() => setShowPassword(!showPassword)} showPassword={showPassword} />
              </div>
            </div>

            <div className="auth-field-group auth-password-field full-width">
              <label htmlFor="confirm_password_cliente">
                <i className="fas fa-lock"></i> CONFIRMAR CONTRASEÑA
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password_cliente"
                  name="confirm_password"
                  required
                  placeholder="Confirmar contraseña"
                />
                <PasswordToggle
                  fieldId="confirm_password_cliente"
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  showPassword={showConfirmPassword}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn auth-btn-primary full-width" disabled={cargando}>
              <i className="fas fa-user-plus"></i> {cargando ? "Registrando..." : "Crear Cuenta"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h2>Verificación</h2>
          <p className="verification-email">
            Código enviado a: <strong>{correoRegistrado}</strong>
          </p>

          {mensaje && (
            <div className={`auth-mensaje ${mensaje.includes("Error") ? "error" : "success"}`}>
              {mensaje}
            </div>
          )}

          <form onSubmit={handleVerificarCodigo}>
            <div className="auth-field-group full-width">
              <label htmlFor="codigo_verificacion">
                <i className="fas fa-key"></i> CÓDIGO DE VERIFICACIÓN
              </label>
              <input
                type="text"
                id="codigo_verificacion"
                name="codigo"
                maxLength="6"
                placeholder="000000"
                required
                className="codigo-input"
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px", fontWeight: "bold" }}
              />
            </div>

            <button type="submit" className="auth-btn auth-btn-primary full-width" disabled={cargando}>
              <i className="fas fa-check"></i> {cargando ? "Verificando..." : "Verificar Código"}
            </button>

            <button 
              type="button" 
              onClick={() => setPaso(1)} 
              className="auth-btn-link"
              style={{ 
                marginTop: "15px", 
                background: "none", 
                border: "none", 
                color: "#1e3a5f", 
                cursor: "pointer",
                textDecoration: "underline",
                width: "100%",
                textAlign: "center"
              }}
            >
              ← Volver al formulario
            </button>
          </form>
        </>
      )}
    </div>
  )
}