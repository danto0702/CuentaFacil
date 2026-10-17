# Brag plan — CuentaFacil

Invocación: `/brag --tone polished --format vertical` (ejecutado como *brag-slim*: el video se arma completo con las herramientas de la máquina).
Formato: vertical 1080×1920, 30 fps, **26,25 s**. Música a 96 BPM (pulso = 0,625 s); los cortes caen en pulso.

## Respuestas de inspección

- **Qué es:** un asistente de WhatsApp (Pascal) que prepara cada mes la cuenta de cobro de contratistas de prestación de servicios del Estado.
- **Para quién:** contratistas de ESE, hospitales, alcaldías y gobernaciones; les ahorra el informe a última hora y el enredo de soportes y PDF.
- **Qué lo distingue:** todo por WhatsApp, con nota de voz; revisa la planilla PILA; nunca inventa actividades y pide aprobación antes de generar los finales.
- **Afirmación más fuerte:** "Tu cuenta de cobro, lista cada mes. Sin pelearte con Word." (copy real de la landing).
- **Gancho visual:** el día 30 en un calendario (el mismo calendario del logo) y la pregunta que todo contratista conoce.
- **UI real:** el chat de la landing (`pascalia-web/cuentafacil/index.html`, `.phone.m-cf`), con sus mensajes literales y la marca "Ejemplo ilustrativo".
- **Tono:** *polished*: sobrio, elegante, pausas largas, fundidos suaves.
- **Caption:** ver `share-copy.txt`.

## Ángulo

El fin de mes del contratista es siempre la misma carrera. El video la convierte en una conversación tranquila de WhatsApp que termina con el PDF del informe, y cierra con el principio del producto: *Tú firmas, tú decides.*

## Identidad

- Colores de `pascalia-web/sitio.css`: amarillo PascalIA `#FFC107`, grafito `#1F1F1F`, crema `#FFF8E1` / fondo `#FFFDF7`, burbujas de WhatsApp `#DCF8C6` y fondo de chat `#EFE8DE`.
- Tipografías del sitio: Bricolage Grotesque (titulares) y Geist (texto), cargadas localmente.
- Logo real `cuentafacil/logo.webp` e íconos de `iconos.svg` (whatsapp, mic, doc, pen, check).

## Storyboard

| # | Tiempo | Escena | En pantalla | Movimiento | Sonido |
|---|--------|--------|-------------|------------|--------|
| 1 | 0–3,75 s | **Gancho** | Calendario "30 · OCT". "Día 30." / "¿Y tu cuenta de cobro?". Alrededor, chips de lo que falta: *Informe de actividades*, *Planilla PILA*, *Antecedentes*, *PDF y carpetas* | El calendario cae y rebota; los chips entran desordenados y tiemblan apenas | Pad suave; "tic" grave por chip |
| 2 | 3,75–7,5 s | **Revelación** | Fondo amarillo; logo CuentaFacil; "Tu cuenta de cobro, lista cada mes." + "Sin pelearte con Word." resaltado | Círculo amarillo que crece desde el calendario; logo con escala suave; resaltado que se pinta | Entra el ritmo; *whoosh* suave en el corte |
| 3 | 7,5–16,25 s | **El producto en uso** | "Le cuentas por WhatsApp lo que hiciste." Teléfono con el chat real: nota de voz 0:42 → "Listo, la anoté en la obligación 3…" → "Sí, perfecto" → "Recibí tu planilla PILA…" → *Informe de actividades No. 03 de 06.pdf*. Tarjetas "Nunca inventa" y "Tú apruebas". Pie "Ejemplo ilustrativo" | El teléfono sube; indicador "escribiendo…" antes de cada respuesta; burbujas una por una en el pulso | "Pop" afinado por mensaje; campanita al llegar el PDF |
| 4 | 16,25–22,5 s | **Cierre** | Fondo grafito. "Tú firmas, tú decides." Precios: **$15.000** configurar tu contrato · **$50.000** cada cuenta de cobro. Botón "Empezar por WhatsApp" y `pascalia.lat/cuentafacil` | Panel oscuro que sube; precios en cascada; botón con brillo | Acorde final que se abre y se apaga |

Duraciones: 3,75 + 3,75 + 8,75 + 10 = **26,25 s**.

**Actualización 2026-10-17:** al cierre, los precios salen a los 20,9 s y entra el **código QR** a `https://pascalia.lat/cuentafacil/` (21,25 s), el mismo del video "día a día": tarjeta blanca redondeada, puntos redondos y logo al centro, "Escanéame y empieza". El cierre se alargó para dar tiempo a escanear. Verificado con OpenCV sobre el video final (10/10 lecturas).

## Cuidados

- Sin nombres de clientes, cifras de uso, testimonios ni región/entidad piloto (`PRODUCT.md`). La conversación es la de la landing, marcada como *Ejemplo ilustrativo*.
- Precios reales y vigentes (`/terminos/#precios`).

## Música

Original, sintetizada para este video (numpy): Fa mayor, 96 BPM, progresión F – Am – B♭ – C, pad cálido + arpegio tipo marimba suave + pulso discreto desde la escena 2. Los efectos (pops, campanita, whoosh) están afinados a notas del acorde y mezclados por debajo de la música.
