// src/components/PayPalButtonCita.jsx
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const [montando, setMontando] = useState(false);

  useEffect(() => {
    // Verificar que PayPal esté disponible y no estemos ya montando
    if (!window.paypal?.Buttons || montando) return;
    
    setMontando(true);

    const token = localStorage.getItem("token");

    // API v2 usa Buttons (plural) en lugar de Button (singular)
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },

      // En v2 se llama createOrder en lugar de payment
      createOrder: async (data, actions) => {
        console.log("📝 Creando orden para cita:", cita.id);
        
        try {
          const response = await fetch(`${API_URL}/citas/${cita.id}/pagar/iniciar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Error creando el pago");
          }

          const data = await response.json();
          
          if (!data.success || !data.payment_id) {
            const mensaje = data.error || data.details || "No se obtuvo payment_id";
            throw new Error(mensaje);
          }

          console.log("✅ Orden creada:", data.payment_id);
          // IMPORTANTE: retornar el payment_id a PayPal
          return data.payment_id;
          
        } catch (error) {
          console.error("❌ Error en createOrder:", error);
          alert("❌ Error creando el pago: " + error.message);
          throw error;
        }
      },

      // En v2 se llama onApprove en lugar de onAuthorize
      onApprove: async (data, actions) => {
        console.log("✅ Pago aprobado:", data);
        
        try {
          const response = await fetch(`${API_URL}/citas/${cita.id}/pagar/confirmar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              // En v2 se llama orderID en lugar de paymentID
              paymentId: data.orderID,
              payerId: data.payerID,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            const msg = result.error || result.details || "Error al confirmar el pago";
            throw new Error(msg);
          }

          console.log("✅ Pago confirmado");
          // Avisar al padre para que saque la tarjeta de la lista
          onPagoExitoso?.(cita.id);
          alert("✅ Pago confirmado. ¡Tu cita ha quedado pagada!");
          
        } catch (error) {
          console.error("❌ Error confirmando:", error);
          alert("❌ No se pudo confirmar el pago: " + error.message);
        }
      },

      onCancel: (data) => {
        console.log("⚠️ Pago cancelado por el usuario");
      },

      onError: (err) => {
        console.error("❌ Error en PayPal:", err);
        alert("❌ Ocurrió un error con PayPal. Reintenta.");
      },
    }).render(btnRef.current);

  }, [cita.id, montando, onPagoExitoso]);

  return (
    <div 
      ref={btnRef} 
      style={{ minHeight: '55px', minWidth: '200px' }}
    />
  );
}
