# Banco de personajes e imágenes · PascalIA

Recortes listos (WebP con fondo transparente) para los reels. Las hojas originales están en `originales/`, y los prompts que las generaron en `../BANCO_IMAGENES_PROMPTS.md`.

## Personajes (`personajes/`)
| Personaje | Quién es | Poses |
|---|---|---|
| **Marcela** | Gerente y dueña de pyme, 45 años | esceptica, factura, tablet, acuerdo, idea, celebra |
| **Don Hernando** | Líder tradicional, 58 años | niega, celular, confundido, papeles, portatil, pulgar |
| **Valentina** | Auxiliar administrativa, 27 años | papeles, cansada, audifonos, feliz, notas, relajada |
| **Andrés** | Asesor comercial, 32 años | escribe, llamada, acuerdo, notificaciones, celebra, muestra |
| **Doña Rosa** | Emprendedora de restaurante, 50 años | agobiada, cuenta, pedidos, bienvenida, pulgar |
| **Camila** | Clienta, 24 años | noche, molesta, feliz, compras, duda |
| **Julián** | Vida laboral y personal (ropa distinta en cada pose) | noche, familia, reloj, comedor, comedor-2, sale, trofeo |
| **Bot rígido** | El bot viejo de "marque 1" | error, marque, dormido, confundido |
| **Pascal** (nuevas, baja resolución: úsalas pequeñas) | Asistente de PascalIA | pensando, portatil, tablet, explica, seguro, secreto |

Las poses de Pascal en alta resolución siguen en cada proyecto (`assets/chars/pascal-*.webp`).

## Objetos (`objetos/`)
papeles, portatil-celular, reloj, taza (con la marca), calendario, alcancia, bombillo, cohete, lupa, y las esferas de IA (esfera-ia-1 a 4).

## Fondos (`fondos/`, 1080 × 1935)
oficina, tienda.

## Ojo al usarlos
- `marcela-tablet`, `valentina-*` (portátil): el portátil o la tablet muestran el logo de Apple. Úsalos pequeños o tapa el logo con una tarjeta.
- Para recortar una hoja nueva: añade sus cajas a `tools/cortes.txt` (`tools/cajas.py` las detecta) y corre `tools/cortar_todo.sh <python con rembg>`.
