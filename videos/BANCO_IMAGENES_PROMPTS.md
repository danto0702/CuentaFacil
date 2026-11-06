# Banco de personajes e imágenes de apoyo · PascalIA

Para seguir hablando de vida laboral, vida personal, inteligencia artificial y negocios.
Cada personaje nuevo se genera en dos pasos: primero su **hoja de referencia** y después sus **poses**, adjuntando esa hoja para que no cambie la cara ni la ropa.

**Cómo entregarlas**
- Una imagen por pose, o una hoja con las poses bien separadas.
- Fondo blanco liso, cuerpo entero y sin texto. Yo las recorto.
- Nómbralas como indica cada prompt (por ejemplo, `gerente-mujer-1.png`) o envíalas en el orden de la lista.

## Bloque de estilo (pégalo al inicio de cada prompt de personaje)

```
Estilo: ilustración 3D tipo película animada (Pixar/Disney), materiales suaves, iluminación cálida de estudio, colores vivos, alto detalle, igual al estilo de la imagen de referencia de Pascal.
Formato: cuerpo entero de pies a cabeza, sin cortar, fondo blanco puro liso (#FFFFFF), sin sombra en el piso, sin escenario, sin texto, sin logos de otras marcas. Vertical, mínimo 1500 px de alto.
Personas latinoamericanas (colombianas), naturales y cercanas, ropa de oficina colombiana actual.
```

---

## A. Personajes nuevos

### A1. Marcela, la gerente de pyme ⭐ indispensable
La dueña o gerente que decide. Sirve para historias de escepticismo, decisiones y resultados.

**Paso 1: hoja de referencia** *(adjunta: ref-pascal-normal.png como referencia de estilo)*
```
[BLOQUE DE ESTILO]
Personaje nuevo: Marcela, mujer colombiana de unos 45 años, gerente y dueña de una empresa mediana. Piel trigueña, cabello castaño oscuro a la altura de los hombros con ondas suaves, gafas de montura delgada color carey, aretes pequeños. Lleva blazer azul petróleo, blusa blanca, pantalón de tela gris oscuro y zapatos bajos negros, reloj dorado. Personalidad: práctica, exigente, cálida cuando confía.
Hoja de referencia del personaje: vista de frente, de tres cuartos y de perfil, misma ropa, expresión neutra amable.
```
**Paso 2: poses** *(adjunta la hoja del paso 1)* → `gerente-mujer-1.png` a `-6`
```
[BLOQUE DE ESTILO]
Marcela, exactamente igual a la hoja de referencia adjunta. Seis poses bien separadas:
1. Brazos cruzados, ceja levantada, escéptica.
2. Mirando una factura o un papel largo, preocupada, una mano en la frente.
3. Sosteniendo una tablet, sorprendida y contenta, boca entreabierta.
4. Dando la mano hacia la derecha, como cerrando un acuerdo, sonriendo.
5. Señalando hacia arriba con el índice, segura, como presentando una idea.
6. Celebrando con el puño arriba, feliz.
```

### A2. Don Hernando, el líder tradicional ⭐ indispensable
Para el discurso de "la IA no es para mí" y el cambio de mentalidad (Reel 6 y futuros).

```
[BLOQUE DE ESTILO]
Personaje nuevo: Don Hernando, hombre colombiano de unos 58 años, dueño de una empresa familiar de toda la vida. Contextura gruesa, bigote canoso, cabello gris peinado hacia atrás, piel clara bronceada. Lleva camisa blanca de manga larga remangada, chaleco de lana café, pantalón caqui, cinturón de cuero y zapatos café. Reloj de pulso clásico. Personalidad: desconfiado con la tecnología, pero noble y trabajador.
Primero una hoja de referencia (frente, tres cuartos y perfil). Después, seis poses bien separadas:
1. Negando con la mano abierta, como diciendo "eso no es para mí".
2. Mirando un celular con los ojos entrecerrados, alejándolo de la cara.
3. Rascándose la cabeza, confundido.
4. Sentado leyendo un fajo de papeles y carpetas, agotado.
5. Sonriendo sorprendido mirando una pantalla de portátil.
6. Pulgar arriba, orgulloso y convencido.
```
→ `lider-tradicional-1.png` a `-6`

### A3. Valentina, la auxiliar administrativa ⭐ indispensable
La persona que hace el trabajo repetitivo. Sirve para tareas, Excel, documentos y capacitación.

```
[BLOQUE DE ESTILO]
Personaje nuevo: Valentina, mujer colombiana de unos 27 años, auxiliar administrativa. Piel morena, cabello negro y crespo recogido en una coleta alta, aretes de argolla pequeños. Lleva camisa de botones color mostaza suave, pantalón negro, tenis blancos y un carné colgado de un cordón gris. Personalidad: rápida, alegre, a veces abrumada.
Primero una hoja de referencia (frente, tres cuartos y perfil). Después, seis poses bien separadas:
1. Cargando una torre alta de papeles y carpetas que se tambalea.
2. Sentada frente a un portátil, cara de cansancio, con un café.
3. Con audífonos de diadema, contestando muchas solicitudes, estresada.
4. Levantando las manos de alegría frente al portátil.
5. Tomando notas en una libreta, atenta, como en una capacitación.
6. Relajada, estirando los brazos, con la tarea terminada.
```
→ `auxiliar-1.png` a `-6`

### A4. Andrés, el asesor comercial (recomendado)
Ventas, WhatsApp, cierre de negocios y el "pase a humano".

```
[BLOQUE DE ESTILO]
Personaje nuevo: Andrés, hombre colombiano de unos 32 años, asesor comercial. Piel trigueña, cabello negro corto con fade, barba corta bien arreglada. Lleva camisa polo azul oscuro, pantalón chino beige, tenis blancos y reloj inteligente. Personalidad: carismático y entusiasta.
Primero una hoja de referencia (frente, tres cuartos y perfil). Después, seis poses bien separadas:
1. Escribiendo en el celular con las dos manos, concentrado.
2. Hablando por celular, sonriendo, con la otra mano gesticulando.
3. Dando la mano hacia la derecha, cerrando una venta.
4. Mirando el celular de noche, cansado, con muchas notificaciones.
5. Celebrando con los dos puños, como si cerrara una gran venta.
6. Mostrando el celular hacia la cámara, invitando.
```
→ `asesor-1.png` a `-6`

### A5. Doña Rosa, la emprendedora (recomendada)
Para pequeños negocios de verdad: tienda, restaurante, panadería.

```
[BLOQUE DE ESTILO]
Personaje nuevo: Doña Rosa, mujer colombiana de unos 50 años, dueña de un restaurante pequeño de barrio. Piel morena clara, cabello negro con algunas canas recogido en una pañoleta roja, delantal amarillo sobre blusa blanca, jean y zapatos cómodos. Personalidad: trabajadora, alegre, hace de todo.
Primero una hoja de referencia (frente, tres cuartos y perfil). Después, cinco poses bien separadas:
1. Atendiendo el celular mientras sostiene una olla, agobiada.
2. Contando billetes y facturas sobre un mostrador.
3. Leyendo pedidos en el celular, feliz.
4. Con los brazos abiertos, dando la bienvenida.
5. Pulgar arriba con una gran sonrisa.
```
→ `emprendedora-1.png` a `-5`

### A6. Camila, la clienta (recomendado)
La persona del otro lado del chat: escribe tarde, espera la respuesta o recibe una buena atención.

```
[BLOQUE DE ESTILO]
Personaje nuevo: Camila, mujer colombiana de unos 24 años. Piel clara, cabello castaño claro largo y liso, suéter oversize lila, jean, tenis. Personalidad: moderna, impaciente, expresiva.
Primero una hoja de referencia (frente, tres cuartos y perfil). Después, cinco poses bien separadas:
1. Acostada boca abajo escribiendo en el celular, de noche, en pijama.
2. Mirando el celular, aburrida y molesta, esperando respuesta.
3. Sorprendida y feliz mirando el celular.
4. Caminando con bolsas de compras, contenta.
5. Comparando dos celulares, uno en cada mano, dudando.
```
→ `clienta-1.png` a `-5`

---

## B. Nuevas poses de personajes que ya tenemos

### B1. Pascal: más poses ⭐ indispensable
*(adjunta: ref-pascal-normal.png)*
```
[BLOQUE DE ESTILO]
Pascal, el mismo de la referencia (gorra amarilla con la flor de PascalIA, polo blanco con logo, cordón amarillo con carné, jean azul, tenis blancos con detalle amarillo). Mantén exactamente su cara. Ocho poses bien separadas:
1. Pensativo, mano en la barbilla, mirando hacia arriba.
2. De pie frente a un tablero blanco vacío, señalándolo con un marcador (sin texto en el tablero).
3. Sentado en un escritorio con un portátil, escribiendo, sonriendo.
4. Sosteniendo una tablet con un gráfico de barras que sube (sin texto).
5. Dictando una capacitación: brazos abiertos, como hablándole a un grupo.
6. Celebrando con un salto, puño arriba.
7. Con las manos en las caderas, seguro, mirando a cámara.
8. Haciendo silencio con el dedo en los labios y guiñando, como contando un secreto.
```
→ `pascal-pensando.png`, `pascal-tablero.png`, `pascal-portatil.png`, `pascal-tablet.png`, `pascal-capacita.png`, `pascal-salta.png`, `pascal-seguro.png`, `pascal-secreto.png`

### B2. El contratista: vida laboral y personal (recomendado)
*(adjunta: una imagen del contratista de camisa azul que ya tenemos)*
```
[BLOQUE DE ESTILO]
El mismo hombre de la imagen adjunta (camisa azul claro, carné con cordón, pantalón azul oscuro, zapatos café). Mantén exactamente su cara y su ropa. Seis poses bien separadas:
1. Trabajando de noche en el portátil, con la luz de la pantalla en la cara, bostezando.
2. Abrazando a una niña pequeña de unos 6 años, feliz (vida personal).
3. Mirando el reloj de pulso, angustiado por el tiempo.
4. Sentado en el comedor con un plato de comida, distraído mirando el celular.
5. Caminando relajado con una mochila, sonriendo, saliendo temprano del trabajo.
6. Levantando un trofeo pequeño dorado, orgulloso.
```
→ `contratista-noche.png`, `contratista-familia.png`, `contratista-reloj.png`, `contratista-comedor.png`, `contratista-sale.png`, `contratista-trofeo.png`

---

## C. El "bot rígido" ⭐ indispensable
El contraste visual entre los bots viejos y la IA conversacional (Reel 5 y siguientes).

```
[BLOQUE DE ESTILO]
Personaje nuevo: un robot antiguo y torpe con forma de caja gris metálica, antenas torcidas, pantalla en la cara con ojos pixelados aburridos, botones numéricos del 1 al 9 en el pecho como un teléfono viejo, brazos de resorte. Es simpático, no da miedo.
Cuatro poses bien separadas:
1. Con cara de error, echando humito por la cabeza.
2. Señalando sus botones del pecho, como diciendo "marque 1".
3. Dormido de pie, con una "Z" de humo (sin letras reales).
4. Confundido, con signos de interrogación hechos de engranajes.
```
→ `bot-rigido-1.png` a `-4`

---

## D. Objetos para animar (fondo blanco, sin texto)

### D1. Hoja de objetos de oficina ⭐ indispensable
```
Ilustración 3D tipo película animada, mismos colores cálidos, objetos separados sobre fondo blanco puro, sin sombra, sin texto, sin logos:
1. Torre alta de papeles y carpetas amarillas, a punto de caerse.
2. Portátil abierto con pantalla en blanco.
3. Celular moderno con pantalla en blanco.
4. Reloj de pared redondo amarillo.
5. Taza de café humeante con la flor de PascalIA.
6. Calendario de escritorio con días tachados en rojo (sin números legibles).
7. Alcancía de cerdito dorada.
8. Bombillo encendido brillante.
9. Cohete pequeño despegando.
10. Lupa grande.
```

### D2. La IA como asistente (opcional)
```
Ilustración 3D tipo película animada, fondo blanco puro, sin texto: una pequeña esfera de luz dorada flotante con la forma de la flor de PascalIA de seis pétalos en el centro, partículas brillantes alrededor, sensación de asistente amable y mágico. Tres versiones: quieta, girando con estela de luz, y saliendo de la pantalla de un celular.
```

---

## E. Escenarios de fondo (vertical 1080 × 1920, sin personajes, sin texto)

### E1. Oficina de pyme colombiana ⭐ indispensable
```
Ilustración 3D tipo película animada, sin personajes, sin texto. Oficina de una empresa mediana colombiana, de día, luz cálida por ventanales: escritorios de madera clara, sillas de oficina, plantas, archivadores con carpetas amarillas, un tablero blanco vacío y una ventana con vista a la ciudad y montañas verdes. Paleta cálida con acentos amarillos. Formato vertical 1080 × 1920, con espacio libre en el centro para poner a los personajes.
```

### E2. Sala de casa de noche (recomendado)
```
Ilustración 3D tipo película animada, sin personajes, sin texto. Sala de un apartamento colombiano de noche: sofá, lámpara de pie encendida, mesa de centro con un portátil abierto y una taza, ventana con luces de la ciudad. Ambiente tranquilo pero con sensación de "trabajando a deshoras". Vertical 1080 × 1920, espacio libre en el centro.
```

### E3. Sala de reuniones o capacitación (recomendado)
```
Ilustración 3D tipo película animada, sin personajes, sin texto. Sala de capacitación moderna: mesa larga, sillas, pantalla grande en la pared (en blanco), tablero con notas adhesivas amarillas sin texto, plantas. Luz cálida. Vertical 1080 × 1920.
```

### E4. Mostrador de negocio de barrio (opcional)
```
Ilustración 3D tipo película animada, sin personajes, sin texto. Mostrador de un restaurante pequeño colombiano: vitrina con empanadas y jugos, menú de tablero sin texto, matas, ladrillo a la vista y luz cálida. Vertical 1080 × 1920.
```

---

## Prioridad sugerida
1. **Primera tanda:** Marcela, Don Hernando, Valentina, Pascal (8 poses nuevas), el bot rígido y la hoja de objetos.
2. **Segunda tanda:** Andrés, Doña Rosa, Camila, el contratista (vida personal) y la oficina de fondo.
3. **Si hay tiempo:** la esfera de IA y los demás escenarios.
