"use client"

import { useState } from "react"
import { PasswordToggle } from "./PasswordToggle"
import "./auth.css"

export function RegistroPro({ onRegistroExitoso }) {
  const [paso, setPaso] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)
  const [archivoCv, setArchivoCv] = useState(null)
  const [tempId, setTempId] = useState("")
  const [correoRegistrado, setCorreoRegistrado] = useState("")
  const [codigoDigitado, setCodigoDigitado] = useState("")

  const handleArchivoChange = (e) => {
    const archivo = e.target.files[0]
    if (archivo && archivo.type === "application/pdf") {
      setArchivoCv(archivo)
      setMensaje("")
    } else {
      setMensaje("Error: Solo se permiten archivos PDF")
      e.target.value = ""
      setArchivoCv(null)
    }
  }

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

    const dataToSend = new FormData()
    dataToSend.append("nombre", formData.get("nombre_completo"))
    dataToSend.append("telefono", formData.get("telefono"))
    dataToSend.append("correo", formData.get("correo"))
    dataToSend.append("contrasena", contrasena)
    dataToSend.append("ocupacion", formData.get("ocupacion"))
    dataToSend.append("exp", formData.get("experiencia"))
    dataToSend.append("tarifa", formData.get("tarifa"))
    
    const linkedin = formData.get("linkedin")
    if (linkedin) {
      dataToSend.append("linkedin", linkedin)
    }

    if (archivoCv) {
      dataToSend.append("cv", archivoCv)
    }

    try {
      const response = await fetch("http://localhost:5000/profesionales/registro", {
        method: "POST",
        body: dataToSend,
      })

      const resultado = await response.json()

      if (response.ok) {
        setTempId(resultado.temp_id)
        setCorreoRegistrado(resultado.correo)
        
        const responseEnvio = await fetch("http://localhost:5000/profesionales/enviar-codigo", {
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
      const response = await fetch("http://localhost:5000/profesionales/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_id: tempId,
          codigo: codigoDigitado,
        }),
      })

      const resultado = await response.json()

      if (response.ok) {
        localStorage.setItem("token_pro", resultado.token)
        localStorage.setItem("profesionalId", resultado.id)
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

          {/* Formulario Profesional */}
          <form id="form-profesional" className="auth-form active" onSubmit={handleRegistro} encType="multipart/form-data">
            <div className="auth-field-group">
              <label htmlFor="nombre_prof">
                <i className="fas fa-user"></i> NOMBRE COMPLETO
              </label>
              <input type="text" id="nombre_prof" name="nombre_completo" required placeholder="Tu nombre completo" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="telefono_prof">
                <i className="fas fa-phone"></i> TELÉFONO
              </label>
              <input type="tel" id="telefono_prof" name="telefono" required placeholder="+57 XXX XXXX XXX" />
            </div>

            <div className="auth-field-group full-width">
              <label htmlFor="correo_prof">
                <i className="fas fa-envelope"></i> CORREO ELECTRÓNICO
              </label>
              <input type="email" id="correo_prof" name="correo" required placeholder="ejemplo@correo.com" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="ocupacion_prof">
                <i className="fas fa-briefcase"></i> OCUPACIÓN/PROFESIÓN
              </label>
              <input type="text" id="ocupacion_prof" name="ocupacion" required placeholder="Tu profesión" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="experiencia">
                <i className="fas fa-clock"></i> AÑOS DE EXPERIENCIA
              </label>
              <input type="number" id="experiencia" name="experiencia" min="0" required placeholder="Ej: 5" />
            </div>

            <div className="auth-field-group">
              <label htmlFor="tarifa">
                <i className="fas fa-dollar-sign"></i> TARIFA POR HORA (COP)
              </label>
              <input type="number" id="tarifa" name="tarifa" step="0.01" min="0" required placeholder="Ej: 50000" />
            </div>

            <div className="auth-field-group auth-password-field full-width">
              <label htmlFor="password_prof">
                <i className="fas fa-lock"></i> CONTRASEÑA
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password_prof"
                  name="password"
                  required
                  placeholder="Crear contraseña"
                />
                <PasswordToggle fieldId="password_prof" onToggle={() => setShowPassword(!showPassword)} showPassword={showPassword} />
              </div>
            </div>

            <div className="auth-field-group auth-password-field full-width">
              <label htmlFor="confirm_password_prof">
                <i className="fas fa-lock"></i> CONFIRMAR CONTRASEÑA
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password_prof"
                  name="confirm_password"
                  required
                  placeholder="Confirmar contraseña"
                />
                <PasswordToggle
                  fieldId="confirm_password_prof"
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  showPassword={showConfirmPassword}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="cv">
                <i className="fas fa-file-pdf"></i> CV (PDF)
              </label>
              <input type="file" id="cv" name="cv" accept=".pdf" onChange={handleArchivoChange} />
              {archivoCv && <span className="file-selected" style={{ color: "#28a745", fontSize: "12px", marginTop: "5px", display: "block" }}>✓ {archivoCv.name}</span>}
            </div>

            <div className="auth-field-group full-width">
              <label htmlFor="linkedin">
                <i className="fab fa-linkedin"></i> LINKEDIN (OPCIONAL)
              </label>
              <input type="url" id="linkedin" name="linkedin" placeholder="https://linkedin.com/in/tu-perfil" />
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
              <label htmlFor="codigo_verificacion_pro">
                <i className="fas fa-key"></i> CÓDIGO DE VERIFICACIÓN
              </label>
              <input
                type="text"
                id="codigo_verificacion_pro"
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