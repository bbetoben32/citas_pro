// src/components/PayPalButtonCita.jsx
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PAYPAL_CLIENT_ID = "AXhZRD0uJVqhIxjjpBsxpfbTbwB8Y_QcCCPspCyduIp_Hlb-g_gaPbhUG0QtFMQVQ67CA3e2aHDA2bG_";

export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const [status, setStatus] = useState("cargando");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPayPalScript = () => {
      return new Promise((resolve, reject) => {
        // Si ya existe PayPal
        if (window.paypal?.Buttons) {
          console.log("✅ PayPal ya estaba cargado");
          resolve();
          return;
        }

        // Remover script anterior si existe
        const existingScript = document.getElementById("paypal-sdk");
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.id = "paypal-sdk";
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;

        script.onload = () => {
          console.log("✅ Script de PayPal cargado");
          // Esperar un momento para que PayPal se inicialice
          setTimeout(() => {
            if (window.paypal?.Buttons) {
              resolve();
            } else {
              reject(new Error("PayPal.Buttons no disponible después de cargar"));
            }
          }, 500);
        };

        script.onerror = (e) => {
          console.error("❌ Error cargando script:", e);
          reject(new Error("Error cargando script de PayPal"));
        };

        document.body.appendChild(script);
      });
    };

    const renderButton = async () => {
      try {
        setDebugInfo("Cargando SDK...");
        await loadPayPalScript();

        if (!isMounted) return;

        setDebugInfo("SDK cargado, renderizando botón...");

        if (!btnRef.current) {
          throw new Error("Contenedor del botón no encontrado");
        }

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
            console.log("📝 Respuesta del servidor:", data);

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

          onCancel: () => console.log("⚠️ Pago cancelado"),
          onError: (err) => {
            console.error("❌ Error PayPal:", err);
            alert("Error con PayPal: " + err.message);
          },
        }).render(btnRef.current);

        if (isMounted) {
          setStatus("listo");
          setDebugInfo("");
        }

      } catch (err) {
        console.error("❌ Error completo:", err);
        if (isMounted) {
          setStatus("error");
          setDebugInfo(err.message);
        }
      }
    };

    renderButton();

    return () => {
      isMounted = false;
    };
  }, [cita, onPagoExitoso]);

  if (status === "error") {
    return (
      <div style={{ padding: '15px', background: '#fee', borderRadius: '8px', color: '#c00', textAlign: 'center' }}>
        ⚠️ Error: {debugInfo}
        <br />
        <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
          Recargar página
        </button>
      </div>
    );
  }

  if (status === "cargando") {
    return (
      <div style={{ padding: '15px', background: '#f0f7ff', borderRadius: '8px', textAlign: 'center', color: '#333' }}>
        ⏳ {debugInfo || "Cargando PayPal..."}
      </div>
    );
  }

  return <div ref={btnRef} style={{ minHeight: '55px', minWidth: '200px' }} />;
}
