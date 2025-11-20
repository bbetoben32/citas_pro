// src/components/PayPalButtonCita.jsx
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const [status, setStatus] = useState("esperando");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const esperarYRenderizar = async () => {
      // Esperar a que PayPal esté disponible (máximo 10 segundos)
      let intentos = 0;
      while (!window.paypal?.Buttons && intentos < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;
      }

      if (!window.paypal?.Buttons) {
        if (isMounted) {
          setStatus("error");
          setErrorMsg("No se pudo cargar PayPal. Recarga la página.");
        }
        return;
      }

      if (!isMounted || !btnRef.current) return;

      try {
        // Limpiar contenedor
        btnRef.current.innerHTML = "";

        const token = localStorage.getItem("token");

        await window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 45
          },

          createOrder: async () => {
            console.log("📝 Creando orden para cita:", cita.id);
            
            const response = await fetch(`${API_URL}/citas/${cita.id}/pagar/iniciar`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await response.json();
            console.log("📦 Respuesta:", data);

            if (!response.ok || !data.success) {
              throw new Error(data.error || "Error creando el pago");
            }

            return data.payment_id;
          },

          onApprove: async (data) => {
            console.log("✅ Pago aprobado:", data);
            
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

            alert("✅ ¡Pago exitoso! Tu cita ha sido confirmada.");
            onPagoExitoso?.(cita.id);
          },

          onCancel: () => {
            console.log("⚠️ Pago cancelado por el usuario");
          },

          onError: (err) => {
            console.error("❌ Error PayPal:", err);
            alert("Error procesando el pago. Intenta nuevamente.");
          },
        }).render(btnRef.current);

        if (isMounted) {
          setStatus("listo");
        }

      } catch (err) {
        console.error("❌ Error renderizando botón:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMsg(err.message);
        }
      }
    };

    esperarYRenderizar();

    return () => {
      isMounted = false;
    };
  }, [cita.id, onPagoExitoso]);

  if (status === "error") {
    return (
      <div style={{ 
        padding: '15px', 
        background: '#fee', 
        borderRadius: '8px', 
        color: '#c00', 
        textAlign: 'center' 
      }}>
        ⚠️ {errorMsg}
        <br />
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '10px', 
            padding: '8px 16px', 
            cursor: 'pointer',
            background: '#fff',
            border: '1px solid #c00',
            borderRadius: '4px'
          }}
        >
          Recargar página
        </button>
      </div>
    );
  }

  if (status === "esperando") {
    return (
      <div style={{ 
        padding: '15px', 
        background: '#f0f7ff', 
        borderRadius: '8px', 
        textAlign: 'center', 
        color: '#333' 
      }}>
        ⏳ Cargando PayPal...
      </div>
    );
  }

  return <div ref={btnRef} style={{ minHeight: '55px', minWidth: '200px' }} />;
}
