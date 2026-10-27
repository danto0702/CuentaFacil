# Guía de marca PascalIA · v1.0

Identidad visual y de movimiento para **todas** las páginas, paneles y herramientas que crea PascalIA. La implementación de referencia es la página de MesaViva en pascalia.lat; este kit la convierte en un sistema que se puede copiar.

> Abre `guia-visual.html` en el navegador para ver todo funcionando (colores, tipografía, componentes, íconos y animaciones).

---

## 1. Esencia

| | |
|---|---|
| **Nombre** | Pascal**IA**: "Pascal" en grafito, "IA" en amarillo. Escrito siempre junto, con IA en mayúsculas. |
| **Promesa** | *Ideas que hacen florecer tu organización.* |
| **Frase de apoyo** | *Conocimiento. Tecnología. Personas. Resultados.* · *Empresas que evolucionan, personas que florecen.* |
| **Servicios** | Consultoría (Analiza · Conecta · Transforma) · Desarrollo (Automatiza · Integra · Escala) · Capacitación (Aprende · Aplica · Florece) |
| **Valores** | Innovación con propósito · Soluciones humanas · Crecimiento sostenible · Conocimiento sin límites |
| **Símbolo** | La flor-red: seis pétalos (crecimiento) unidos por venas y nodos (red, conocimiento conectado). |
| **Personaje** | Pascal, el asistente. Cercano, servicial, nunca inventa. |
| **Personalidad visual** | Cálida, clara, optimista y ordenada. Mucho blanco, amarillo para actuar, grafito para cerrar. |

---

## 2. Logo

### Versiones (`logos/`)

| Archivo | Uso |
|---|---|
| `logo-horizontal.svg` | Principal. Encabezados, documentos, firmas de correo. |
| `logo-vertical.svg` | Espacios cuadrados: avatares, portadas, stickers. |
| `wordmark.svg` | Solo palabra, cuando la flor ya aparece cerca. |
| `*-blanco.svg` | Sobre grafito (#1F1F1F) o fotos oscuras con velo. |
| `*-una-tinta.svg` | Impresión a una tinta, sellos, grabado. |
| `flor.svg` | Símbolo solo: favicon, marca de agua, decoración. |
| `flor-sobre-oscuro.svg` | Símbolo sobre grafito (venas en grafito, pétalos sólidos). |
| `flor-contorno.svg` | Solo trazo, para fondos y texturas muy suaves. |
| `favicon.svg` + `png/` | Favicon, PNG a 32/192/512/1024, `apple-touch-icon-180.png`, `tarjeta-social-1200x630.png`. |

Las letras del logo están convertidas a curvas (Montserrat 800, tracking −0.03em): no dependen de la fuente instalada.

### En HTML (logo vivo)

```html
<a class="logo" href="/">
  <svg class="flor" aria-hidden="true"><use href="#flor"/></svg>
  <span class="logo-txt">
    <span class="logo-name">Pascal<b>IA</b></span>
    <span class="logo-by">Sub-producto <b>de PascalIA</b></span> <!-- opcional -->
  </span>
</a>
```

### Reglas

- **Área de protección:** alrededor del logo, un espacio libre igual a la altura de la "P".
- **Tamaño mínimo:** flor de 24 px en pantalla (16 px solo en favicon, sin palabra); logo horizontal de 120 px de ancho; impreso, 25 mm.
- **Fondos permitidos:** blanco, crema (#FFF8E1), grafito (#1F1F1F, versión blanca), fotos con velo oscuro del 60 % o más.
- **No hagas:** cambiar colores de pétalos, quitar venas o nodos, rotar, deformar, añadir sombras o contornos, poner el logo sobre amarillo, separar "IA" del resto, escribir "Pascalia", "PascaLIA" o "Pascal IA".

---

## 3. Color

### Paleta

| Token | Hex | Rol | Contraste vs blanco | vs grafito |
|---|---|---|---|---|
| `--yellow` | `#FFC107` | **Acción**: botones primarios, marcador, nodos, puntos, foco sobre oscuro | 1.6:1 | 10.1:1 |
| `--yellow-hover` | `#FFB300` | Hover del amarillo, cursor de escritura, íconos destacados | 1.8:1 | 9.2:1 |
| `--yellow-soft` | `#FFD54F` | Selección de texto, inicio del degradado | 1.4:1 | 11.7:1 |
| `--gold-ink` | `#8A6100` | Amarillo **legible** sobre blanco: eyebrows, detalles pequeños | 5.5:1 ✅ | 3.0:1 |
| `--graphite` | `#1F1F1F` | Texto principal, botón oscuro, **resultados y cierre** | 16.5:1 ✅ | – |
| `--graphite-deep` | `#181818` | Pie de página | 17.8:1 | – |
| `--muted` | `#5C5C5C` | Texto secundario, párrafos de apoyo | 6.7:1 ✅ | – |
| `--gray` | `#E9E9E9` | Líneas finas (hairline), divisores, campos | – | – |
| `--cream` | `#FFF8E1` | Calidez: secciones alternas, paneles, íconos en mosaico | – | 15.5:1 |
| `--cream-line` | `#F3E7BE` | Hairline sobre crema | – | – |
| `--white` | `#FFFFFF` | Aire. Fondo principal. | – | 16.5:1 |
| `--on-dark` | `#CFCFCF` | Texto secundario sobre grafito | – | 10.6:1 |
| error | `#B3261E` | Solo errores de formulario | 6.5:1 | – |

**Degradado de marca:** `linear-gradient(135deg, #FFD54F 0%, #FFC107 55%, #FFB300 100%)`. Solo en detalles: barras de progreso, pétalos decorativos, puntos.

### Proporción en una página

≈ 70 % blanco · 15 % crema · 8 % grafito · 5 % amarillo · 2 % gris. Si el amarillo pasa del 10 %, deja de llamar la atención.

### Reglas de color

1. **Grafito sobre amarillo, siempre.** Nunca texto blanco sobre amarillo (1.6:1, ilegible).
2. **El amarillo es acción.** Si algo es amarillo, se puede tocar o es lo más importante. Nunca como fondo de sección completa.
3. **El grafito es resultado.** Úsalo para la cifra final, el bloque de resultado, la sección de valores/cifras y el cierre de la página.
4. **Amarillo como texto solo sobre grafito** (`.y`), o `--gold-ink` sobre blanco en tamaños pequeños.
5. **Crema para calidez**, alternando con blanco entre secciones. Nunca dos secciones crema seguidas.

---

## 4. Tipografía

Dos voces: **Montserrat habla** (titulares, botones, etiquetas, cifras) e **Inter explica** (texto corrido, campos, chips, respuestas). Ambas con licencia SIL OFL, incluidas en `fuentes/` (woff2, latín + latín extendido).

| Estilo | Fuente | Peso | Tamaño | Interlineado | Tracking | Notas |
|---|---|---|---|---|---|---|
| Display (H1) | Montserrat | 800 | `clamp(2.5rem, 6vw, 4.75rem)` | 1.05 | −0.02em | Máx. 13ch, `text-wrap: balance` |
| Headline (H2) | Montserrat | 700 | `clamp(2rem, 4vw, 3.25rem)` | 1.1 | −0.02em | |
| Title (H3) | Montserrat | 700 | `clamp(1.35rem, 2.2vw, 1.75rem)` | 1.2 | −0.01em | |
| Figure | Montserrat | 800 | `clamp(2.6rem, 5vw, 4rem)` | 1 | −0.02em | `font-variant-numeric: tabular-nums` |
| Lead | Inter | 400 | `clamp(1.0625rem, 1.6vw, 1.25rem)` | 1.65 | 0 | Color muted, máx. 36em |
| Body | Inter | 400 | 1.0625rem (17 px) | 1.65 | 0 | |
| Label / botón | Montserrat | 600 | 1rem | 1.1 | 0 | |
| Eyebrow | Montserrat | 700 | .8rem | – | .08em | MAYÚSCULAS, `--gold-ink` |
| Fine | Inter | 400 | .875rem | – | 0 | Color muted |

**Cargar las fuentes:** `css/fuentes.css` (local). Alternativa con Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
```

**Reglas:** sin otras familias; sin cursivas decorativas; sin mayúsculas sostenidas en titulares; números de dinero siempre en Montserrat con `tabular-nums` y formato colombiano (`$ 1.250.000`).

---

## 5. Espacio, radios y sombras

### Espaciado

| Token | Valor | Uso |
|---|---|---|
| `--s-1` / `--s-2` | 8 / 12 px | Dentro de componentes |
| `--s-3` | 22 px | Entre bloques de un grupo, grilla de tarjetas |
| `--s-4` | 36 px | Titular → contenido |
| `--s-5` | 64 px | Columnas de una sección |
| `--section` | 104 px (80 en móvil) | Padding vertical de sección |
| `--section-sm` | 72 px (56 en móvil) | Secciones compactas |
| `--wrap` | 1200 px | Ancho máximo; margen lateral 16 px |
| `--nav-h` | 72 px → 60 px al bajar (64 → 58 en móvil) | |

### Radios

field 12 · tile 14 · inner 16 · item 18 · window 20 · panel 24 · pill 999. Botones, chips, píldoras y barra de Pascal siempre en píldora.

### Sombras

| Token | Valor | Uso |
|---|---|---|
| hairline | `inset 0 0 0 1px #E9E9E9` | Borde de todo contenedor |
| card | `0 8px 24px rgba(31,31,31,.08)` | Calidez de tarjetas y ventanas |
| lift | `0 22px 48px -18px rgba(31,31,31,.28)` | Hover de tarjetas, resultado, menú |
| brand | `0 10px 30px -10px rgba(255,193,7,.55)` | Resplandor de elementos amarillos en hover |
| askbar | hairline + `0 18px 44px -20px rgba(31,31,31,.25)` | Barra de Pascal |
| device | `0 30px 60px -30px rgba(31,31,31,.5)` | Teléfonos y capturas |

**Hairline + calidez:** todo contenedor lleva línea de 1 px por dentro y una sombra suave. Nunca `border: 1px solid #000`, nunca sombras negras duras.

---

## 6. Íconos

- Set propio de 67 íconos de línea (`iconos/iconos.svg` como sprite, `iconos/svg/` sueltos).
- Rejilla 24 × 24, trazo **1.85**, extremos y uniones **redondeados**, sin relleno, color `currentColor`.
- Tamaño por defecto 1.15em junto a texto; 26–28 px dentro de mosaicos (`.ico-tile`, 60 px, crema, radio 18).
- **Nunca uses emojis como íconos** en interfaces (sí se permiten en mensajes de WhatsApp).
- Si falta un ícono, dibújalo con las mismas reglas o toma uno de Lucide ajustando el trazo a 1.85.

```html
<!-- con el sprite inline al inicio del body -->
<svg class="i" aria-hidden="true"><use href="#chat"/></svg>
```

---

## 7. Pascal (el personaje)

- Solo desde el arte oficial de `graficos/pascal/`: hoja de personaje, guiño, cuerpo entero, rostro y avatar.
- Avatar redondo con anillo amarillo de 2 px (`box-shadow: 0 0 0 2px #FFC107`), recorte `object-position: 50% 20%`.
- No redibujarlo, no cambiarle colores ni ropa, no generarlo con IA, no ponerlo en situaciones que contradigan su rol (Pascal ayuda, nunca inventa).
- Pascal habla en las burbujas de respuesta (`.reply`): radio `6px 22px 22px 22px` (la esquina pegada al avatar es la recta).

---

## 8. Componentes

Todas las clases están en `css/pascalia.css`; el HTML de ejemplo, en `guia-visual.html` y `plantillas/plantilla-pagina.html`.

| Componente | Clases | Especificación |
|---|---|---|
| Botón primario | `.btn .btn-primary` | Píldora, alto mín. 48 px, padding 14/28, Montserrat 600 1rem, amarillo con texto grafito. Hover: sube 2 px, `#FFB300`, sombra brand. Destello diagonal cada 4 s y una vez al pasar el cursor. Presionado: escala .97. Flecha `.arr` se corre 4 px. |
| Botón oscuro | `.btn .btn-dark` | Grafito, texto blanco; hover negro con anillo amarillo de 1.5 px. |
| Botón secundario | `.btn .btn-ghost` | Transparente, anillo grafito 1.5 px; hover crema. |
| Sobre oscuro | `.btn .btn-outline-w` | Anillo blanco 70 %; hover anillo y texto amarillos. |
| Pequeño | `.btn-sm` | 40 px de alto, .92rem. |
| Play | `.play` + `.play-dot` | Círculo amarillo 48 px (76 px grande) con sombra brand; crece 8 % en hover. |
| Píldora en vivo | `.pill-live` | Blanca 80 %, hairline, punto amarillo de 9 px con pulso cada 2 s. |
| Chips | `.chip` | Blanco con hairline, Inter 500 .92rem; hover crema con anillo amarillo 1.5 px; seleccionado amarillo. |
| Etiquetas | `.tag`, `.tag-cream`, `.tag-dark` | Estados: borrador, en revisión, aprobado. |
| Barra de Pascal | `.askbar` | Píldora blanca, rostro de Pascal 40 px con anillo amarillo, campo de 52 px, texto guía con cursor amarillo que parpadea, botón enviar amarillo 52 px. Foco: anillo amarillo 2 px. |
| Pestañas | `.tabs` + `.tab-ink` | Fondo gris 55 %, indicador blanco que se desliza (380 ms) con subrayado amarillo de 3 px. |
| Respuesta | `.reply`, `.bubble-me`, `.typing` | Burbuja blanca de Pascal, burbuja crema del usuario, tres puntos que saltan. |
| Tarjeta | `.card`, `.card-cream`, `.ico-tile` | Radio 24, padding 28, hairline + card. Con enlace: sube 4 px y sombra lift. |
| Ventana | `.win`, `.win-bar`, `.win-body`, `.win-foot` | Radio 20, barra con flor de 20 px, pie crema con total en Montserrat 800. |
| Resultado | `.result`, `.result-value` | Grafito, cifra en amarillo Montserrat 800. Rebota (`pop`) al cambiar. |
| Cifras | `.facts` | Sobre grafito, cifras amarillas, divisores `#3A3A3A`. |
| Listas | `.checks`, `.steps`, `.method` | Check amarillo de 22 px; pasos numerados en círculo amarillo; método con barra amarilla y fondo crema en el paso activo. |
| Formularios | `.field`, `.input`, `.seg`, `.switch` | Radio 12, alto 48, línea `#E0E0E0`; foco: anillo amarillo 2 px + halo. Error `#B3261E` con mensaje que dice cómo arreglarlo. |
| Avisos | `.note`, `.note-dark`, `.note-error` | Crema con ícono dorado; grafito para éxito; rosado para error. |
| FAQ | `.faq` | `<details>` radio 18; al abrir crece una barra amarilla a la izquierda y el "+" gira 45° y se vuelve amarillo. |
| Navegación | `.nav`, `.nav-links`, `.progress`, `.menu-btn` | Sticky 72 px; al bajar 24 px pasa a 60 px, blanco 86 % con desenfoque y línea inferior. Enlaces Montserrat 600 .95rem muted con subrayado amarillo que crece desde la izquierda. Barra de lectura amarilla de 3 px. En móvil: botón circular amarillo de 46 px. |
| Héroe | `.hero`, `.hero-bg`, `.hero-flor` | Degradado crema → blanco con halo amarillo; flor de 640 px al 13 % girando en 60 s. |
| Cierre | `.close` | Grafito, titular blanco con palabra en amarillo, flor con resplandor. |
| Pie | `.foot` | `#181818` con flor de 520 px de marca de agua bajo un velo del 94 %; 4 columnas; enlaces que se vuelven amarillos. |
| Tabla | `.table` | Encabezado crema, filas con línea gris, números a la derecha. |
| Diálogo | `.modal` | `<dialog>` radio 24, fondo oscuro 78 % con desenfoque. |
| Volver arriba | `.to-top` | Círculo amarillo de 52 px abajo a la derecha. |

### Estructura típica de una página

1. Nav sticky con logo, 3–5 enlaces y botón primario pequeño.
2. Héroe: píldora en vivo → H1 con un marcador → lead → 1 primario + 1 secundario → (barra de Pascal o demo).
3. Secciones alternando blanco y crema, cada una con `.head` (eyebrow opcional, H2 con un marcador, lead).
4. Una sección grafito de cifras o valores.
5. FAQ.
6. Cierre grafito con llamado a la acción.
7. Pie `#181818`.

---

## 9. Movimiento

Una sola curva para todo: **`cubic-bezier(.22, 1, .36, 1)`** (sale rápido, llega suave). El movimiento confirma y guía; nunca distrae.

| Efecto | Duración | Detalle |
|---|---|---|
| Color / fondo en hover | 200 ms | Botones, chips, enlaces |
| Elevación de botón | 220 ms | −2 px + sombra brand; flecha +4 px; presionado .97 |
| Destello (shimmer) del primario | ciclo 4 s (inicia a 1.5 s) | Franja blanca 75 % inclinada −20° que cruza; una vez en hover (900 ms) |
| Nav compacta | 300 ms | 72 → 60 px, desenfoque 12 px |
| Subrayado de enlace | 300 ms | Crece desde la izquierda |
| `.reveal` al hacer scroll | 600 ms | Opacidad 0 → 1, sube 24 px; escalonar 80 ms (`.d1 .d2 .d3`) |
| Titular palabra por palabra | 600 ms c/u | Sube 20 px; 80 ms entre palabras; inicia a 150 ms (`.h1[data-words]`) |
| Marcador `.mark` | 900 ms (+200 ms) | Banda amarilla 58–90 % de la línea que se dibuja de izquierda a derecha |
| `.rise` al cargar | 700 ms | Sube 18 px; retrasos 450 / 600 / 750 ms |
| Pulso del punto | 2 s infinito | Halo amarillo de 10 px |
| Cursor de la barra | 1 s, `steps(1)` | Parpadeo |
| Tres puntos | 1 s | Saltan 4 px y se vuelven amarillos, desfase 150 ms |
| Flor | 60 s lineal | Una vuelta; nodos laten a 1.5× cada 3.2 s |
| Ondas `.ring` | 3 s | Escala .8 → 2.1 y se desvanece; tres desfasadas 1 s |
| Pestañas | 380 ms | Indicador se desliza y cambia de ancho |
| FAQ | 300 ms | Barra izquierda `scaleY`, "+" rota 45° |
| Barras de progreso | 1100 ms | `scaleX` desde la izquierda con degradado de marca |
| Marquesina | 45 s lineal | Se pausa en hover; bordes con máscara degradada |
| Resplandor `.spot` | 300 ms | Halo amarillo de 320 px al 16 % que sigue el cursor |

**Reglas de movimiento**

- Anima solo `transform` y `opacity` (y `background-size` para el marcador).
- Máximo un loop visible por pantalla además de la flor (pulso, ondas o marquesina).
- Nada rebota exageradamente: sin `bounce`, sin giros de 360° en contenido.
- **`prefers-reduced-motion: reduce`** apaga loops y deja todo en su estado final (ya incluido en `pascalia-motion.css` y `pascalia.js`).

---

## 10. Accesibilidad (obligatorio)

- Contraste AA: texto normal ≥ 4.5:1, grande ≥ 3:1. Por eso: grafito sobre amarillo, `--gold-ink` para amarillo sobre blanco.
- Foco visible: contorno grafito de 3 px separado 2 px (amarillo sobre oscuro). Nunca `outline: none` sin reemplazo.
- Áreas táctiles ≥ 44 px (botones de 48, sm de 40 solo en escritorio).
- Enlace "Saltar al contenido" (`.skip`), `lang="es-CO"`, un solo H1, íconos decorativos con `aria-hidden="true"`, botones de solo ícono con `aria-label`.
- Formularios con `<label>` visible; errores con `aria-invalid` y un mensaje que diga cómo corregir.
- Funciona sin JavaScript (clase `no-js` muestra todo).
- Sin desbordamiento horizontal a 360 px.

---

## 11. Voz y tono

- **Español de Colombia, tuteo, cordial.** "Escríbele a Pascal", "Te ayudamos", nunca "usted" en piezas de marca (sí con supervisores o entidades cuando el contexto lo pide).
- **Frases cortas y verbos de acción.** "Empieza", "Revisa y firma", "Agenda una conversación".
- **Beneficio primero, función después.** "Tu cuenta, lista el último día" antes que "Generador automático de informes".
- **Honestidad:** no prometas lo que no está; no inventes cifras ni testimonios; Pascal nunca inventa actividades.
- **Sin tecnicismos** ("IA generativa", "LLM", "API") en piezas para clientes; di qué hace por la persona.
- **Botones** con verbo + objeto: "Ver informe", "Escríbenos por WhatsApp". Nunca "Haz clic aquí" ni "Enviar" a secas.
- **Errores** que ayudan: qué pasó + qué hacer. "No pudimos leer el PDF. Envíalo de nuevo."
- **Números** en formato colombiano: `$ 50.000`, `27 de octubre de 2026`, `3:30 p. m.`

---

## 12. Sub-marcas

Las soluciones conservan su propia identidad y PascalIA las **enmarca**, no las repinta:

| Sub-marca | Identidad | Cómo se firma |
|---|---|---|
| **CuentaFácil** | Logo del calendario con check sobre amarillo (`sub-marcas/cuentafacil/`). Asistente: Pascal. | "CuentaFácil de PascalIA" |
| **NANA DNT** | Azul `#0C2858` y dorado `#E1A823`, logo propio (`sub-marcas/nana-dnt/`). | "NANA DNT · una solución de PascalIA" |
| **Misión Médica** | Logo oficial del módulo (`sub-marcas/mision-medica/`), sin alterar. | "Desarrollado por PascalIA" |
| **MesaViva** | Usa el sistema PascalIA completo (es la referencia). | "MesaViva de PascalIA" |

En una página de sub-marca: el logo de la sub-marca va en el nav con `.logo-by` ("de **PascalIA**"); botones, tipografía, movimiento y pie siguen este sistema.

---

## 13. Lista de chequeo antes de publicar

- [ ] Carga `fuentes.css` → `pascalia-tokens.css` → `pascalia.css` → `pascalia-motion.css` y `pascalia.js`.
- [ ] Solo Montserrat e Inter; números con `tabular-nums`.
- [ ] Ningún texto blanco sobre amarillo; ninguna sección con fondo amarillo.
- [ ] Un solo marcador por titular; un solo H1.
- [ ] Contenedores con hairline + sombra suave.
- [ ] Íconos del set (trazo 1.85), sin emojis en la interfaz.
- [ ] Pascal solo con arte oficial.
- [ ] Botón primario único por bloque; verbo + objeto.
- [ ] Probado a 360 px y 1440 px, sin scroll horizontal.
- [ ] Foco visible al navegar con teclado; `prefers-reduced-motion` respetado.
- [ ] Favicon, `theme-color #FFC107`, título "Página · PascalIA", descripción y tarjeta social 1200 × 630.
- [ ] Textos en español de Colombia, tuteo, sin cifras ni testimonios inventados.
