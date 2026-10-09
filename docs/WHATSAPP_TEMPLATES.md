# Plantillas de WhatsApp (borrador para registrar en Meta)

> Marca: el servicio es **CuentaFacil de PascalIA** y el asistente se llama **Pascal**.

> Se usan **solo fuera de la ventana de 24 h**. Dentro de la ventana el bot responde con mensajes normales.
> Categoría **Utilidad** (no marketing). Idioma: `es` (Español). Las variables van como `{{1}}`, `{{2}}`…
> Meta revisa cada plantilla; los textos deben ser transaccionales y sin promociones. Estado de aprobación: se registra a mano en el panel (Fase 1).
> Desde el 1-oct-2026 Meta cobra también los mensajes de servicio dentro de la ventana (ver `docs/PLAN.md` §4).

| Nombre | Cuándo | Texto | Variables | Botones |
|--------|--------|-------|-----------|---------|
| `recordatorio_planilla` | Día 20 (HRNO) | Hola {{1}}, te recuerdo pagar tu planilla de seguridad social del mes de {{2}}. Cuando la tengas, envíamela por aquí. | 1: nombre · 2: mes | Respuesta rápida: "Ya la pagué" |
| `recordatorio_antecedentes` | Día 25 (HRNO) | Hola {{1}}, es momento de descargar tus certificados de antecedentes para la cuenta de {{2}}. Te dejo el enlace de la Policía; los demás te los envío al responder. | 1: nombre · 2: mes | URL: portal de antecedentes · Respuesta rápida: "Ver enlaces" |
| `recordatorio_cierre` | Último día del periodo | Hola {{1}}, hoy cierra tu periodo {{2}} del contrato {{3}}. ¿Revisamos el borrador de tu informe? | 1: nombre · 2: rango de fechas · 3: contrato | Respuesta rápida: "Ver borrador" |
| `recordatorio_diario` | Hora elegida por el contratista (opcional) | Hola {{1}}, ¿qué hiciste hoy en tu contrato? Puedes mandarme un audio o fotos. | 1: nombre | Respuesta rápida: "No más recordatorios" |
| `faltan_soportes` | 3 días antes del cierre, si falta algo | Hola {{1}}, para tu cuenta de {{2}} aún me faltan: {{3}}. | 1: nombre · 2: mes · 3: lista corta | Respuesta rápida: "¿Qué me falta?" |
| `aviso_fin_contrato` | 15 días antes del fin del contrato | Hola {{1}}, tu contrato {{2}} termina el {{3}}. Si firmaste un contrato nuevo, envíamelo para seguir con tus cuentas. | 1: nombre · 2: contrato · 3: fecha | Respuesta rápida: "Enviar contrato" |
| `documentos_listos` | Generación terminada fuera de la ventana | Hola {{1}}, tus documentos de la cuenta {{2}} están listos. Responde para recibirlos. | 1: nombre · 2: contrato y periodo | Respuesta rápida: "Enviármelos" |
| `link_pago` (Fase 3) | Suscripción por vencer | Hola {{1}}, tu suscripción del contrato {{2}} vence el {{3}}. Puedes renovarla aquí. | 1: nombre · 2: contrato · 3: fecha | URL: link de pago Wompi |

Reglas del bot:
- Toda plantilla incluye la salida "No más recordatorios" o se puede responder **STOP**.
- Si el contratista desactivó recordatorios, solo se envían `documentos_listos` y `link_pago` cuando él lo haya pedido.

## Bienvenida

### `bienvenida_cuentafacil` (plantilla: CuentaFacil escribe primero)

Solo para personas que dieron su número y aceptaron recibir mensajes (formulario, QR, inscripción). Nunca a listas compradas o extraídas.

| Campo | Valor |
|-------|-------|
| Categoría | Utilidad (si Meta la reclasifica como Marketing, se acepta) |
| Idioma | `es` |
| Encabezado (texto) | Bienvenido a CuentaFacil |
| Pie | Responde STOP si no quieres recibir mensajes |
| Botones (respuesta rápida) | `Acepto y comienzo` · `Ver política de datos` · `No, gracias` |
| Ejemplos | `{{1}}` = María · `{{2}}` = la ESE Hospital Regional Noroccidental |

Cuerpo:

```
Hola {{1}}, soy Pascal, el asistente de CuentaFacil de PascalIA. Gracias por inscribirte.

Te ayudo a preparar tus cuentas de cobro de {{2}}: me cuentas por aquí lo que haces cada día (texto, audio o fotos), te recuerdo los soportes y al cierre del periodo te entrego tu informe de actividades listo para firmar.

Para empezar necesito que aceptes nuestra política de tratamiento de datos personales (Ley 1581 de 2012).
```

### Bienvenida libre (el contratista escribe primero; no requiere aprobación de Meta)

```
👋 ¡Hola! Soy Pascal, el asistente de CuentaFacil de PascalIA.

Te acompaño a preparar tus cuentas de cobro de contratos de prestación de servicios con entidades públicas:
📝 Registras lo que haces cada día (texto, audio o fotos).
📎 Te recuerdo la planilla, los antecedentes y las afiliaciones.
📄 Al cierre te entrego tu informe de actividades y el borrador del informe de supervisión, listos para firmar.

Para continuar, acepta nuestra política de tratamiento de datos: https://pascalia.lat/politica-de-datos/
```
Botones: `Acepto` · `No acepto`. Política publicada en https://pascalia.lat/politica-de-datos/ (botón "Ver política de datos" = URL).
