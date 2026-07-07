# PBM Control

PWA mobile-first interna para Paradigm Bio Metal. Usa React + TypeScript + Vite y se conecta al Google Sheet `PBM Control - Base Normalizada V1` mediante Google Apps Script.

## Correr local

```bash
npm install
npm run dev
```

Si no existe `VITE_API_URL`, la app usa mock temporal basado en filas reales del Sheet para probar la UI.

## Configurar Apps Script

1. Abre el Google Sheet `PBM Control - Base Normalizada V1`.
2. Ve a `Extensiones > Apps Script`.
3. Crea cuatro archivos: `Code.gs`, `routes.gs`, `sheets.gs`, `drive.gs`.
4. Copia el contenido de la carpeta `apps-script/` en esos archivos.
5. Verifica que `SPREADSHEET_ID` sea:

```txt
19e1jMJQJUd46aXYiG7mbHDpH4T1fObDkI5tjMbHdL9c
```

6. Deploy: `Implementar > Nueva implementacion > Aplicacion web`.
7. Ejecutar como: tu usuario.
8. Acceso: quien corresponda para uso interno.
9. Copia la URL terminada en `/exec`.

## Conectar VITE_API_URL

Crear `.env` en la raiz del proyecto:

```bash
VITE_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Reinicia el servidor local despues de cambiar `.env`.

## Build

```bash
npm run build
```

## Deploy en Netlify

1. Sube este proyecto a un repositorio Git.
2. En Netlify, crea un nuevo sitio desde ese repositorio.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Agrega la variable de entorno `VITE_API_URL` con la URL del Apps Script.
6. Deploy.

## Modo mantenimiento administrativo

El acceso completo a la app puede pausarse temporalmente desde las variables de entorno publicas de Netlify:

- Activar: define `VITE_APP_LOCKED=true` y ejecuta un nuevo deploy.
- Desactivar: define `VITE_APP_LOCKED=false` o elimina la variable y ejecuta un nuevo deploy.

Este modo solo reemplaza la interfaz por la pantalla de pausa. No elimina ni modifica datos de Google Sheet, Apps Script, Drive, Firebase, `sessionStorage`, IndexedDB, la cola offline o las fotos temporales.

## Operaciones V1

- Leer todas las tablas desde el Sheet.
- Ver dashboard, clientes, maquinas, servicios y stock.
- Registrar movimientos de producto.
- Registrar movimientos de bodega.
- Marcar servicio como realizado creando registro en `Historial Servicios` y limpiando el servicio activo para reutilizarlo.

## Historial de Movimientos V1.3

La pantalla `/historial` muestra una linea de tiempo unificada para revisar la operacion completa sin cambiar el Google Sheet.

Combina estas tablas ya existentes:

- `Movimientos Producto`
- `Movimientos Bodega`

La app normaliza ambos origenes para mostrar en un mismo listado:

- Fecha.
- Entrada o salida.
- Origen: `Producto` o `Bodega`.
- Producto o articulo.
- Cantidad con unidad.
- Responsable.
- Motivo.
- Cliente, maquina y servicio cuando aplican.
- ID del movimiento original.

No agrega columnas nuevas y no captura datos extra. Cada detalle de movimiento es solo consulta en V1.3.

Filtros disponibles:

- Origen: todos, producto o bodega.
- Tipo de movimiento: todos, entrada o salida.
- Mes: todos, mes actual, mes anterior o mes personalizado.
- Fecha especifica.
- Producto.
- Articulo de bodega.
- Responsable.
- Busqueda general por producto, articulo, cliente, maquina, motivo, responsable o ID.
- Orden: mas reciente primero o mas antiguo primero.

La navegacion inferior ahora incluye `Historial`:

```txt
Inicio | Clientes | Servicios | Stock | Historial
```

El modulo `Mas` sigue disponible desde el Dashboard y tambien conserva accesos extendidos como maquinas, stock bodega, movimientos y sincronizacion.

Para probar fecha, mes y producto:

1. Corre `npm run dev`.
2. Abre `/historial`.
3. En `Mes`, selecciona `Mes actual`.
4. En `Fecha especifica`, elige una fecha con movimientos, por ejemplo `2026-06-08`.
5. Limpia la fecha y selecciona un producto, por ejemplo `Bio Metal 3000`.
6. Cambia origen entre `Producto` y `Bodega` para confirmar que filtra cada tabla.
7. Usa busqueda general con valores como `MP-002`, `Anibal`, `Estopas` o `INTER MG`.

Para probar el detalle:

1. Abre `/historial`.
2. Toca cualquier tarjeta de movimiento.
3. Debe abrir `/historial/producto/<ID>` o `/historial/bodega/<ID>`.
4. Revisa ficha de auditoria, relacion operativa y relacion con stock.
5. Confirma que no permite editar.

## V1.2 visual premium

La version V1.2 es una mejora visual y de experiencia. No cambia estructura del Google Sheet, Apps Script, `VITE_API_URL`, mock temporal, columnas, relaciones ni calculos de stock o servicios.

Mejoras incluidas:

- Fondo industrial premium con grid fino, profundidad, luces azules y textura tecnica sutil.
- Header con logo integrado, glassmorphism, glow azul e indicador visual de sincronizacion.
- Dashboard con hero corporativo, metricas ejecutivas, alertas, proximo servicio y accesos rapidos premium.
- Tarjetas con bordes metalicos, acento por estado/prioridad, profundidad, shimmer, press/touch y entrada suave.
- Maquinas con fotos reales, overlay oscuro, ficha tecnica visual y fallback industrial.
- Stock Productos con barras liquidas por familia: Bio Metal 3000 azul liquido, Ultragreen BA15 verde tecnico y Ultrared BA15 rojo industrial.
- Stock Bodega con ultimas fechas de entrada/salida destacadas, tarjetas compactas y detalle con linea de tiempo.
- Servicios con tabs premium, calendario mensual visual, contadores por dia y panel de dia seleccionado con transicion.
- Formularios con campos tecnicos, CTA naranja premium y confirmaciones de exito/error mas claras.
- Empty states y loading states con icono, logo, shimmer y estilo de consola industrial.
- Navegacion inferior con glassmorphism, glow de pestana activa e indicador tipo luz.

Animaciones:

- Transicion suave entre pantallas.
- Entrada de tarjetas y metricas.
- Shimmer en carga.
- Press/touch en botones, tabs, tarjetas y nav.
- Fade/zoom suave en imagenes de equipos.
- Barra liquida animada en stock de productos.
- Glow respirando sutil en el hero.

La app respeta `prefers-reduced-motion` para reducir animaciones cuando el dispositivo o usuario lo solicite.

No se agregaron dependencias nuevas. No se instalo Framer Motion; las animaciones estan hechas con CSS para mantener buen rendimiento movil.

Para probar responsive:

1. Corre `npm run dev`.
2. Abre la app en DevTools con vista movil.
3. Prueba anchos `360`, `375`, `390`, `412` y `430` px.
4. Revisa `/`, `/maquinas`, `/servicios`, `/stock-productos`, `/stock-bodega`, `/movimiento-producto` y `/movimiento-bodega`.
5. Confirma que no haya scroll horizontal, textos encimados ni tarjetas rotas.

Para revisar rendimiento movil:

1. En Chrome DevTools abre `Performance`.
2. Usa perfil movil o CPU throttling ligero.
3. Navega entre pantallas y abre el calendario.
4. Confirma que las animaciones sean suaves y que no haya jank notable.
5. En `Rendering`, activa `Emulate CSS prefers-reduced-motion: reduce` y confirma que las animaciones se reduzcan.

## Fechas de ingreso y salida en Stock Bodega

`Stock Bodega` conserva su estructura original:

```txt
ID Articulo, Articulo, Categoria, Unidad, Stock Minimo, Ubicacion, Activo, Stock Actual
```

La app no captura `Fecha Ultima Entrada` ni `Fecha Ultima Salida` manualmente.

Esas fechas se calculan desde `Movimientos Bodega`:

- `Fecha Ultima Entrada`: ultima `Fecha` donde `Tipo Movimiento = Entrada` para el mismo `ID Articulo`.
- `Fecha Ultima Salida`: ultima `Fecha` donde `Tipo Movimiento = Salida` para el mismo `ID Articulo`.

El historial completo vive en `Movimientos Bodega`, cuya estructura sigue siendo:

```txt
ID Movimiento, Fecha, Tipo Movimiento, ID Articulo, Cantidad, Responsable, Motivo
```

Al registrar un nuevo movimiento de bodega, la fecha capturada alimenta automaticamente el calculo de ultima entrada o ultima salida. No se requieren columnas nuevas en el Sheet para que la app funcione.

Para probar:

1. Abre `/stock-bodega`.
2. Revisa en cada tarjeta `Ultima entrada` y `Ultima salida`.
3. Abre un articulo, por ejemplo `/stock-bodega/ART-001`.
4. Revisa el historial reciente de movimientos.
5. Registra una entrada o salida en `/movimiento-bodega`.
6. Vuelve a `Stock Bodega` o al detalle del articulo y confirma que la fecha se actualizo.

## Imagenes reales

Las imagenes originales agregadas al proyecto estan en estas carpetas externas del usuario:

- `logo`
- `equipos`

Para que Vite y Netlify las sirvan correctamente, se copiaron a:

- `public/logo/`
- `public/equipos/`

Logo activo de la app:

- `public/logo_app.png`

Archivos detectados en `equipos`:

- `PBT-40.jpg`
- `PBT-80.jpg`
- `PL-100.jpg`
- `PL-200.jpg`
- `PGD-200.jpg`

Archivos finales usados por Vite:

- `/logo_app.png`
- `/equipos/PBT-40.jpg`
- `/equipos/PBT-80.jpg`
- `/equipos/PL-100.jpg`
- `/equipos/PL-200.jpg`
- `/equipos/PGD-200.jpg`

Relacion modelo-imagen:

- `PBT-40` -> `/equipos/PBT-40.jpg`
- `PBT-80` -> `/equipos/PBT-80.jpg`
- `PL-100` -> `/equipos/PL-100.jpg`
- `PL-200` -> `/equipos/PL-200.jpg`
- `PGD-200` -> `/equipos/PGD-200.jpg`

La app resuelve imagenes de maquina en este orden:

1. Si `Foto Maquina` trae URL publica valida, usa esa URL.
2. Si no, busca imagen por `Modelo`.
3. Si no hay match, muestra un fallback visual industrial.

Para cambiar una imagen de equipo, reemplaza el archivo en `public/equipos/` manteniendo el mismo nombre. Si cambias el nombre, actualiza el mapa en `src/lib/assets.ts`.

Para probar que cargan:

1. Corre `npm run dev`.
2. Abre `/`.
3. Confirma que el logo aparece en header, login, loading y dashboard. Si falla la imagen, la app muestra fallback premium `PBM Control`.
4. Abre `/maquinas`.
5. Confirma que cada tarjeta muestra foto real segun modelo.
6. Abre `/maquinas/PGD-160-001` u otra maquina y revisa la imagen grande.

## Calendario de servicios

La pantalla `/servicios` tiene tabs:

- `Lista`
- `Calendario`

El calendario muestra vista mensual, contador de servicios por dia y solo dos estados dentro del calendario:

- `Pendiente`: servicio activo en hoja `Servicios` con `Fecha Programada`, aunque la fecha ya haya pasado.
- `Realizado`: registro de hoja `Historial Servicios`.
- `Sin programar`: servicio activo sin `Fecha Programada`; no entra al calendario.

Debajo del mes se muestra `Litros usados: X L`, calculado con `Litros Usados` de `Historial Servicios` del mes visible. Los registros con producto `Indefinido / No aplica` o sin litros no suman al total y aparecen en `Servicios sin litraje`.

Para probar:

1. Abre `/servicios`.
2. Toca `Calendario`.
3. Usa los botones de mes anterior/siguiente.
4. Toca un dia con contador para ver sus servicios.
5. Si el Sheet no tiene `Fecha Programada`, debe aparecer el mensaje de calendario sin fechas.

## Logos de clientes

La app busca logos de clientes en este orden:

1. Valor de `Logo Cliente` si es URL publica valida o ruta publica como `/clientes/logo.png`.
2. Nombre de archivo en `Logo Cliente`, servido desde `public/clientes/`.
3. Mapa por nombre de empresa en `src/lib/assets.ts`.
4. Fallback premium con iniciales si no existe logo o si la imagen falla.

En esta version no se detectaron archivos reales de logos de clientes dentro del proyecto; `public/clientes/` queda preparado para recibirlos. Si agregas `logo_intermg.png`, por ejemplo, puedes escribir `logo_intermg.png` en la columna `Logo Cliente` o agregar el mapeo en `CUSTOMER_LOGO_BY_KEY`.

Los logos se muestran en Clientes, Detalle Cliente, Dashboard, Servicios, Calendario e Historial cuando el movimiento tiene cliente asociado.

## Responsables autorizados

Las opciones para nuevos registros quedan limitadas a:

- `Anibal`
- `Ruth`
- `William`
- `Francisco`
- `Karen`

Esto aplica a Movimiento Producto, Movimiento Bodega y cierre de servicios. Registros historicos con otros responsables pueden seguir mostrandose como dato antiguo en historial, pero no aparecen como opcion para nuevas capturas.

## Servicios activos e Historial Servicios

La hoja `Servicios` funciona como lista activa o plantilla operativa. No se crean filas nuevas automaticamente al cerrar un servicio.

Estados usados:

- `Pendiente`: servicio activo con `Fecha Programada`, incluso si la fecha ya paso.
- `Sin programar`: servicio activo sin `Fecha Programada`.
- `Realizado`: registro ya cerrado en hoja `Historial Servicios`.

Al marcar un servicio como realizado:

1. La app valida `Fecha Programada`, `Observaciones Servicio`, `Producto usado`, `Responsable` y `Litros usados` salvo cuando el producto usado es `Indefinido / No aplica`.
2. Apps Script crea un registro en `Historial Servicios`.
3. La fila activa en `Servicios` conserva el mismo `ID Servicio`, cliente, maquina y datos base.
4. La fila activa se limpia: `Fecha Programada`, `Observaciones Servicio`, `Fecha Realizado`, `Litros Usados` y `Producto Usado` quedan vacios para programarse otra vez.

Para reprogramar un pendiente, solo cambia `Fecha Programada`; no se crea historial ni servicio nuevo.

## Ingreso de Material Capstone

Para el caso especial de Capstone Copper/Cooper, agrega una sola fila base en `Servicios` si todavia no existe:

- `ID Servicio`: el siguiente ID disponible, por ejemplo `SER-CAPSTONE-MATERIAL` o el consecutivo que uses.
- `Fecha Programada`: vacia hasta programar.
- `ID Cliente`: el ID real de Capstone en `Clientes`.
- `Cliente`: `CAPSTONE COPPER` o `CAPSTONE COOPER`, exactamente como venga en el Sheet.
- `ID Maquina`: vacio o `N/A`.
- `Modelo`: `Ingreso de Material`.
- `Tipo Servicio`: `Ingreso de Material`.
- `ID Producto`: el producto base si aplica, por ejemplo `PD-001`.
- `Producto`: `Bio Metal 3000`, `Ultragreen BA15`, `Ultrared BA15` u `Otro`.
- `Litros Estimados`: vacio si es indefinido.
- `Litros Usados`: vacio.
- `Producto Usado`: vacio hasta cierre.
- `Responsable`: uno de los responsables autorizados.
- `Observaciones Servicio`: vacio.
- `Fecha Realizado`: vacio.
- `Eliminado`: `NO`.

Al cerrarlo, puede usarse `Indefinido / No aplica` y no exige litros.

## Usuarios, roles y permisos

PBM Control Almacen usa login interno basico en frontend. La sesion vive en `sessionStorage` y no usa Firebase/Auth todavia.

Usuarios incluidos:

- Anibal: rol `admin`
- Ruth: rol `admin`
- Karen: rol `admin`
- William: rol `operativo`
- Francisco: rol `operativo`

Las credenciales no se documentan en este README. Solicita tus accesos al administrador.

Permisos `admin`:

- Ver dashboard completo, stock, litros, cantidades e inventario.
- Registrar Movimiento Producto y Movimiento Bodega.
- Ver historial completo.
- Programar, reprogramar y cerrar servicios.
- Eliminar servicios o movimientos capturados por error.
- Ver clientes, maquinas, calendario y sincronizacion.

Permisos `operativo`:

- Ver dashboard sin inventario sensible.
- Ver clientes, maquinas, servicios, calendario y detalle de servicio.
- Agregar observaciones, capturar litros reales, seleccionar producto usado y marcar servicio como realizado.
- Eliminar servicios activos o realizados capturados por error.
- Ver historial de servicios realizados.
- No ver stock, movimientos de almacen/producto ni inventario sensible fuera del flujo de servicio.

La contraseña global anterior de inventario ya no se usa como acceso general. Los apartados de almacen dependen del rol del usuario.

## Responsables actualizados

Las opciones para nuevos registros son:

- `Anibal`
- `Ruth`
- `William`
- `Francisco`
- `Karen`

`Omar` y `Pavel` pueden seguir apareciendo en registros historicos si ya existian, pero no aparecen como opcion nueva.

## Borrado logico de errores

Para no perder trazabilidad, la app usa borrado logico con la columna `Eliminado`.

Agrega estas columnas al final del Google Sheet:

- Hoja `Servicios`: `Tipo Servicio`, `Litros Usados`, `Producto Usado`, `Eliminado`
- Hoja nueva `Historial Servicios`: `ID Historial Servicio`, `ID Servicio`, `Fecha Programada`, `Fecha Realizado`, `ID Cliente`, `Cliente`, `ID Maquina`, `Modelo`, `Tipo Servicio`, `ID Producto`, `Producto Usado`, `Litros Usados`, `Responsable`, `Observaciones Servicio`, `Eliminado`
- Hoja `Movimientos Producto`: `Eliminado`
- Hoja `Movimientos Bodega`: `Eliminado`

Valor por defecto recomendado: `NO`.

Servicios activos y registros de `Historial Servicios` pueden eliminarse por cualquier usuario autenticado. Movimientos Producto y Movimientos Bodega solo pueden eliminarse por usuarios admin porque los operativos no acceden a esos modulos.

Cuando se elimina un registro, Apps Script marca `Eliminado = SI`. La app deja de mostrarlo en Servicios, Calendario, Historial y contadores.

Si `Stock Actual` se calcula con formulas del Sheet, ajusta esas formulas para ignorar movimientos con `Eliminado = SI`. La app ya ignora esos movimientos para historial y fechas derivadas.

## Reprogramar pendientes

Un servicio `Pendiente` puede reprogramarse actualizando la misma fila:

- cambia `Fecha Programada`
- conserva el mismo `ID Servicio`
- se mueve en calendario de la fecha anterior a la nueva fecha
- no crea duplicados

Los servicios realizados se guardan en `Historial Servicios`. La fila activa queda lista para volver a programarse.

## Recordatorios

Dashboard y Servicios muestran recordatorios internos para:

- servicios programados hoy
- servicios programados manana

Tambien hay boton para activar notificaciones locales del navegador. Si el permiso esta concedido, la app programa avisos locales para servicios pendientes en estos horarios:

- Un dia antes a las `16:00`.
- Un dia antes a las `20:00`.
- El mismo dia a las `07:00`.

La app no programa avisos que ya pasaron. Si un servicio se reprograma, cancela los avisos locales anteriores y crea los nuevos. Si se marca realizado o se elimina, cancela los avisos de ese servicio.

Estas notificaciones funcionan cuando el navegador/PWA lo permite y la app esta abierta o activa. No son push garantizado con la app cerrada; para eso se requiere backend/Firebase/Push API en V2.

## Ajustes operativos V1.6

- `Historial` ya no muestra un acumulado total grande de movimientos. Admin ve `Movimientos del mes`, calculado con movimientos visibles del mes actual e ignorando eliminados. Operativo ve `Inventario restringido / Solo admin`.
- El header movil queda compacto: logo, texto corto de pantalla, usuario activo y boton de cerrar sesion. Los iconos decorativos se ocultan en anchos chicos para evitar encimados.
- En detalle de servicio, si ya existe un realizado para ese servicio o maquina, la siguiente programacion solo se permite desde el primer dia del mes siguiente al ultimo realizado.
- En calendario, los servicios realizados tienen prioridad visual verde cuando un dia contiene historial realizado.

## Apps Script V1.5

Se modificaron:

- `apps-script/Code.gs`
- `apps-script/routes.gs`
- `apps-script/sheets.gs`

Acciones soportadas:

- `updateServicio`
- `createServicio`
- `markServicioRealizado`
- `markHistorialServicioDeleted`
- `markMovimientoProductoDeleted`
- `markMovimientoBodegaDeleted`

`markServicioRealizado` crea un registro en `Historial Servicios` y limpia la fila activa de `Servicios`. `updateServicio` tambien puede marcar servicio activo como eliminado usando `eliminado: "SI"`.

La app usa JSONP para leer y ejecutar acciones contra Apps Script desde el navegador cuando la URL es `script.google.com`. Esto evita bloqueos por CORS/redireccion del Web App sin cambiar `VITE_API_URL` ni el modelo de datos. El POST simple queda como respaldo para otros entornos.

Para publicar:

1. Copia `Code.gs`, `routes.gs` y `sheets.gs` a Apps Script.
2. Agrega la hoja y columnas indicadas arriba.
3. Crea una nueva version/implementacion de Apps Script.
4. La URL `/exec` no necesita cambiar si actualizas la misma implementacion; si creas una implementacion nueva, actualiza `VITE_API_URL`.

## Prueba rapida V1.5

1. Ejecuta `npm run build`.
2. Ejecuta `npm run preview`.
3. Abre `http://localhost:4173`.
4. Inicia sesion con cada usuario.
5. Confirma que admin ve Stock y movimientos.
6. Confirma que operativo no ve Stock ni movimientos y ve inventario como `Protegido`.
7. Abre `/servicios`: la lista muestra servicios activos `Pendiente` y `Sin programar`.
8. Abre el tab Calendario: pendientes se ven amarillos y realizados de `Historial Servicios` verdes.
9. Cambia `Fecha Programada` de un pendiente y confirma que se mueve de dia sin duplicar.
10. En detalle de servicio captura observaciones, litros usados, producto usado y responsable; marca realizado con datos de prueba.
11. Confirma que aparece en `Historial Servicios` y que el servicio activo queda sin fecha para programarse otra vez.
12. Revisa `/historial`: debe mostrar servicios realizados y, para admin, movimientos producto/bodega.
13. Revisa que el calendario muestre `Litros usados: X L` del mes visible.
14. Revisa recordatorios en Dashboard y Servicios.
15. Confirma que Sync muestra `Google Sheet` y usuario activo.

## Pendiente para V2

- Captura de fotos.
- PDFs, firmas y reportes.
- Push real con Firebase/Push API para avisos garantizados aunque la app este cerrada.

## V2 Offline basico

PBM Control Almacen incluye una cola local con IndexedDB para acciones operativas de servicios cuando el navegador esta sin conexion.

Acciones soportadas offline:

- Actualizar `Fecha Programada`.
- Guardar `Observaciones Servicio`.
- Guardar `Litros Usados`.
- Guardar `Producto Usado`.
- Marcar servicio como realizado.
- Eliminar servicio activo erroneo.
- Eliminar registro realizado erroneo.

La cola guarda:

- timestamp
- usuario activo
- tipo de accion
- payload necesario para sincronizar
- estado: `pendiente`, `sincronizando`, `error` o `sincronizado`
- intentos

No guarda contrasenas.

Cuando no hay conexion, la app muestra:

```txt
Acción guardada sin conexión. Se sincronizará cuando vuelva internet.
```

El estado de sincronizacion se ve en:

- Dashboard.
- Pantalla `/sync`.

La tarjeta muestra Online/Offline, pendientes por sincronizar, errores y ultima sincronizacion. Tambien incluye el boton `Sincronizar ahora`.

Cuando vuelve internet, la app intenta sincronizar automaticamente. Si una accion falla, queda en la cola con estado `error`. En `/sync` puedes reintentar con `Sincronizar ahora` o descartar una accion pendiente.

Conflictos:

- Antes de sincronizar, la app lee Google Sheet.
- Si el servicio o registro realizado ya no existe, queda en error.
- Si el servicio o registro cambio en Google Sheet antes de sincronizar, queda en error para evitar sobrescribir datos.

Para probar offline:

1. Ejecuta `npm run build`.
2. Ejecuta `npm run preview`.
3. Abre `http://localhost:4173`.
4. Inicia sesion.
5. En DevTools activa modo offline.
6. Abre un detalle de servicio.
7. Guarda observaciones o cambia Fecha Programada.
8. Debe aparecer el mensaje de accion guardada sin conexion.
9. Abre Dashboard o `/sync` y confirma `Pendientes por sincronizar: 1`.
10. Desactiva modo offline.
11. Toca `Sincronizar ahora` o espera el intento automatico.
12. Confirma que el pendiente desaparece y que Google Sheet refleja el cambio.

## V2.2 Evidencias fotograficas

La app permite capturar fotos desde Detalle Servicio antes de marcar un servicio como realizado.

Tipos de foto:

- `Foto antes`
- `Foto despues`
- `Foto evidencia`

Cada foto puede tomarse desde camara o seleccionarse desde galeria usando:

```html
accept="image/*"
capture="environment"
```

Antes de guardarse, la app comprime la imagen en el navegador:

- ancho maximo aproximado: `1600 px`
- formato: `JPEG`
- calidad aproximada: `0.78`

Carpeta raiz de Google Drive:

```txt
PBM Control - Evidencias Servicios
DRIVE_EVIDENCE_FOLDER_ID = 1vS692cqzmcWAvy83LCLGU47fNTBgF2z_
```

El ID queda guardado como constante en:

```txt
apps-script/drive.gs
```

Apps Script crea subcarpetas por cliente y servicio:

```txt
PBM Control - Evidencias Servicios / CLIENTE / ID_SERVICIO_FECHA
```

Nombres de archivo:

- `antes_ID_SERVICIO_FECHA.jpg`
- `despues_ID_SERVICIO_FECHA.jpg`
- `evidencia_ID_SERVICIO_FECHA.jpg`

Columnas usadas en `Historial Servicios`:

- `Fotos Servicio`
- `Foto Antes`
- `Foto Después`
- `Foto Evidencia`
- `Carpeta Drive`
- `PDF Servicio`

Flujo al cerrar servicio con evidencia:

1. La app valida fecha, observaciones, producto usado, responsable y litros cuando aplica.
2. `Litros usados` solo acepta números enteros positivos. Valores como `99.98`, `10,5`, negativos o letras muestran `Ingresa litros en números enteros.`.
3. Si hay fotos, la app intenta cerrar el servicio en línea con `POST text/plain` a Apps Script.
4. Apps Script crea carpeta en Drive y sube las fotos primero.
5. Solo si todas las fotos suben correctamente, Apps Script crea el registro en `Historial Servicios`.
6. Apps Script guarda URLs de foto/carpeta en el registro histórico y limpia el servicio activo para volver a programarlo.
7. Si la subida de fotos falla, no se crea historial parcial ni se limpia el servicio activo. La acción queda en cola con el error real.
8. Si un reintento llega después de que Apps Script ya creó el mismo histórico, `routes.gs` detecta el duplicado y no crea otro registro.

Guardar avance:

- `Guardar avance` actualiza los datos de cierre del servicio y guarda las fotos seleccionadas temporalmente en IndexedDB por `ID Servicio`.
- Si sales y vuelves al detalle del mismo servicio, las fotos temporales vuelven a aparecer en el capturador.
- Esas fotos temporales se usan al marcar el servicio como realizado.
- Después de un cierre exitoso o una sincronización exitosa, la app elimina esas fotos temporales del dispositivo.
- Las fotos temporales no se suben a Drive hasta cerrar el servicio.

Permisos de Drive:

- Apps Script intenta configurar las fotos como `cualquiera con enlace puede ver`.
- Si Google Drive no permite ese permiso, el error se registra con `Logger.log`, pero el cierre del servicio continúa.
- En ese caso las fotos quedan privadas, se guardan de todos modos `Foto Antes`, `Foto Después`, `Foto Evidencia` y `Carpeta Drive`, y el historial se crea correctamente.
- Si una miniatura no carga por permisos, la app muestra `Foto guardada en Drive. Puede requerir permiso para verla.` y mantiene el enlace para abrir la evidencia.

Offline con fotos:

- Si no hay conexión, el cierre de servicio con fotos se guarda en IndexedDB dentro de la cola offline.
- Las fotos se guardan comprimidas como data URL dentro del payload pendiente.
- Si hay conexión, la app intenta cerrar directamente contra Apps Script. Solo manda a cola si el POST o Apps Script fallan.
- Al volver internet, la cola intenta ejecutar `markServicioRealizado`; esa acción sube fotos, crea historial y limpia el servicio activo.
- Si falla, la acción queda en estado `error` y puede reintentarse desde `/sync`.
- `/sync` muestra acción, servicio, fecha/hora, intento, detalle de error y botones `Reintentar` / `Descartar`.
- Los errores con fotos se etiquetan como `Error al subir evidencia fotografica`.

Errores esperados de Apps Script:

- `DRIVE_FOLDER_NOT_FOUND`: la carpeta raíz de evidencias no existe o el ID es incorrecto.
- `DRIVE_PERMISSION_DENIED`: Apps Script no tiene permiso para abrir/crear carpetas o archivos.
- `INVALID_PHOTO_PAYLOAD`: la foto no llegó como data URL base64 válida.
- `HISTORIAL_NOT_CREATED`: falta el historial requerido para asociar fotos en una acción independiente.
- `PHOTO_UPLOAD_FAILED`: Drive falló al subir la evidencia.
- `MISSING_ACTION`: el cuerpo de la petición no trae `action`.
- `CORS_OR_POST_FAILED`: el navegador bloqueó o falló el POST directo a Apps Script.

Limitacion real:

- Para fotos grandes no se usa JSONP porque la URL puede exceder limites.
- La app intenta `POST` directo a Apps Script con `text/plain`.
- Si el navegador bloquea ese POST por CORS/redireccion de Apps Script, la accion queda protegida en la cola, pero puede requerirse una Netlify Function como proxy en V2.2.1 para subir fotos de forma 100% confiable desde produccion.

Para probar fotos:

1. Copia `Code.gs`, `routes.gs`, `sheets.gs` y `drive.gs` a Apps Script.
2. Crea una nueva version/implementacion de Apps Script.
3. Mantén la misma URL `/exec` si actualizas la implementacion actual; si creas otra implementacion, actualiza `VITE_API_URL`.
4. Ejecuta `npm run build`.
5. Ejecuta `npm run preview`.
6. Abre un detalle de servicio.
7. Captura `Foto antes`, `Foto despues` o `Foto evidencia`.
8. Confirma la previsualizacion.
9. Completa observaciones, litros, producto usado y responsable.
10. Marca el servicio como realizado.
11. Abre `Historial Servicios` y revisa la galeria.
12. Revisa Drive y el Sheet para confirmar URLs.
13. Prueba `Guardar avance`: selecciona fotos, guarda avance, sal del detalle y regresa. Deben seguir visibles.
14. Prueba litros: intenta `99.98`, `10,5`, `-1` y letras. La app debe rechazarlo con `Ingresa litros en números enteros.`.
15. Si falla Drive o permisos, revisa `/sync`: debe aparecer la acción pendiente/en error con detalle y botones para reintentar o descartar.

## V2.6 Alertas inteligentes

La version V2.6 agrega un motor de alertas en frontend basado en los datos actuales del Google Sheet. No cambia columnas existentes ni recalcula stock; solo interpreta los datos normalizados para mostrar prioridades operativas.

Archivos principales:

- `src/lib/alerts.ts`
- `src/hooks/useSmartAlerts.ts`
- `src/components/SmartAlertsPanel.tsx`
- `src/pages/Alertas.tsx`

Ruta nueva:

- `/alertas`

El Dashboard ahora muestra una seccion `Centro de mando` con maximo 5 alertas principales. La pantalla `/alertas` muestra resumen, busqueda, filtros por nivel, filtros por categoria y agrupacion por tipo.

Alertas implementadas:

- Stock bajo: productos y articulos con stock actual menor o igual al minimo.
- Producto critico: productos o articulos en 0.
- Cliente sin servicio programado: clientes activos sin servicio activo con `Fecha Programada`.
- Maquina sin atencion este mes: maquinas activas sin registro realizado en `Historial Servicios` durante el mes actual.
- Servicios sin fotos: realizados sin `Foto Antes`, `Foto Después` ni `Foto Evidencia`.
- Servicios sin PDF: informativa para seguimiento documental futuro.
- Servicios realizados sin litros: excepto `Producto Usado = Indefinido / No aplica`.
- Proximos servicios por responsable: hoy, mañana y proximos 7 dias.

Niveles:

- `critica`
- `advertencia`
- `informativa`
- `operativa`

Permisos:

- Admin ve alertas de inventario con cantidades, stock actual y minimo.
- Operativo no ve cantidades sensibles. Si existe inventario en riesgo, ve una alerta generica `Inventario restringido`.
- Operativo si ve alertas operativas de servicios, maquinas, clientes, fotos, litros y responsables.

## V2.7 Base Firebase Push real

La base V2.7 deja preparado Firebase Cloud Messaging de forma opcional. Si no hay variables Firebase, la app sigue funcionando con alertas internas, recordatorios locales, offline queue, fotos y Google Sheet.

Archivos principales:

- `src/lib/firebase.ts`
- `src/lib/pushNotifications.ts`
- `src/hooks/usePushNotifications.ts`
- `src/components/PushPermissionCard.tsx`
- `public/firebase-messaging-sw.js`

Variables requeridas en Netlify o `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Si alguna falta:

- Firebase no se inicializa.
- La app muestra `Push real no configurado`.
- El build no falla.
- La app mantiene recordatorios locales y alertas internas.

Para obtener `VITE_FIREBASE_VAPID_KEY`:

1. Entra a Firebase Console.
2. Abre Project settings.
3. Abre Cloud Messaging.
4. Genera o copia la Web Push certificate key pair.
5. Usa la public key como `VITE_FIREBASE_VAPID_KEY`.

Hoja nueva sugerida:

`Push Tokens`

Columnas:

- `ID Token`
- `Usuario`
- `Rol`
- `Token`
- `Dispositivo`
- `Navegador`
- `Activo`
- `Fecha Registro`
- `Ultima Actualizacion`

Apps Script:

- `sheets.gs` agrega `Push Tokens` como hoja opcional.
- `routes.gs` agrega `savePushToken` y `disablePushToken`.
- La URL `/exec` no cambia si actualizas la misma implementacion.

Service worker:

- `public/firebase-messaging-sw.js` se registra con scope propio `/firebase-cloud-messaging-push-scope`.
- No reemplaza el service worker PWA generado por `vite-plugin-pwa`.
- Si llega un push con `actionUrl`, al tocar la notificacion intenta abrir esa ruta; si no, abre `/servicios`.

Limitaciones reales de push automatico:

- Esta version registra token FCM por usuario y dispositivo.
- Desde V2.7.2 el envio automatico queda preparado con Netlify Scheduled Functions.
- Si el backend programado no esta configurado, la app sigue funcionando con alertas internas y push manual desde Firebase Console.
- No pongas credenciales privadas ni server keys en variables `VITE_`.

Para probar V2.6:

1. Ejecuta `npm run build`.
2. Ejecuta `npm run preview`.
3. Entra con un usuario admin.
4. Revisa Dashboard: debe aparecer `Centro de mando`.
5. Abre `/alertas`.
6. Filtra por nivel y categoria.
7. Confirma que admin ve alertas de stock con cantidades.
8. Cierra sesion y entra como William o Francisco.
9. Confirma que operativo no ve cantidades de stock.
10. Confirma que siguen visibles alertas de servicios, fotos, litros, maquinas y responsables.

Para probar V2.7 con Firebase:

1. Configura todas las variables `VITE_FIREBASE_*`.
2. Crea la hoja `Push Tokens` con las columnas anteriores.
3. Copia `sheets.gs` y `routes.gs` a Apps Script.
4. Crea nueva version/implementacion.
5. Ejecuta `npm run build`.
6. Abre la app en HTTPS o localhost.
7. Entra a `/mas` o `/alertas`.
8. Pulsa `Activar notificaciones push`.
9. Acepta permiso del navegador.
10. Confirma que se genera token y se guarda en `Push Tokens`.

Para probar sin Firebase:

1. Deja vacias las variables `VITE_FIREBASE_*`.
2. Ejecuta `npm run build`.
3. Entra a `/mas` o `/alertas`.
4. Debe mostrarse `Push real no configurado`.
5. La app debe seguir cargando datos, alertas internas y recordatorios locales.

## V2.7.1 UX compacta de alertas y push

La version V2.7.1 compacta el Dashboard para que funcione como vista ejecutiva y no como pantalla de configuracion.

Cambios visuales:

- El Dashboard ya no muestra la tarjeta grande `Servicios hoy y mañana`.
- El Dashboard ya no muestra el boton grande `Activar notificaciones locales`.
- Firebase Push queda como sistema principal visible.
- En Dashboard, Push aparece como una barra chica con estado y boton `Activar`.
- Si el dispositivo ya se registro desde este navegador, muestra `Dispositivo registrado`.
- El token completo no se muestra en Dashboard.
- En `/mas`, el bloque `Notificaciones` muestra estado, boton compacto y ultima actualizacion local si existe.
- `/alertas` conserva la experiencia completa con filtros, busqueda, agrupacion y todas las alertas.

Recordatorios locales:

- La logica local puede seguir existiendo como fallback interno.
- La UI principal prioriza Firebase Push.
- El envio automatico garantizado sigue dependiendo del backend programado descrito en V2.7.

Dashboard compacto:

- `Centro de mando` muestra contadores de criticas, avisos, hoy y total.
- Solo muestra hasta 2 alertas principales.
- Si hay mas alertas, muestra `+ X alertas mas`.
- El boton `Ver todas las alertas` lleva a `/alertas`.

## V2.7.2 Backend programado de push automatico

La version V2.7.2 agrega backend programado con Netlify Scheduled Functions para enviar notificaciones push reales por Firebase Cloud Messaging. La app sigue siendo compatible con Netlify, Google Sheet y Apps Script; no se agregan credenciales privadas al frontend.

Arquitectura elegida:

- Netlify Scheduled Function ejecuta cada hora.
- La funcion revisa la hora local de `America/Mexico_City`.
- Solo envia en ventanas operativas: 07:00, 16:00 y 20:00.
- Firebase Cloud Messaging se usa desde backend con cuenta de servicio.
- Apps Script sigue siendo la capa de lectura/escritura hacia Google Sheet.
- La hoja `Push Logs` evita duplicados y deja bitacora de envios.

Archivos agregados o modificados:

- `netlify/functions/push-scheduler.js`
- `netlify/functions/push-test.js`
- `netlify.toml`
- `apps-script/sheets.gs`
- `apps-script/routes.gs`
- `src/components/PushBackendStatusCard.tsx`
- `src/lib/api.ts`
- `src/lib/sheetSchema.ts`
- `src/types/pbm.ts`
- `src/pages/Mas.tsx`

Variables privadas requeridas en Netlify:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
APPS_SCRIPT_URL=
PUSH_SCHEDULER_TEST_SECRET=
```

Notas de seguridad:

- `FIREBASE_PRIVATE_KEY` y `FIREBASE_CLIENT_EMAIL` son secretos de backend.
- Nunca los pongas en `src/`, `public/`, `.env` del frontend ni variables `VITE_`.
- `VITE_FIREBASE_*` sigue siendo solo configuracion publica del cliente web.
- `PUSH_SCHEDULER_TEST_SECRET` protege la funcion de prueba manual.
- En Netlify, si pegas `FIREBASE_PRIVATE_KEY` en una sola linea, conserva los `\n`; la funcion los convierte a saltos reales.

Hoja nueva requerida:

`Push Logs`

Columnas exactas:

- `ID Push Log`
- `Fecha Hora`
- `Tipo`
- `Usuario`
- `Rol`
- `Token`
- `ID Servicio`
- `Cliente`
- `Titulo`
- `Mensaje`
- `Action URL`
- `Estado`
- `Error`
- `Clave Unica`

La columna `Token` guarda solo una vista corta del token, no el token completo. La columna `Clave Unica` se usa para evitar reenvios duplicados.

Envios automaticos:

- Dia anterior 16:00: recordatorio de servicio de manana.
- Dia anterior 20:00: recordatorio final de preparacion.
- Mismo dia 07:00: servicio programado hoy.
- Stock critico: solo admins.
- Agenda de proximos 7 dias: agrupada por responsable.

Destino de notificaciones:

- Si el servicio tiene `Responsable`, se envia a los tokens activos de ese usuario.
- Si no tiene responsable, se envia a admins: Anibal, Ruth y Karen.
- Alertas de stock critico solo se envian a admins.
- Tokens inactivos reportados por FCM se marcan como `Activo = NO`.

Pruebas manuales seguras:

La funcion programada real es `push-scheduler`. Para pruebas controladas usa:

```txt
/.netlify/functions/push-test?mode=testToday0700&user=William&secret=TU_SECRETO
```

Por defecto, las pruebas manuales son `dryRun=true` y no envian push real. Para enviar una prueba real a un usuario especifico:

```txt
/.netlify/functions/push-test?mode=testToday0700&user=William&dryRun=false&secret=TU_SECRETO
```

Modos de prueba:

- `testToday0700`
- `testTomorrow1600`
- `testTomorrow2000`
- `testStockCritical`
- `testUpcoming`

Tambien puedes usar `slot=D0-0700`, `slot=D-1-1600`, `slot=D-1-2000`, `slot=STOCK-CRITICAL-DAY` o `slot=UPCOMING-7D-DAY`.

Diagnostico admin:

En `/mas`, los usuarios admin ven una tarjeta `Backend push` con:

- estado de Netlify configurado o pendiente,
- estado de `Push Logs`,
- tokens activos,
- ultimo envio,
- errores recientes,
- sin mostrar tokens completos.

Para que la tarjeta marque Netlify como configurado, puedes definir esta variable publica opcional:

```env
VITE_PUSH_BACKEND_CONFIGURED=true
```

Esta variable no es secreta; solo sirve como indicador visual. El envio real depende de las variables privadas de Netlify.

Apps Script:

- Copia `apps-script/sheets.gs`.
- Copia `apps-script/routes.gs`.
- Crea la hoja `Push Logs` con las columnas exactas.
- Crea nueva version de implementacion de Apps Script.
- La URL `/exec` no cambia si actualizas la misma implementacion.

Prueba paso a paso:

1. Crea o verifica `Push Tokens`.
2. Crea `Push Logs`.
3. Copia `sheets.gs` y `routes.gs` a Apps Script.
4. Publica nueva version de implementacion.
5. Configura variables privadas en Netlify.
6. Opcional: define `VITE_PUSH_BACKEND_CONFIGURED=true`.
7. Haz deploy en Netlify.
8. Entra como admin a `/mas` y revisa `Backend push`.
9. Abre la prueba dry run con `push-test` y `mode=testToday0700`.
10. Confirma que devuelve una lista de jobs y no envia.
11. Ejecuta una prueba real con `dryRun=false` y `user=TU_USUARIO`.
12. Confirma que llega la notificacion.
13. Confirma que `Push Logs` registra el envio.
14. Ejecuta la misma prueba otra vez y confirma que no duplica si la `Clave Unica` ya quedo enviada.

Pendientes fuera de esta version:

- Envio avanzado desde Firebase Cloud Functions si se quiere mover todo a Firebase.
- Consola administrativa mas amplia para reintentar o limpiar logs.
- Segmentacion por multiples responsables por servicio.

## V2.8 Frontend Premium Responsive

La version V2.8 rediseña el frontend sin cambiar contratos de API, Google Sheet, Apps Script, Firebase Push, offline queue, roles, stock, historial ni servicios.

Objetivo visual:

- PWA empresarial premium.
- Estetica industrial oscura con navy, azul liquido y glassmorphism.
- Mobile-first como app nativa.
- Desktop con sidebar, topbar y grids amplios.
- Animaciones sobrias y compatibles con `prefers-reduced-motion`.

Cambios principales:

- AppShell responsive nuevo con `DesktopSidebar` en escritorio y `BottomNav` solo en movil.
- Topbar premium con estado visual, acceso de notificaciones y espacio para busqueda global futura.
- Splash screen premium con logo, engrane, halo azul y fade out.
- Dashboard reorganizado como centro de mando ejecutivo con hero, metricas animadas, alertas compactas, sync y push.
- Clientes redisenado con hero, buscador premium, metricas y grid responsive.
- Maquinas redisenado con hero, buscador y fichas visuales en grid desktop.
- Servicios y Calendario redisenados con hero, tabs premium y layout de dos columnas en desktop.
- Stock Productos y Stock Bodega redisenados con encabezados ejecutivos y grids visuales.
- Alertas redisenadas con filtros sticky, resumen y grid ejecutivo.
- Mas/configuracion redisenado con perfil, push, backend push y accesos administrativos.

Componentes agregados:

- `src/components/CountUp.tsx`
- `src/components/PremiumSplash.tsx`
- `src/components/DesktopSidebar.tsx`

Componentes modificados:

- `src/components/Layout.tsx`
- `src/components/BottomNav.tsx`
- `src/components/StatCard.tsx`
- `src/styles/globals.css`

Paginas modificadas:

- `src/pages/Dashboard.tsx`
- `src/pages/Clientes.tsx`
- `src/pages/Maquinas.tsx`
- `src/pages/Servicios.tsx`
- `src/pages/StockProductos.tsx`
- `src/pages/StockBodega.tsx`
- `src/pages/Alertas.tsx`
- `src/pages/Mas.tsx`

Animaciones:

- Splash de entrada/salida.
- Engrane con rotacion suave.
- Halo/linea azul de carga.
- Entrada de tarjetas.
- Count-up en metricas.
- Hover desktop con elevacion ligera.
- Press/tap en tarjetas y botones.
- Barras de stock con movimiento suave.
- Shimmer en skeletons existentes.

Librerias:

- No se agregaron dependencias nuevas.
- Se mantuvo `lucide-react`.
- Las animaciones se implementaron con CSS y React ligero.

Verificacion V2.8:

- `npm run build` pasa.
- `npm run preview` corre.
- Responsive probado en 360, 375, 390, 412, 430 y desktop 1440.
- Sin scroll horizontal detectado.
- Sidebar visible en desktop y oculta en movil.
- Bottom nav visible en movil y oculta en desktop.
- Sin errores graves de consola en las pruebas automatizadas.

Pendientes sugeridos:

- V2.8.1 pulido fino de animaciones por pagina.
- V2.8.2 reportes premium con graficas reales.
- V2.8.3 onboarding de instalacion PWA.
- V2.8.4 refinamiento visual final con pruebas en dispositivos fisicos.

## Modulo admin: Ingreso Factura Producto

`Ingreso Factura Producto` es un modulo aislado para usuarios admin. Sirve para registrar facturas/comprobantes PDF por cliente y calcular un saldo informativo de litros. No modifica `Stock Productos`, `Movimientos Producto`, `Movimientos Bodega`, servicios activos, historial operativo, alertas, push, Drive de evidencias ni offline queue.

Ruta:

- `/ingreso-factura-producto`

Permisos:

- Solo usuarios con rol `admin`.
- Los usuarios `operativo` no ven el acceso en Sidebar ni en Mas modulos.
- Si un operativo entra por URL directa, recibe la pantalla de acceso restringido.

Hoja nueva requerida en Google Sheet:

`Ingreso Factura Producto`

Columnas exactas:

1. `ID Ingreso Factura`
2. `Fecha Registro`
3. `ID Cliente`
4. `Cliente`
5. `Litros Entrada`
6. `Litros Salida Manual`
7. `Litros Servicios Realizados`
8. `Saldo Informativo`
9. `Factura PDF`
10. `Comprobante Pago PDF`
11. `Carpeta Drive`
12. `Responsable`
13. `Observaciones`
14. `Eliminado`

Validaciones:

- `Litros Entrada` es obligatorio y debe ser entero positivo.
- `Litros Salida Manual` es opcional; si se captura, debe ser entero positivo.
- No se aceptan decimales, negativos, cero como movimiento real, letras ni valores vacios cuando el campo es obligatorio.
- `Factura PDF` es obligatoria.
- `Comprobante Pago PDF` es opcional y queda especialmente disponible para Capstone.
- Solo se permiten archivos PDF.

Calculo aislado:

```text
Saldo Informativo =
Total Litros Entrada del cliente
- Total Litros Salida Manual del cliente
- Litros Servicios Realizados del cliente
```

`Litros Servicios Realizados` se calcula desde `Historial Servicios`, sumando `Litros Usados` del cliente e ignorando registros con `Eliminado = SI`. Este calculo solo vive en el modulo de facturas y no descuenta stock operativo.

Drive:

Apps Script crea o reutiliza la carpeta raiz:

`PBM Control - Ingreso Factura Producto`

Estructura:

```text
PBM Control - Ingreso Factura Producto/
  CLIENTE/
    Facturas/
    Evidencia/
```

Nombres de archivo:

- `factura_CLIENTE_FECHA_ID.pdf`
- `comprobante_CLIENTE_FECHA_ID.pdf`

Para Capstone Copper / Capstone Cooper, los comprobantes de pago se guardan en `Evidencia`.

Apps Script:

- Copia `apps-script/sheets.gs`.
- Copia `apps-script/routes.gs`.
- Copia `apps-script/drive.gs`.
- Crea la hoja `Ingreso Factura Producto` con las columnas exactas.
- Crea nueva version/implementacion de Apps Script.
- La URL `/exec` no cambia si actualizas la misma implementacion.

Acciones agregadas:

- `createIngresoFacturaProducto`
- `markIngresoFacturaProductoDeleted`

Prueba rapida:

1. Copia los archivos Apps Script indicados.
2. Publica nueva version de implementacion.
3. Entra como admin.
4. Abre `/ingreso-factura-producto` desde Sidebar o Mas modulos.
5. Selecciona cliente.
6. Captura litros enteros.
7. Sube factura PDF.
8. Si aplica, sube comprobante PDF.
9. Guarda registro.
10. Confirma que Drive creo las carpetas y que el Sheet guardo URLs.
11. Entra como operativo y confirma que el modulo no aparece ni permite acceso directo.
