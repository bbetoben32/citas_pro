import { useState } from "react"
import "./perfil"

function PasswordToggle({ fieldId, onToggle, showPassword }) {
  const handleClick = (e) => {
    e.preventDefault()
    onToggle()
  }

  return (
    <button 
      type="button" 
      className="boton-toggle-password-configuracion" 
      onClick={handleClick} 
      aria-label="Toggle password visibility"
    >
      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
    </button>
  )
}

export function ConfiguracionPerfilProfesional() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeOption, setActiveOption] = useState(null)
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)
  
  // Estados para contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pasoPassword, setPasoPassword] = useState(1)
  const [codigoPasswordDigitado, setCodigoPasswordDigitado] = useState("")
  const [tempPasswordData, setTempPasswordData] = useState(null)
  
  // Estados para correo
  const [nuevoCorreo, setNuevoCorreo] = useState("")
  const [pasoCorreo, setPasoCorreo] = useState(1)
  const [codigoCorreoDigitado, setCodigoCorreoDigitado] = useState("")
  const [nuevoCorreoTemp, setNuevoCorreoTemp] = useState("")

  // Estados para CV
  const [cvFile, setCvFile] = useState(null)
  const [cvFileName, setCvFileName] = useState("")

  const token = localStorage.getItem("token")
  const userId = localStorage.getItem("profesionalId")

  const handleCambiarPassword = async () => {
    setCargando(true)
    setMensaje("")

    if (newPassword !== confirmPassword) {
      setMensaje("Error: Las contraseñas no coinciden")
      setCargando(false)
      return
    }

    const endpoint = "`${API_URL}/profesionales/cambiar-password/solicitar"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          contrasena_actual: currentPassword,
          contrasena_nueva: newPassword
        }),
      })

      const resultado = await response.json()

      if (response.ok) {
        setTempPasswordData({ contrasenaNueva: newPassword })
        setMensaje("Código de verificación enviado a tu correo actual")
        setPasoPassword(2)
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

  const handleVerificarCodigoPassword = async () => {
    setCargando(true)
    setMensaje("")

    if (!codigoPasswordDigitado || codigoPasswordDigitado.length !== 6) {
      setMensaje("Error: El código debe tener 6 dígitos")
      setCargando(false)
      return
    }

    const endpoint = "`${API_URL}/profesionales/cambiar-password/verificar"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo: codigoPasswordDigitado,
          contrasena_nueva: tempPasswordData.contrasenaNueva
        }),
      })

      const resultado = await response.json()

      if (response.ok) {
        setMensaje("¡Contraseña actualizada exitosamente!")
        setPasoPassword(1)
        setCodigoPasswordDigitado("")
        setTempPasswordData(null)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setActiveOption(null)
          setMensaje("")
        }, 2000)
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

  const handleCambiarCorreo = async () => {
    setCargando(true)
    setMensaje("")

    const endpoint = "`${API_URL}/profesionales/cambiar-correo/solicitar"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ correo_nuevo: nuevoCorreo }),
      })

      const resultado = await response.json()

      if (response.ok) {
        setNuevoCorreoTemp(nuevoCorreo)
        setMensaje(`Código de verificación enviado a: ${nuevoCorreo}`)
        setPasoCorreo(2)
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

  const handleVerificarCodigoCorreo = async () => {
    setCargando(true)
    setMensaje("")

    if (!codigoCorreoDigitado || codigoCorreoDigitado.length !== 6) {
      setMensaje("Error: El código debe tener 6 dígitos")
      setCargando(false)
      return
    }

    const endpoint = "`${API_URL}/profesionales/cambiar-correo/verificar"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo: codigoCorreoDigitado,
          correo_nuevo: nuevoCorreoTemp
        }),
      })

      const resultado = await response.json()

      if (response.ok) {
        setMensaje("¡Correo actualizado exitosamente!")
        setPasoCorreo(1)
        setCodigoCorreoDigitado("")
        setNuevoCorreoTemp("")
        setNuevoCorreo("")
        setTimeout(() => {
          setActiveOption(null)
          setMensaje("")
        }, 2000)
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

  const handleCvFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setMensaje("Error: Solo se permiten archivos PDF")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setMensaje("Error: El archivo no debe superar 5MB")
        return
      }
      setCvFile(file)
      setCvFileName(file.name)
      setMensaje("")
    }
  }

  const handleCambiarCV = async () => {
    setCargando(true)
    setMensaje("")

    if (!cvFile) {
      setMensaje("Error: Debes seleccionar un archivo PDF")
      setCargando(false)
      return
    }

    const formData = new FormData()
    formData.append('cv', cvFile)

    const endpoint = ``${API_URL}/profesionales/${userId}`

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      const resultado = await response.json()

      if (response.ok) {
        setMensaje("¡CV actualizado exitosamente!")
        setCvFile(null)
        setCvFileName("")
        setTimeout(() => {
          setActiveOption(null)
          setMensaje("")
        }, 2000)
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

  const resetearFormularios = () => {
    setPasoPassword(1)
    setPasoCorreo(1)
    setCodigoPasswordDigitado("")
    setCodigoCorreoDigitado("")
    setTempPasswordData(null)
    setNuevoCorreoTemp("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setNuevoCorreo("")
    setCvFile(null)
    setCvFileName("")
    setMensaje("")
  }

  const handleSelectOption = (option) => {
    resetearFormularios()
    setActiveOption(activeOption === option ? null : option)
  }

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <button 
        className="boton-configuracion-principal" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          <i className="fas fa-cog"></i> Configuración de Perfil
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="panel-configuracion-perfil">
          <div className="grid-opciones-configuracion">
            <button 
              className={`boton-opcion-configuracion ${activeOption === 'password' ? 'opcion-activa' : ''}`}
              onClick={() => handleSelectOption('password')}
            >
              <i className="fas fa-lock"></i>
              Cambiar Contraseña
            </button>
            
            <button 
              className={`boton-opcion-configuracion ${activeOption === 'email' ? 'opcion-activa' : ''}`}
              onClick={() => handleSelectOption('email')}
            >
              <i className="fas fa-envelope"></i>
              Cambiar Correo Electrónico
            </button>

            <button 
              className={`boton-opcion-configuracion ${activeOption === 'cv' ? 'opcion-activa' : ''}`}
              onClick={() => handleSelectOption('cv')}
            >
              <i className="fas fa-file-pdf"></i>
              Cambiar CV
            </button>
          </div>

          {mensaje && (
            <div className={`mensaje-configuracion ${mensaje.includes("Error") ? "mensaje-error" : "mensaje-exito"}`}>
              {mensaje}
            </div>
          )}

          {/* Formulario Cambiar Contraseña */}
          {activeOption === 'password' && (
            <div className="contenedor-formulario-configuracion">
              {pasoPassword === 1 ? (
                <>
                  <h3 style={{ marginTop: 0, color: "var(--foreground)" }}>Cambiar Contraseña</h3>
                  <div>
                    <div className="grupo-campo-configuracion">
                      <label htmlFor="current_password">
                        <i className="fas fa-lock"></i> Contraseña Actual
                      </label>
                      <div className="envoltorio-password-configuracion">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="current_password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                        />
                        <PasswordToggle 
                          fieldId="current_password" 
                          onToggle={() => setShowCurrentPassword(!showCurrentPassword)} 
                          showPassword={showCurrentPassword} 
                        />
                      </div>
                    </div>

                    <div className="grupo-campo-configuracion">
                      <label htmlFor="new_password">
                        <i className="fas fa-key"></i> Nueva Contraseña
                      </label>
                      <div className="envoltorio-password-configuracion">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new_password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Ingresa tu nueva contraseña"
                        />
                        <PasswordToggle 
                          fieldId="new_password" 
                          onToggle={() => setShowNewPassword(!showNewPassword)} 
                          showPassword={showNewPassword} 
                        />
                      </div>
                    </div>

                    <div className="grupo-campo-configuracion">
                      <label htmlFor="confirm_password">
                        <i className="fas fa-check"></i> Confirmar Nueva Contraseña
                      </label>
                      <div className="envoltorio-password-configuracion">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm_password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <PasswordToggle 
                          fieldId="confirm_password" 
                          onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
                          showPassword={showConfirmPassword} 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleCambiarPassword} 
                      className="boton-accion-configuracion boton-accion-configuracion-primario" 
                      disabled={cargando}
                    >
                      {cargando ? "Enviando..." : "Enviar Código"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ marginTop: 0, color: "var(--foreground)" }}>Verificación</h3>
                  <p className="correo-verificacion-configuracion">
                    Código enviado a tu correo actual
                  </p>

                  <div>
                    <div className="grupo-campo-configuracion">
                      <label htmlFor="codigo_password">
                        <i className="fas fa-key"></i> Código de Verificación
                      </label>
                      <input
                        type="text"
                        id="codigo_password"
                        maxLength="6"
                        placeholder="000000"
                        className="input-codigo-configuracion"
                        value={codigoPasswordDigitado}
                        onChange={(e) => setCodigoPasswordDigitado(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>

                    <button 
                      onClick={handleVerificarCodigoPassword} 
                      className="boton-accion-configuracion boton-accion-configuracion-primario" 
                      disabled={cargando}
                    >
                      <i className="fas fa-check"></i>
                      {cargando ? "Verificando..." : "Verificar y Cambiar Contraseña"}
                    </button>

                    <button 
                      onClick={() => setPasoPassword(1)} 
                      className="boton-enlace-configuracion"
                    >
                      ← Volver
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Formulario Cambiar Correo */}
          {activeOption === 'email' && (
            <div className="contenedor-formulario-configuracion">
              {pasoCorreo === 1 ? (
                <>
                  <h3 style={{ marginTop: 0, color: "var(--foreground)" }}>Cambiar Correo Electrónico</h3>
                  <div>
                    <div className="grupo-campo-configuracion">
                      <label htmlFor="nuevo_correo">
                        <i className="fas fa-envelope"></i> Nuevo Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="nuevo_correo"
                        value={nuevoCorreo}
                        onChange={(e) => setNuevoCorreo(e.target.value)}
                        placeholder="ejemplo@correo.com"
                      />
                    </div>

                    <button 
                      onClick={handleCambiarCorreo} 
                      className="boton-accion-configuracion boton-accion-configuracion-primario" 
                      disabled={cargando}
                    >
                      {cargando ? "Enviando..." : "Enviar Código"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ marginTop: 0, color: "var(--foreground)" }}>Verificación</h3>
                  <p className="correo-verificacion-configuracion">
                    Código enviado a: <strong>{nuevoCorreoTemp}</strong>
                  </p>

                  <div>
                    <div className="grupo-campo-configuracion">
                      <label htmlFor="codigo_correo">
                        <i className="fas fa-key"></i> Código de Verificación
                      </label>
                      <input
                        type="text"
                        id="codigo_correo"
                        maxLength="6"
                        placeholder="000000"
                        className="input-codigo-configuracion"
                        value={codigoCorreoDigitado}
                        onChange={(e) => setCodigoCorreoDigitado(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>

                    <button 
                      onClick={handleVerificarCodigoCorreo} 
                      className="boton-accion-configuracion boton-accion-configuracion-primario" 
                      disabled={cargando}
                    >
                      <i className="fas fa-check"></i>
                      {cargando ? "Verificando..." : "Verificar y Cambiar Correo"}
                    </button>

                    <button 
                      onClick={() => setPasoCorreo(1)} 
                      className="boton-enlace-configuracion"
                    >
                      ← Volver
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Formulario Cambiar CV */}
          {activeOption === 'cv' && (
            <div className="contenedor-formulario-configuracion">
              <h3 style={{ marginTop: 0, color: "var(--foreground)" }}>Cambiar CV</h3>
              <div>
                <div className="grupo-campo-configuracion">
                  <label htmlFor="cv_file">
                    <i className="fas fa-file-pdf"></i> Seleccionar nuevo CV (PDF)
                  </label>
                  <div className="envoltorio-input-archivo-configuracion">
                    <input
                      type="file"
                      id="cv_file"
                      accept=".pdf"
                      onChange={handleCvFileChange}
                    />
                    <label htmlFor="cv_file" className="etiqueta-input-archivo-configuracion">
                      <i className="fas fa-upload"></i>
                      {cvFileName || "Seleccionar archivo PDF"}
                    </label>
                  </div>
                  {cvFileName && (
                    <div className="archivo-seleccionado-configuracion">
                      <i className="fas fa-file-pdf"></i>
                      <span>{cvFileName}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleCambiarCV} 
                  className="boton-accion-configuracion boton-accion-configuracion-primario" 
                  disabled={cargando || !cvFile}
                >
                  <i className="fas fa-check"></i>
                  {cargando ? "Actualizando..." : "Actualizar CV"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}