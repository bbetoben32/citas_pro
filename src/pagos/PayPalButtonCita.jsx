// src/pagos/PayPalButtonCita.jsx
import { useEffect, useRef } from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const renderizado = useRef(false);

  useEffect(() => {
    if (renderizado.current) return;

    const renderButton = () => {
      if (!window.paypal?.Buttons) {
        console.error("❌ PayPal no está disponible");
        return;
      }

      if (!btnRef.current) {
        console.error("❌ Contenedor no disponible");
        return;
      }

      console.log("✅ Renderizando botón de PayPal...");
      renderizado.current = true;

      const token = localStorage.getItem("token");

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45
        },

        createOrder: async () => {
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

          return data.payment_id;
        },

        onApprove: async (data) => {
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

        onCancel: () => console.log("⚠️ Pago cancelado"),
        
        onError: (err) => {
          console.error("❌ Error PayPal:", err);
          alert("Error con PayPal. Intenta de nuevo.");
        },
      }).render(btnRef.current);
    };

    if (window.paypal?.Buttons) {
      renderButton();
    } else {
      let intentos = 0;
      const interval = setInterval(() => {
        intentos++;
        if (window.paypal?.Buttons) {
          clearInterval(interval);
          renderButton();
        } else if (intentos > 6) {
          clearInterval(interval);
          console.error("❌ PayPal no se cargó en 3 segundos");
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [cita.id, onPagoExitoso]);

  return <div ref={btnRef} style={{ minHeight: '55px', minWidth: '200px' }} />;
}
