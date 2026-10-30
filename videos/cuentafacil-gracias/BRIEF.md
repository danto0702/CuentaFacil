---
workflow: general-video
flow: companion
storyboard: no
message: "Gracias a quienes confiaron en CuentaFácil en octubre; Pascal puede ser tu asistente en noviembre."
destination: reels-tiktok-whatsapp
aspect: 1080x1920
language: es-CO
audience: contratistas de prestación de servicios de entidades públicas colombianas
length: ~50s
angle: halloween-agradecimiento-a-noviembre
voice: clone:voxcpm2 — voz del dueño, con su autorización (referencia del 2026-10-27)
---

## Intent

Video de agradecimiento con temática de Halloween. Noche del 31 de octubre: los terrores del último día quedaron vencidos, Pascal mago agradece a cada contratista que confió en CuentaFácil y muestra cuentas listas. A medianoche se quita el disfraz, el calendario pasa a noviembre y el estilo cambia de la noche morada a la identidad PascalIA (crema, amarillo, grafito, Montserrat/Inter). Pascal se ofrece como asistente del mes que empieza. Cierre con QR.

## Assets

- assets/src/ — hojas generadas por el dueño (2026-10-30): Pascal mago (reverencia y varita), Pascal normal (celular y señalando), transformación, terrores vencidos, contratistas celebrando. Recortadas con birefnet en assets/chars/ (tools/cutout.py).
- Personajes de Halloween, fuentes, GSAP, logo, flor y QR copiados de cuentafacil-halloween.

## Customizations

- Guion aprobado por el dueño con el cambio: "Pero el mes ya terminó… y noviembre ya empieza." (2026-10-30).
- Voz: VoxCPM2 local (tools/vo_voxcpm.py); escena 1 con eco suave, el resto limpio.
- Música original (tools/music.py): misterio en re menor, agradecimiento en fa mayor, campanadas a medianoche, noviembre en sol mayor.

## Notes

- Sin cifras de clientes, sin testimonios, sin nombres de entidades ni personas reales (contratistas ilustrados).
- Sin oferta de precio en el cierre (pendiente de decisión del dueño).
