# Kit de marca PascalIA · v1.0

Todo lo necesario para que cualquier página, panel o herramienta de PascalIA tenga la misma identidad.

## Empieza aquí

1. Abre **`guia-visual.html`** en el navegador: muestra colores, tipografía, componentes, íconos y animaciones funcionando.
2. Lee **`GUIA_DE_MARCA.md`** (especificación completa) o, si vas a usar una IA para construir, pásale **`INSTRUCCIONES_PARA_IA.md`**.
3. Copia **`plantillas/plantilla-pagina.html`** (y las carpetas `css/`, `js/`, `fuentes/`, `logos/`, `graficos/`) para empezar una página nueva.

## Contenido

| Carpeta / archivo | Qué hay |
|---|---|
| `guia-visual.html` | Guía visual interactiva (abre sin servidor). |
| `GUIA_DE_MARCA.md` | Logo, color con contraste, tipografía, espacio, radios, sombras, íconos, Pascal, componentes, movimiento, accesibilidad, voz y tono, sub-marcas y lista de chequeo. |
| `INSTRUCCIONES_PARA_IA.md` | Reglas cortas para Claude, ChatGPT, Cursor, v0 y otras herramientas. |
| `css/fuentes.css` | @font-face locales de Montserrat (600/700/800) e Inter (400/500/600). |
| `css/pascalia-tokens.css` | Variables: color, sombras, tipografía, radios, espacio y movimiento. |
| `css/pascalia.css` | Base y componentes: botones, chips, barra de Pascal, pestañas, tarjetas, ventanas, resultado, listas, formularios, avisos, FAQ, nav, héroe, cierre, pie, tabla y diálogo. |
| `css/pascalia-motion.css` | Animaciones (destello, rise, reveal, palabra por palabra, marcador, flor, pulso, ondas, marquesina) y movimiento reducido. |
| `js/pascalia.js` | Comportamiento sin dependencias: reveal, marcador, nav, barra de lectura, menú móvil, pestañas, barra de Pascal, resplandor y volver arriba. |
| `tokens/tokens.json` | Los mismos tokens en JSON (para Figma Tokens, Tailwind o apps). |
| `fuentes/` | Archivos woff2 y licencias SIL OFL. |
| `logos/` | SVG (horizontal, vertical, palabra, blanco, una tinta, flor, flor sobre oscuro, flor contorno, favicon) y `png/` (logos, flor a 512/1024, favicon 32/192, apple-touch 180, tarjeta social 1200 × 630). |
| `iconos/` | `iconos.svg` (sprite de 67 íconos) y `svg/` (cada ícono suelto). |
| `graficos/` | Pascal (hoja de personaje, guiño, cuerpo entero, rostro, avatar) y QR de CuentaFácil. |
| `plantillas/` | `plantilla-pagina.html` (página base completa) y `tarjeta-social.html` (imagen para compartir). |
| `sub-marcas/` | Logos de CuentaFácil, NANA DNT y Misión Médica. |
| `docs/DESIGN-sitio-referencia.md` | Registro técnico del sistema del sitio pascalia.lat (en inglés). |

## Usar en un proyecto con Tailwind

```js
// tailwind.config.js
theme: { extend: {
  colors: { yellow: { DEFAULT: '#FFC107', hover: '#FFB300', soft: '#FFD54F', ink: '#8A6100' }, graphite: { DEFAULT: '#1F1F1F', deep: '#181818' }, muted: '#5C5C5C', line: '#E9E9E9', cream: { DEFAULT: '#FFF8E1', line: '#F3E7BE' } },
  fontFamily: { head: ['Montserrat', 'system-ui', 'sans-serif'], body: ['Inter', 'system-ui', 'sans-serif'] },
  borderRadius: { field: '12px', tile: '14px', item: '18px', window: '20px', panel: '24px' },
  boxShadow: { card: '0 8px 24px rgba(31,31,31,.08)', brand: '0 10px 30px -10px rgba(255,193,7,.55)', lift: '0 22px 48px -18px rgba(31,31,31,.28)', hairline: 'inset 0 0 0 1px #E9E9E9' },
  transitionTimingFunction: { brand: 'cubic-bezier(.22,1,.36,1)' },
} }
```

Las fuentes Montserrat e Inter tienen licencia SIL Open Font License 1.1. Logos, flor, íconos y Pascal son propiedad de PascalIA: uso interno y para proyectos de PascalIA.
