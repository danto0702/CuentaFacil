# Serie «¿Y esa vaina como pa' qué?» · PascalIA

Videos explicativos de IA para personas y equipos de oficina. Cada capítulo lleva:
- intro con el título de la serie, «Capítulo N» y el tema (voz: «¿Y esa vaina como pa' qué? Capítulo N: …»);
- el sello «Cap. N · ¿Y esa vaina como pa' qué?» arriba a la izquierda en cada escena (menos la intro y el cierre);
- el número y el tema se cambian en `SERIE` dentro de `tools/build.py`.

| Cap. | Tema | Proyecto |
|---|---|---|
| 1 | Los usos de la IA en la oficina | `videos/ia-oficina/` |

## Voces
Desde el Cap. 2 las voces se generan con Fish Audio (`videos/herramientas/voces_fish.py`), clonando al instante la voz del dueño
a partir de clips ya publicados; luego `bash tools/procesar_voz.sh <carpeta>` y la verificación con Whisper.
