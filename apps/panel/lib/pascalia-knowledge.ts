import { BRAND } from '@cuentasbot/conversation';

/**
 * What PascalBot may say about PascalIA and its other solutions (CuentaFacil lives in
 * pascalbot-knowledge.ts). Taken from the published pages of pascalia.lat; update it when they change.
 * Prices appear only where the page publishes them.
 */
export const PASCALIA_KNOWLEDGE = `
# PascalIA
PascalIA es una empresa colombiana (Ábrego, Norte de Santander) de consultoría, desarrollo y capacitación en inteligencia artificial para organizaciones y personas. Lema: "Ideas que hacen florecer tu organización". Principio: la IA organiza, calcula y propone; las decisiones siempre son de las personas.
Tres líneas de trabajo:
- Consultoría (Analiza · Conecta · Transforma): revisamos procesos y datos, identificamos dónde la tecnología y la IA generan valor real y trazamos una ruta realista.
- Desarrollo a la medida (Automatiza · Integra · Escala): herramientas web, asistentes con IA y automatizaciones ajustadas a los formatos, normas y forma de trabajo del equipo.
- Capacitación (Aprende · Aplica · Florece): formamos al equipo para usar la IA y las nuevas herramientas en su trabajo diario, con ejemplos de su propio contexto.
Cómo trabajamos: 1) revisamos contigo cómo se hace hoy, qué formatos y normas aplican y dónde se pierde el tiempo; 2) una primera versión usable con datos de ejemplo para validarla; 3) implementamos y capacitamos, en computador o celular, incluso con poca conexión; 4) ajustamos con el uso real y cuando cambia la norma o el formato.
Los precios de consultoría, capacitación y desarrollos a la medida se dan en una cotización, después de conocer el caso.

# Productos listos para negocios
- *Pascal Web* (páginas web para restaurantes, bares, consultorios y otros negocios): diseñamos, creamos y mantenemos la página. Proceso: hablamos de tu negocio y mostramos una propuesta visual propia (no una plantilla); construimos la página para celular primero y tú la apruebas antes de publicar; registramos el dominio, la alojamos con certificado de seguridad y la dejamos con aviso de cookies, políticas y Google Maps; cada mes cambiamos precios, fotos, horarios y promociones cuando nos escribas. Planes (pesos colombianos, IVA incluido):
  - Vitrina: $790.000 de creación (una vez) + $69.000 al mes. Una sección a tu medida, botón de WhatsApp, Google Maps y horarios, dominio .com o .co y hosting, políticas, aviso de cookies y accesibilidad, hasta 3 cambios de contenido al mes.
  - Negocio: $1.490.000 + $119.000 al mes. Hasta 6 secciones y carta o catálogo, reservas o citas en línea con aviso por WhatsApp, ajustes mensuales de precios, fotos y promociones, reporte mensual de visitas si se activa la analítica.
  - Negocio + MesaViva: $1.990.000 + $179.000 al mes. Para restaurantes, bares y cafeterías: carta conectada a MesaViva con pedido desde la mesa por QR, cuenta dividida y pago desde el celular, códigos QR impresos. La licencia de MesaViva se cotiza aparte.
  El dominio queda a nombre del cliente; el mantenimiento se cancela cuando quiera, sin multas, y se le entrega el dominio y una copia de la página. Fotos profesionales, tienda en línea o más secciones se cotizan aparte, siempre antes de hacerlos. El tiempo de entrega depende del plan y de qué tan rápido llegan textos y fotos; la fecha se da en la cotización. Hay cuatro ejemplos ficticios para probar en https://pascalia.lat/pascal-web/ (bistró, restaurante, bar y consultorio odontológico).
- *MesaViva* (restaurantes, bares, cafés y comercios; en desarrollo, se están sumando los primeros restaurantes): los clientes piden desde la mesa tocando un chip NFC o escaneando un QR, sin instalar nada; dividen la cuenta por plato ("para mí", "al centro" o en partes) y la suma de las partes da exactamente el total; pagan por persona en línea, en efectivo, con datáfono o transferencia. La caja lo ve en el mismo segundo; el mesero aprueba antes de enviar a cocina si así se quiere; comandas en pantalla e impresora de cocina; facturación electrónica por un proveedor autorizado por la DIAN (una factura por mesa); comisiones de meseros y reparto de propinas (propina sugerida máxima 10 % y siempre voluntaria). También pedidos por WhatsApp en el número del restaurante, domicilios con motorizado propio sin comisión a plataformas e inventario con recetas, lotes, vencimientos y código de barras. Planes (licencia mensual, el precio se da en la cotización): Esencial (1 caja, 4 usuarios: POS, factura electrónica, inventario, código de barras, carta QR), Restaurante (2 cajas, 10 usuarios: más pedidos por WhatsApp, mesas, meseros, cocina, recetas), MesaViva (4 cajas, 15 usuarios: más mesa NFC, pago por persona, CRM y domicilios) y Cadena (varias sedes, nómina electrónica, RADIAN y reportes consolidados). Demo en https://pascalia.lat/mesaviva/
- *Fanátikos* (campeonatos de fútbol aficionado; en pruebas con un campeonato): tabla en vivo, planilla del árbitro en el celular con goles, asistencias y tarjetas, acta firmada en PDF, estadísticas y fichas de equipos con fotos, y afiches para redes con escudos y patrocinadores. Sin instalar nada. https://pascalia.lat/fanatikos/
- *PV Car* (demo abierta): convierte el celular en cámara para el carro. Graba en bucle en el espacio que elijas (4 a 64 GB) con fecha, hora, ubicación y velocidad; un golpe, el botón Proteger o la voz ("Okay Pascal") protegen la evidencia; genera un acta PDF con huella SHA-256 y firma. Funciona sin señal y lo grabado queda solo en el teléfono. El valor del acta como prueba lo decide la autoridad competente. https://pascalia.lat/pv-car/
- *PascalPDF Studio*: editar y firmar PDF desde el navegador, gratis y sin instalar nada: corregir texto, firmar a mano o con imagen, sellos, notas y hoja de evidencia con huella SHA-256. https://pascalia.lat/PascalPDF_Studio/
- *Pascal Sign*: la versión ligera de PascalPDF solo para firmar desde el celular: abre el PDF o Word desde WhatsApp o tus archivos, firma con el dedo y compártelo; también se puede pedir la firma a otra persona con un enlace. Se instala como app en Android y iPhone y funciona sin conexión. https://pascalia.lat/PascalSign/
- Sobre la firma de PascalPDF y Pascal Sign: es firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012), no firma digital certificada; hay que verificar que el trámite o la entidad la acepte. Las firmas se guardan cifradas solo en el dispositivo.

# Desarrollos a la medida para empresas
Ejemplos de lo que construimos: implementación NFC (tarjetas de presentación digitales, control de activos, asistencia), páginas web, menús interactivos por QR o NFC, dashboards de ventas e inventarios, asistentes por WhatsApp con IA, lectura inteligente de documentos (facturas, formularios y soportes a Excel), documentos automáticos (cotizaciones, contratos, certificados), CRM y seguimiento de clientes, reservas y agendamiento, y apps de captura en campo que funcionan sin señal. https://pascalia.lat/desarrollos/

# Suite de Salud Pública (ESE, IPS y secretarías de salud)
Herramientas usadas en la operación diaria y adaptadas a los formatos y territorios de cada entidad:
- *SI-APS*: caracterización sociofamiliar e individual de atención primaria en terreno, con o sin señal; familiograma, ecomapa, APGAR familiar, Zarit y tamizajes de salud mental (SRQ, RQC, AUDIT, ASSIST); plan de cuidado por curso de vida (Res. 3280 de 2018) y archivo plano APS124CCFP para PISIS con validador. https://pascalia.lat/si-aps/
- *NANA DNT*: seguimiento nominal del riesgo y la desnutrición aguda en menores de 5 años para IPS de primer nivel (Res. 2350 de 2020 y Res. 115 de 2026): puntajes Z con tablas OMS, perímetro braquial, ruta por edad, prueba de apetito, remisión, control semanal y check-list hasta el egreso. Sus cálculos apoyan al equipo y no reemplazan la prescripción médica. https://pascalia.lat/nana-dnt/
- *Misión Médica*: reporte de infracciones e incidentes con radicado, carnet del personal con QR de verificación, gestión de emblemas, capacitación en DIH con pretest y postest, plan de contingencia, desplazamientos e inspección de emblemas. https://pascalia.lat/mision-medica/
- *Flota Vehicular*: itinerario digital de vehículos y conductores; salidas y llegadas desde el celular con hora del servidor, GPS, kilometraje y foto; funciona sin señal; checklist de distintivos de Misión Médica, días de operación y planilla de tiempos para firma. https://pascalia.lat/flota/
- También: vacunación (PAI), vigilancia epidemiológica (SIVIGILA) y reportes a PISIS (SEG500USIN, SER124DREC).
Estas soluciones se cotizan para cada entidad.

# Contacto y cotizaciones
- Formulario de contacto en ${BRAND.website} (y en la página de cada solución); respondemos normalmente el siguiente día hábil.
- Correo: contacto@pascalia.lat
- WhatsApp de PascalIA: https://wa.me/${BRAND.whatsapp} (+57 312 388 5012). Para CuentaFacil, ese mismo número es Pascal.
- Políticas: tratamiento de datos ${BRAND.privacyPolicy}, términos ${BRAND.terms}, cookies https://pascalia.lat/politica-de-cookies/, reembolsos https://pascalia.lat/reembolsos/ y eliminación de datos https://pascalia.lat/eliminar-mis-datos/
`.trim();
