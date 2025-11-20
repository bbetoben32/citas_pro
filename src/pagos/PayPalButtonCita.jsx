// src/components/PayPalButtonCita.jsx
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Tu Client ID de PayPal Sandbox
const PAYPAL_CLIENT_ID = "AXhZRD0uJVqhIxjjpBsxpfbTbwB8Y_QcCCPspCyduIp_Hlb-g_gaPbhUG0QtFMQVQ67CA3e2aHDA2bG_";

export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState(null);
  const renderedRef = useRef(false);

  // Cargar el SDK de PayPal dinámicamente
  useEffect(() => {
    const scriptId = "paypal-sdk";
    
    // Si ya existe el script y PayPal está disponible
    if (document.getElementById(scriptId)) {
      if (window.paypal?.Buttons) {
        setSdkReady(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    
    script.onload = () => {
      console.log("✅ PayPal SDK cargado");
      setSdkReady(true);
    };
    
    script.onerror = () => {
      console.error("❌ Error cargando PayPal SDK");
      setError("No se pudo cargar PayPal");
    };

    document.body.appendChild(script);
  }, []);

  // Renderizar botón cuando el SDK esté listo
  useEffect(() => {
    if (!sdkReady || !window.paypal?.Buttons || !btnRef.current || renderedRef.current) {
      return;
    }

    renderedRef.current = true;
    const token = localStorage.getItem("token");

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },

      // Crear orden en tu backend
      createOrder: async () => {
        try {
          const response = await fetch(`${API_URL}/citas/${cita.id}/pagar/iniciar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Error creando el pago");
          }

          console.log("✅ Orden creada:", data.payment_id);
          return data.payment_id;
        } catch (err) {
          console.error("❌ Error en createOrder:", err);
          setError(err.message);
          throw err;
        }
      },

      // Capturar el pago después de aprobar
      onApprove: async (data) => {
        try {
          console.log("📝 Pago aprobado, confirmando...", data);

          const response = await fetch(`${API_URL}/citas/${cita.id}/pagar/confirmar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentId: data.orderID,
              payerId: data.payerID,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || "Error confirmando el pago");
          }

          console.log("✅ Pago confirmado");
          alert("✅ ¡Pago exitoso! Tu cita ha sido confirmada.");
          onPagoExitoso?.(cita.id);
        } catch (err) {
          console.error("❌ Error en onApprove:", err);
          alert("❌ Error al confirmar el pago: " + err.message);
        }
      },

      onCancel: () => {
        console.log("⚠️ Pago cancelado por el usuario");
      },

      onError: (err) => {
        console.error("❌ Error PayPal:", err);
        setError("Error con PayPal. Intenta de nuevo.");
      },
    }).render(btnRef.current);

  }, [sdkReady, cita, onPagoExitoso]);

  if (error) {
    return (
      <div style={{ 
        padding: '15px', 
        background: '#fee', 
        borderRadius: '8px',
        color: '#c00',
        textAlign: 'center'
      }}>
        ⚠️ {error}
        <br />
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Recargar página
        </button>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div style={{ 
        padding: '15px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        Cargando PayPal...
      </div>
    );
  }

  return <div ref={btnRef} style={{ minHeight: '50px' }} />;
}
