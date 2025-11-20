// src/components/PayPalButtonCita.jsx
import { useEffect, useRef, useState } from "react";


export default function PayPalButtonCita({ cita, onPagoExitoso }) {
  const btnRef = useRef(null);
  const [montando, setMontando] = useState(false);

  useEffect(() => {
    if (!window.paypal || montando) return;
    setMontando(true);

    const token = localStorage.getItem("token");

    window.paypal.Button.render(
      {
        env: "sandbox", // o 'production' cuando cambies
        style: {
          size: "medium", // small | medium | large | responsive
          color: "gold",      // gold | blue | silver | black
          shape: "rect",      // pill | rect
          label: "paypal",
          tagline: false     // checkout | pay | buynow | paypal | installment
        },

        // 1) Crear el pago en TU backend (retorna payment_id)
        payment: function () {
          return fetch(`http://localhost:5000/citas/${cita.id}/pagar/iniciar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Error creando el pago");
              return res.json();
            })
            .then((data) => {
              if (!data.success || !data.payment_id) {
                const mensaje = data.error || data.details || "No se obtuvo payment_id";
                throw new Error(mensaje);
              }
              // IMPORTANTE: retornar el payment_id a PayPal
              return data.payment_id;
            });
        },

        // 2) El usuario autoriza en el pop-up de PayPal
        onAuthorize: function (data, actions) {
          // data.paymentID y data.payerID vienen de PayPal (v1)
          const body = JSON.stringify({
            paymentId: data.paymentID,
            payerId: data.payerID,
          });

          return fetch(
            `http://localhost:5000/citas/${cita.id}/pagar/confirmar`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body,
            }
          )
            .then((res) => res.json().then((j) => ({ ok: res.ok, j })))
            .then(({ ok, j }) => {
              if (!ok || !j.success) {
                const msg = j.error || j.details || "Error al confirmar el pago";
                throw new Error(msg);
              }
              // Avisar al padre para que saque la tarjeta de la lista
              onPagoExitoso?.(cita.id);
              alert("✅ Pago confirmado. ¡Tu cita ha quedado pagada!");
            })
            .catch((err) => {
              console.error(err);
              alert("❌ No se pudo confirmar el pago: " + err.message);
            });
        },

        onCancel: function () {
          // El usuario cerró el pop-up o canceló
          console.log("Pago cancelado por el usuario");
        },

        onError: function (err) {
          console.error("Error en PayPal:", err);
          alert("❌ Ocurrió un error con PayPal. Reintenta.");
        },
      },
      btnRef.current
    );
  }, [cita, montando]);

  return <div ref={btnRef} />;
}
