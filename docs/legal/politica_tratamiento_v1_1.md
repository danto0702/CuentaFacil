# Política de Tratamiento de Datos Personales — CuentaFacil de PascalIA

> 📝 **BORRADOR versión 1.1 — pendiente de revisión del abogado.** No publicar hasta su aprobación. La versión vigente es la 1.0 ([`politica_tratamiento.md`](./politica_tratamiento.md)).
> Fecha: 2026-10-10. Al aprobarse: reemplazar la 1.0 aquí y en https://pascalia.lat/politica-de-datos/, registrar la versión en `policy_versions` y pedir nueva aceptación a quienes aceptaron la 1.0.

## Notas para el abogado (borrar al aprobar)

Cambios frente a la 1.0, todos por nuevas funciones del servicio:

1. **Firma manuscrita (imagen), opcional** — secciones 2, 3 y 4-A. Se pide autorización expresa y separada; solo se inserta en los documentos del propio titular.
2. **Datos obtenidos de fuentes públicas (SECOP II)** — sección 4-B. Cargamos la base pública de contratos de cada entidad (número, objeto, valor, plazo, fecha del acta de inicio, nombre y documento del contratista) para precargar la configuración. ¿Basta con informarlo así, considerando el art. 10 de la Ley 1581 sobre datos de naturaleza pública, o hace falta algo más?
3. **Cobro por servicio y códigos de pago en efectivo** — secciones 2, 3 y 6. Guardamos nombre y documento de quien paga en efectivo y el código usado. Los datos de tarjeta o cuenta los trata Wompi, no nosotros.
4. **Atención por una persona** — sección 4-C. El dueño revisa la conversación y los documentos cuando el titular lo pide o la generación automática falla.
5. **Capturas de pantalla para correcciones** — sección 2. Pueden contener datos de terceros (p. ej. el supervisor).
6. **Documentos contractuales** (contrato SECOP, clausulado, informes anteriores, certificaciones de cumplimiento) — sección 2.
7. **Ubicación de la base de datos: Canadá** — sección 4. La versión 1.0 publicada dice que los datos se almacenan en EE. UU.; la base de datos quedó en Canadá (Supabase, región `ca-central-1`). Los demás proveedores siguen en EE. UU. ¿Basta con actualizar la tabla y la autorización de transferencia, considerando que Canadá y EE. UU. figuran como países con nivel adecuado de protección según la SIC? Mientras no se apruebe esta versión, en la base de datos solo se cargan datos de prueba y del propio responsable.

> Marco normativo: Ley 1581 de 2012, Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen o complementen.

## 1. Responsable del tratamiento

- **Responsable:** Danilo Orlando Torrado Blanco, persona natural que opera la marca PascalIA
- **Documento:** C.C. 1.090.453.097
- **Domicilio:** Calle 11 # 13-55, barrio Santa Bárbara, Ábrego, Norte de Santander, Colombia
- **Correo para ejercer derechos:** contacto@pascalia.lat
- **WhatsApp de atención:** +57 312 388 5012 (escribiendo "soporte" o "borrar mis datos")

## 2. Datos que tratamos

| Categoría | Ejemplos |
|-----------|----------|
| Identificación y contacto | Nombre, tipo y número de documento, lugar de expedición, número de WhatsApp |
| Contractuales | Contrato publicado en SECOP II, clausulado, obligaciones, valores, plazo, fecha del acta de inicio, supervisor, periodos, informes anteriores y certificaciones de cumplimiento |
| Financieros | Banco, tipo y número de cuenta para el pago de honorarios, régimen tributario |
| Seguridad social | Planillas PILA, afiliaciones a EPS, ARL y fondo de pensiones |
| Certificados | Antecedentes de Policía, Medidas Correctivas, Procuraduría y Contraloría |
| Actividades | Notas de texto, notas de voz y sus transcripciones, fotografías y documentos de evidencia |
| Firma (opcional) | Imagen de la firma manuscrita del titular, solo si la entrega voluntariamente |
| Pagos | Servicio pagado, valor, fecha, medio de pago, referencia de la transacción; en pagos en efectivo, nombre y documento de quien paga y el código usado |
| Correcciones | Capturas de pantalla que el titular envía con los ajustes pedidos a sus documentos |
| Técnicos | Registros de mensajes, fechas de envío y estado de entrega |

Las fotografías de evidencia pueden contener imágenes de **terceros** (por ejemplo, asistentes a una capacitación). El titular se compromete a contar con la autorización de esas personas cuando la ley lo exija. Lo mismo aplica a las capturas de pantalla que contengan datos de terceros. No solicitamos datos sensibles distintos de los anteriores.

## 3. Finalidades

1. Configurar cada contrato del titular a partir de los documentos que él envía y de la información pública de contratación de la entidad (SECOP II).
2. Organizar las actividades, evidencias y soportes del titular para preparar sus cuentas de cobro.
3. Redactar borradores de informes con apoyo de inteligencia artificial, a partir **únicamente** de la información que el titular suministra, para su revisión y aprobación.
4. Extraer datos de planillas y certificados y validar su coherencia.
5. Generar y entregar por WhatsApp los documentos (informes, paquetes PDF, archivos comprimidos) e insertar en ellos la firma del titular, si la entregó.
6. Corregir y regenerar los documentos cuando el titular lo pida.
7. Enviar recordatorios relacionados con el servicio (el titular puede desactivarlos).
8. Cobrar los servicios (configuración de contratos e informes) y verificar los pagos, incluidos los pagos en efectivo con código.
9. Brindar atención personalizada por una persona cuando el titular lo pida o la generación automática no sea satisfactoria.
10. Cumplir obligaciones legales, contables y de seguridad.

**No** vendemos ni cedemos datos personales a terceros con fines comerciales. **No** compartimos información con la entidad contratante: el titular decide qué documentos entrega.

## 4. Encargados del tratamiento y transferencia internacional de datos

Para prestar el servicio, los datos se **almacenan y procesan fuera de Colombia, en Canadá y en los Estados Unidos de América**, a través de los siguientes proveedores, que actúan como **encargados del tratamiento** bajo contratos que les exigen medidas de seguridad y confidencialidad:

| Proveedor | Servicio | Ubicación del tratamiento | Datos |
|-----------|----------|---------------------------|-------|
| Supabase Inc. | Base de datos y almacenamiento de archivos | Canadá (región ca-central-1, Montreal) | Todos los datos del servicio |
| Railway Corp. | Servidores de procesamiento y panel administrativo | EE. UU. | Datos en tránsito durante el procesamiento |
| Meta Platforms, Inc. (WhatsApp Business) | Canal de mensajería | EE. UU. y otros países donde opera Meta | Mensajes, archivos y número de WhatsApp |
| Anthropic PBC | Inteligencia artificial (lectura de documentos y redacción) | EE. UU. | Solo el contenido necesario para cada tarea (notas, documentos, obligaciones) |
| OpenAI, L.L.C. | Transcripción de notas de voz | EE. UU. | Audio de las notas de voz |
| Wompi (Bancolombia S.A.) | Pagos en línea | Colombia | Datos de la transacción de pago (los datos de tarjeta o cuenta los trata Wompi directamente) |

Al aceptar esta política, el titular **autoriza de manera previa, expresa e informada la transmisión y transferencia internacional** de sus datos a estos proveedores y países para las finalidades descritas.

Los proveedores de inteligencia artificial reciben los datos **solo en la medida necesaria** para cada tarea y, según sus condiciones comerciales para API, no los usan para entrenar sus modelos.

## 4-A. Firma manuscrita

La entrega de la imagen de la firma es **opcional**; sin ella, los documentos se entregan sin firma. Si el titular la entrega, autoriza de manera expresa que se use **únicamente** para insertarla en sus propios informes de actividades y en el espacio del contratista del borrador del informe de supervisión. Nunca se inserta en documentos de terceros, nunca se usa la firma del supervisor ni de otras personas, y se guarda cifrada. El titular puede pedir en cualquier momento que se borre, escribiendo *borrar mi firma*.

## 4-B. Datos obtenidos de fuentes públicas

Para precargar la configuración de los contratos usamos información de contratación pública publicada en SECOP II por las entidades estatales (número y objeto del contrato, valor, plazo, fecha del acta de inicio, nombre y documento del contratista). Esta información solo se consulta para la persona que se registra en el servicio, se guarda cifrada y no se divulga ni se usa con otros fines.

## 4-C. Atención por una persona

Cuando el titular pide hablar con una persona, o cuando la generación automática no es satisfactoria, el responsable del tratamiento revisa la conversación, los documentos y los datos necesarios para resolver el caso. Solo accede a la información de ese titular y está obligado a mantener su confidencialidad.

## 5. Derechos del titular

El titular puede, en cualquier momento y de forma gratuita: conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización; ser informado sobre el uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; **revocar la autorización y solicitar la supresión** de sus datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a sus datos.

## 6. Procedimiento para consultas y reclamos

- **Consultas:** se atienden en máximo **10 días hábiles** (prorrogables 5 días hábiles informando el motivo).
- **Reclamos** (corrección, actualización, supresión, revocatoria): máximo **15 días hábiles** (prorrogables 8 días hábiles informando el motivo).
- Canales: WhatsApp (comandos "mis datos", "soporte", "borrar mis datos") y el correo indicado en la sección 1.
- Al pedir "borrar mis datos", el bot confirma la solicitud, la registra con fecha, y se eliminan o anonimizan los datos en el plazo anterior, conservando únicamente lo que la ley exija (p. ej. soportes contables de pagos).

## 7. Conservación

Los archivos (documentos, evidencias, audios) se conservan por **24 meses** desde su carga, salvo solicitud de supresión previa, y luego se eliminan automáticamente. Los registros de consentimiento y los soportes contables (incluidos los de pagos en efectivo) se conservan por el término legal aplicable. La imagen de la firma se conserva mientras el titular use el servicio o hasta que pida borrarla.

## 8. Seguridad

Almacenamiento cifrado; los datos financieros y de identificación se cifran adicionalmente a nivel de aplicación; acceso restringido por roles; enlaces de descarga temporales; registro de auditoría; verificación de firma en las comunicaciones con proveedores.

## 9. Responsabilidad sobre los documentos

CuentaFacil es una herramienta de apoyo. El titular revisa, aprueba y firma sus documentos bajo su propia responsabilidad. El servicio no tiene relación con la entidad contratante salvo acuerdo expreso.

## 10. Vigencia y cambios

Esta política rige desde su publicación. Los cambios sustanciales se informarán por WhatsApp y requerirán nueva aceptación cuando la ley lo exija. Cada aceptación queda registrada con la fecha y la versión aceptada.
