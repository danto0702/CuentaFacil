# Instrucciones para herramientas de IA · Identidad PascalIA

Pega este archivo (o súbelo junto con la carpeta `css/`) en Claude, ChatGPT, Cursor, v0, Lovable u otra herramienta antes de pedirle una página o una herramienta de PascalIA. Son reglas, no sugerencias.

## Contexto

PascalIA es una empresa colombiana de consultoría, desarrollo y capacitación. Promesa: "Ideas que hacen florecer tu organización". Su asistente se llama Pascal. Todo lo que ve el usuario va en español de Colombia, con tuteo y tono cordial.

## Archivos que debes usar

```html
<html lang="es-CO" class="no-js">
<link rel="stylesheet" href="css/fuentes.css">          <!-- o Google Fonts: Montserrat 600;700;800 + Inter 400;500;600 -->
<link rel="stylesheet" href="css/pascalia-tokens.css">
<link rel="stylesheet" href="css/pascalia.css">
<link rel="stylesheet" href="css/pascalia-motion.css">
<script src="js/pascalia.js" defer></script>
<meta name="theme-color" content="#FFC107">
```

Parte de `plantillas/plantilla-pagina.html`. Reutiliza sus clases (`.btn .btn-primary`, `.card`, `.win`, `.faq`, `.nav`, `.foot`, `.reveal`, `.mark`…) en vez de inventar estilos nuevos. Si necesitas un estilo nuevo, usa solo variables de `pascalia-tokens.css`. No escribas valores de color, sombra, radio ni curva a mano.

## Tokens (si no puedes cargar los archivos)

```css
:root{--yellow:#FFC107;--yellow-hover:#FFB300;--yellow-soft:#FFD54F;--gold-ink:#8A6100;--graphite:#1F1F1F;--graphite-deep:#181818;--muted:#5C5C5C;--gray:#E9E9E9;--cream:#FFF8E1;--cream-line:#F3E7BE;--white:#FFF;
--brand-grad:linear-gradient(135deg,#FFD54F 0%,#FFC107 55%,#FFB300 100%);
--shadow-card:0 8px 24px rgba(31,31,31,.08);--shadow-brand:0 10px 30px -10px rgba(255,193,7,.55);--shadow-lift:0 22px 48px -18px rgba(31,31,31,.28);--hairline:inset 0 0 0 1px #E9E9E9;
--f-head:"Montserrat",system-ui,sans-serif;--f-body:"Inter",system-ui,sans-serif;--ease:cubic-bezier(.22,1,.36,1);
--r-field:12px;--r-item:18px;--r-window:20px;--r-panel:24px;--r-pill:999px;--wrap:1200px;--section:104px}
```

## Reglas obligatorias

1. **Color:** fondo blanco; crema `#FFF8E1` en secciones alternas; amarillo `#FFC107` solo para acciones (botones, marcador, puntos, foco); grafito `#1F1F1F` para el texto y para secciones de resultado o cierre. **Nunca texto blanco sobre amarillo. Nunca una sección con fondo amarillo.** Para amarillo legible sobre blanco usa `#8A6100`.
2. **Tipografía:** Montserrat (600/700/800) para titulares, botones, etiquetas y cifras; Inter (400/500/600) para texto. No uses otras fuentes. H1: 800, `clamp(2.5rem,6vw,4.75rem)`, interlineado 1.05, tracking −0.02em, máximo 13ch. Cifras con `tabular-nums`.
3. **Marcador:** una palabra clave por titular dentro de `<span class="mark">`: una banda amarilla que se dibuja debajo. Solo una por titular.
4. **Contenedores:** hairline (`inset 0 0 0 1px #E9E9E9`) más sombra suave. Radio 24 en tarjetas y paneles, 20 en ventanas, 18 en ítems, 12 en campos, píldora en botones y chips. Sin bordes negros ni sombras duras.
5. **Botones:** píldora, 48 px de alto, Montserrat 600. Primario amarillo con texto grafito, con destello que lo cruza cada 4 s; en hover sube 2 px y gana un resplandor amarillo; la flecha se corre 4 px. Un primario por bloque. Texto con verbo + objeto.
6. **Íconos:** solo de línea, 24 × 24, trazo 1.85, extremos redondeados, `currentColor` (usa `iconos/iconos.svg`). **Nunca emojis como íconos.**
7. **Movimiento:** curva única `cubic-bezier(.22,1,.36,1)`. Entradas con `.reveal` (600 ms, sube 24 px), el titular sube palabra por palabra (80 ms), el marcador se dibuja en 900 ms y la flor gira en 60 s al 13 %. Anima solo transform y opacity, y respeta `prefers-reduced-motion`.
8. **Logo:** usa `logos/logo-horizontal.svg` o el logo vivo `.logo` (flor + "Pascal<b>IA</b>"). No lo recolorees, no lo deformes, no lo pongas sobre amarillo. La flor tiene 6 pétalos amarillos al 82 % con venas y nodos blancos y no se modifica.
9. **Pascal:** solo con las imágenes de `graficos/pascal/`. No lo dibujes ni lo generes.
10. **Estructura:** nav sticky (72 → 60 px, con desenfoque y barra de lectura amarilla) → héroe crema con flor, píldora en vivo, H1, lead y dos botones → secciones blanco/crema → sección grafito de cifras o valores → FAQ → cierre grafito → pie `#181818` con la flor de marca de agua.
11. **Accesibilidad:** contraste AA, foco visible (contorno grafito de 3 px; amarillo sobre oscuro), áreas táctiles de 44 px o más, `lang="es-CO"`, un solo H1, sin scroll horizontal a 360 px.
12. **Texto:** español de Colombia, tuteo, frases cortas, beneficio primero. No inventes cifras, clientes ni testimonios: si faltan datos, deja `[corchetes]`. Dinero en formato `$ 1.250.000`.

## Antes de entregar, verifica

- [ ] Sin colores, fuentes ni curvas fuera de los tokens.
- [ ] Sin texto blanco sobre amarillo ni fondos amarillos de sección.
- [ ] Un marcador por titular; un primario por bloque.
- [ ] Íconos de línea, sin emojis en la interfaz.
- [ ] Probado en móvil (360 px) y escritorio.
