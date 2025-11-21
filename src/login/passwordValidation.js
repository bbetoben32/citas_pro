// passwordValidation.js
// Utilidad para validar contraseñas según requisitos específicos

export const validarContrasena = (contrasena) => {
  const requisitos = {
    longitudMinima: contrasena.length >= 6,
    tieneMayuscula: /[A-Z]/.test(contrasena),
    tieneNumero: /[0-9]/.test(contrasena),
    tieneSimbolo: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)
  };

  const esValida = Object.values(requisitos).every(req => req === true);

  return {
    esValida,
    requisitos
  };
};

export const obtenerMensajesRequisitos = (requisitos) => {
  const mensajes = [];
  
  if (!requisitos.longitudMinima) {
    mensajes.push("Mínimo 6 caracteres");
  }
  if (!requisitos.tieneMayuscula) {
    mensajes.push("Al menos una letra mayúscula");
  }
  if (!requisitos.tieneNumero) {
    mensajes.push("Al menos un número");
  }
  if (!requisitos.tieneSimbolo) {
    mensajes.push("Al menos un símbolo (!@#$%^&*...)");
  }

  return mensajes;
};

// Componente React para mostrar los requisitos de contraseña
export function IndicadorRequisitosContrasena({ contrasena, mostrar = true }) {
  if (!mostrar) return null;

  const { requisitos } = validarContrasena(contrasena);

  return (
    <div style={{
      marginTop: "8px",
      fontSize: "12px",
      padding: "10px",
      backgroundColor: "var(--background-secondary, #f8f9fa)",
      borderRadius: "4px",
      border: "1px solid var(--border-color, #dee2e6)"
    }}>
      <div style={{ fontWeight: "600", marginBottom: "6px", color: "var(--foreground)" }}>
        Requisitos de contraseña:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <RequisitoItem cumplido={requisitos.longitudMinima} texto="Mínimo 6 caracteres" />
        <RequisitoItem cumplido={requisitos.tieneMayuscula} texto="Al menos una letra mayúscula (A-Z)" />
        <RequisitoItem cumplido={requisitos.tieneNumero} texto="Al menos un número (0-9)" />
        <RequisitoItem cumplido={requisitos.tieneSimbolo} texto="Al menos un símbolo (!@#$%...)" />
      </div>
    </div>
  );
}

function RequisitoItem({ cumplido, texto }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: cumplido ? "#28a745" : "#6c757d"
    }}>
      <i className={`fas ${cumplido ? "fa-check-circle" : "fa-circle"}`} style={{ fontSize: "10px" }}></i>
      <span>{texto}</span>
    </div>
  );
}