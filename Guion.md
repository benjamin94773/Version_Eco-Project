# Guion Completo de Presentación, Demo en Vivo y Tour de Código — Entrega Final

**Archivo de diapositivas:** `Presentacion_Entrega2_Version_Eco.pptx` (9 diapositivas 16:9)  
**Fecha de sustentación:** Viernes 27 de noviembre de 2026  
**Duración estimada total:** 12 a 15 minutos (Exposición + Demo en vivo + Socialización)

---

## 1. Reparto de Roles y Turnos

| Integrante | Diapositivas | Rol en la Exposición |
| :--- | :--- | :--- |
| **Benjamin Ortiz** | **Slides 1, 2 y 3** | Apertura, arquitectura del sistema (*Version-Eco*) y actualización del Plan de Pruebas con la Estrategia de Automatización. |
| **Samuel Rueda** | **Slides 4 y 5** | Evaluación comparativa de herramientas del mercado y justificación técnica / socialización de por qué **Playwright + `pg`**. |
| **Harold Guerrero** | **Slide 6 + Demo en Vivo + Código** | Criterios ISTQB de selección (29 de 31 casos), muestra del código en VS Code y ejecución en vivo de la suite en Chrome. |
| **Daniela Orobio** | **Slides 7, 8 y 9** | Reporte real de resultados (27/29 = 93.10%), análisis de los hallazgos nuevos (**DEF-02**, **DEF-03**), desafíos y conclusiones. |

---

## 2. Guion Textual: Qué Debe Decir Cada Uno en Cada Diapositiva

### Diapositiva 1 — Portada *(Benjamin Ortiz — 30 seg)*
> *"Buenos días a todos y a la profesora. Hoy presentamos la segunda entrega y cierre del proyecto de pruebas sobre **Version-Eco**, nuestro sistema web de gestión de inventario y producción para cosmética vegana. En la primera entrega diseñamos 31 casos con técnicas formales de caja negra; en esta entrega implementamos la automatización real extremo a extremo usando Playwright conectado directamente a PostgreSQL."*

### Diapositiva 2 — Arquitectura del Software Bajo Prueba *(Benjamin Ortiz — 1 min)*
> *"Para contextualizar las decisiones técnicas de automatización, nuestro software tiene tres capas:*
> *1. **Frontend SPA** en React 18 con Vite en el puerto 5173, que además usa validaciones nativas de HTML5 y diálogos nativos del navegador como `window.alert`.*
> *2. **Backend REST API** en Node.js y Express en el puerto 4000, respondiendo códigos HTTP semánticos.*
> *3. **Base de datos PostgreSQL 18**, donde viven procedimientos almacenados críticos en PL/pgSQL como `fn_registrar_produccion`, encargados de la atomicidad del consumo.*
> *Las 4 funcionalidades complejas que seguimos evaluando son: F1 Materias Primas, F2 Fórmulas, F3 Producción y F4 Traslados entre sedes."*

### Diapositiva 3 — Actualización del Plan Maestro de Pruebas *(Benjamin Ortiz — 1.5 min)*
> *"En esta entrega actualizamos la sección 7.4 de nuestro Plan Maestro de Pruebas para incorporar la **Estrategia de Automatización Funcional** basada en patrones de diseño formales:*
> *- **Patrón Page Object Model (POM):** encapsulamos cada pantalla de React en su propia clase dentro de `tests-e2e/pages/`, separando los selectores de la interfaz de la lógica de aserción.*
> *- **Validación multicapa real y Data-Driven (AAA):** cada prueba opera sobre Chrome real, intercepta la petición HTTP y consulta PostgreSQL directamente para confirmar los saldos al decimal.*
> *- **Test Data Sandboxing (`resetBaseline`):** antes de cada test limpiamos e inyectamos en ~20 milisegundos las precondiciones exactas de las 9 corridas de Taguchi $L_9$.*
> *- **Ejecución secuencial (`workers: 1`) y sincronización reactiva sin `sleep()`:** garantizando cero colisiones y capturas automáticas cuando ocurre algún fallo."*

---

### Diapositiva 4 — Evaluación Comparativa de Herramientas *(Samuel Rueda — 1.5 min)*
> *"Para elegir la herramienta evaluamos 5 opciones representativas del mercado bajo 6 criterios ponderados acorde al stack de Version-Eco: compatibilidad con JavaScript/React (20%), soporte a validaciones HTML5 y alertas nativas (20%), capacidad de integrar UI + API + Base de Datos en un solo flujo (20%), reportería nativa (15%), estabilidad con auto-wait (15%) y licenciamiento Open Source (10%).*
> *Como ven en la tabla y el gráfico de barras, **Playwright** obtuvo 10.0 sobre 10, seguido por Cypress con 8.50, Selenium con 7.15, Katalon Studio con 6.75 y Postman con 4.95."*

### Diapositiva 5 — Justificación y Socialización de Playwright + `pg` *(Samuel Rueda — 1.5 min)*
> *"Queremos compartir con los compañeros por qué elegimos Playwright y no otras herramientas muy populares en clase:*
> *- Frente a **Postman/Newman**: Postman es excelente para API REST, pero no abre un navegador real; no habría podido detectar si los formularios de React bloquean cantidades decimales como `Q=2.5` ni comprobar si el Dashboard renderiza las tarjetas de alerta roja.*
> *- Frente a **Selenium WebDriver**: Selenium exige gestionar drivers y escribir esperas explícitas propensas a fallos intermitentes, mientras Playwright maneja auto-waiting nativo y trae reportero HTML integrado.*
> *- Frente a **Cypress**: Cypress presenta limitaciones conocidas con diálogos nativos bloqueantes como `window.alert()`, que nuestro módulo de Fórmulas sí utiliza al guardar, y consume más memoria en Windows.*
> *- Frente a **Katalon**: Katalon utiliza Groovy fuera de nuestro stack JavaScript y restringe reportes avanzados a licencia comercial.*
> *Además, al estar en Node.js ESM igual que el proyecto, conectamos el driver oficial `pg` directamente dentro de la carpeta `tests-e2e/` y con `webServer` Playwright levanta Backend y Frontend automáticamente."*

---

### Diapositiva 6 — Selección de Casos Automatizados *(Harold Guerrero — 1 min)*
> *"Siguiendo el principio ISTQB de que no se automatiza el 100% sin criterio, aplicamos una matriz de selección por Riesgo y Retorno de Inversión sobre los 31 casos de la Entrega 1:*
> *- **Seleccionamos 29 casos (93.55%)**, cubriendo el 100% de los casos de prioridad **Crítica y Alta**: los 12 de Producción (donde preparar manualmente los stocks del Arreglo Ortogonal $L_9$ tomaba muchísimo tiempo), los 7 de Traslados, los 4 de Fórmulas y 6 de Materias Primas (incluyendo la prueba de regresión del defecto DEF-01).*
> *- **Dejamos 2 casos manuales de prioridad Media:** `F1-CP-07` porque evalúa apariencia visual del semáforo en cero y `F1-CP-08` porque exige confirmación humana destructiva con historial de consumo.*
> *Ahora vamos a ver rápidamente cómo implementamos esto en código y ejecutarlo en vivo."*

---

## 3. Guía Exacta para el que Ejecuta la Demo y el Tour de Código *(Harold Guerrero — 3 a 4 min)*

### Preparación previa (antes de subir a exponer)
1. Abrir **VS Code** en la carpeta del proyecto con estas **5 pestañas abiertas** en orden:
   - Pestaña 1: `tests-e2e/pages/BasePage.js` *(Clase padre POM: `goto`, `fill`, `click`)*
   - Pestaña 2: `tests-e2e/pages/ProduccionPage.js` *(`extends BasePage` -- Page Object Model)*
   - Pestaña 3: `tests-e2e/fixtures/test.fixture.js` *(Inyección automática de páginas -- sin `new` repetitivo)*
   - Pestaña 4: `tests-e2e/helpers/db.js` *(Patrón Test Data Builder)*
   - Pestaña 5: `tests-e2e/tests/f3-produccion.spec.js` y `f1-materias-primas.spec.js`
2. Abrir la **Terminal integrada** en VS Code ubicada dentro de `tests-e2e`:
   ```powershell
   cd tests-e2e
   ```
3. *(Tip pro)* Deja corriendo `iniciar_local` desde antes (o deja que `webServer` lo arranque), así la demo visual en Chrome arranca en menos de 2 segundos.

---

### Parte A: Tour de Código en VS Code (Mostrar y Comentar — 2 min)

#### 1. Mostrar `tests-e2e/pages/BasePage.js` y `ProduccionPage.js` (**Herencia + Page Object Model**)
*Qué señalar con el mouse:* `export class BasePage` (`goto`, `fill`, `click`), y en `ProduccionPage.js`: `export class ProduccionPage extends BasePage`.
> **Qué decir:** *"Igual que el diseño profesional en capas, creamos una clase padre `BasePage.js` con los métodos comunes (`goto`, `fill`, `click` con espera de visibilidad). Cada pantalla como `ProduccionPage` hereda con `extends BasePage`, define su ruta `/produccion` y encapsula sus propios selectores DOM. Si cambia un botón en React, solo se edita aquí."*

#### 2. Mostrar `tests-e2e/fixtures/test.fixture.js` y `f1-materias-primas.spec.js` (**Fixtures + `beforeEach` = cero `new` repetitivo**)
*Qué señalar:* `base.extend({ mpPage: ... })` en `test.fixture.js`, y en `f1-materias-primas.spec.js` el `test.beforeEach` y `async ({ mpPage }) =>`.
> **Qué decir:** *"Para evitar instanciar `new MateriasPrimasPage(page)` y llamar `goto()` en cada caso de prueba, implementamos **Custom Fixtures** de Playwright en `test.fixture.js` junto con `test.beforeEach`. Así, cada caso recibe directamente `{ mpPage }` ya listo y ubicado en la pantalla, quedando el test súper limpio en solo unas líneas de negocio."*

#### 3. Mostrar `tests-e2e/helpers/db.js` (Líneas 20 a 60 — **Test Data Builder**)
*Qué señalar:* La función `resetBaseline(...)` y el `TRUNCATE TABLE ... RESTART IDENTITY CASCADE`.
> **Qué decir:** *"Este archivo aplica el patrón Test Data Builder y resuelve nuestro mayor reto de la Entrega 1: en el Arreglo Ortogonal $L_9$ cada caso necesita stocks iniciales distintos (por ejemplo `A=17.5, B=5, C=2.5`). En vez de cambiarlos a mano, `resetBaseline()` limpia e inserta en PostgreSQL los datos exactos antes de cada prueba en 20 milisegundos."*

#### 4. Mostrar `tests-e2e/tests/f3-produccion.spec.js` (**Data-Driven + Arrange-Act-Assert**)
*Qué señalar:* El bucle `for (const tc of aoCases)`, `async ({ produccionPage, dashboardPage })`, `getStocksSnapshot()`.
> **Qué decir:** *"Gracias a POM + Fixtures + Data-Driven Testing, las 9 corridas de Taguchi $L_9$ corren con el mismo bloque: el test solo llama `produccionPage.registrarProduccion(...)`, valida el HTTP 201 o 400 de rollback, confirma en PostgreSQL que ningún insumo tuvo descuento parcial y verifica con `dashboardPage` las alertas rojas."*

#### 5. Mostrar `tests-e2e/tests/f2-formulas.spec.js` (Líneas 1 a 45)
*Qué señalar:* `test.beforeEach` abriendo la fórmula del champú y la aserción de `F2-CP-02`.
> **Qué decir:** *"En `f2-formulas.spec.js`, el `beforeEach` deja el formulario ya abierto sobre Champú vegano y en `F2-CP-02` afirmamos que al guardar una fórmula vacía sin ingredientes la API debe responder `>= 400` según RN-08... y ya verán en vivo qué pasa."*

---

### Parte B: Ejecución en Vivo (Hacer y Narrar — 2 min)

#### Paso 1: Demo visual en navegador real (solo F3 para que sea rápido y visual)
Escribir en la terminal de `tests-e2e`:
```powershell
npx playwright test tests/f3-produccion.spec.js --headed
```
*Qué está pasando en pantalla:* Se abre la ventana de Chrome y se ve a altísima velocidad cómo selecciona `Champú vegano`, escribe `10`, `25`, `1`, registra lotes, aparecen errores rojos de `Stock insuficiente` en los casos negativos y salta al Dashboard a validar alertas.
> **Qué decir mientras Chrome corre:** *"En este momento Playwright está controlando Chrome de verdad sin intervención humana. Pueden ver cómo ejecuta las 9 combinaciones de Taguchi $L_9$: cuando falta un insumo captura la alerta en pantalla y verifica que el stock en base de datos no cambió; cuando pasa, va al Dashboard y comprueba las alertas rojas. Las 12 pruebas de producción terminan en menos de 12 segundos con 100% de aprobación."*

#### Paso 2: Ejecutar la suite completa (los 29 casos) en consola
```powershell
npm test
```
*Qué ocurre:* En **~32 segundos** termina e imprime en consola: `27 passed` en verde y `2 failed` en rojo (`F1-CP-05` y `F2-CP-02`).
> **Qué decir al terminar:** *"Listo: 29 casos ejecutados en ~32 segundos. 27 pasaron en verde y 2 fallaron en rojo (`F1-CP-05` y `F2-CP-02`). Vamos a abrir el reporte visual oficial para ver por qué fallaron."*

#### Paso 3: Abrir el Reporte HTML interactivo
```powershell
npm run report
```
*(Se abre el navegador con el reporte de Playwright. Hacer clic en la pestaña/filtro **"Failed (2)"** y abrir uno de los fallidos para mostrar la captura de pantalla).*
> **Qué decir:** *"Este es el reporte HTML oficial que genera Playwright. Aquí podemos filtrar los 2 fallos, ver el error exacto (`Expected >= 400, Received 201` en F1-CP-05), revisar la captura de pantalla tomada automáticamente en el momento del fallo y hasta la traza paso a paso. Le doy paso a Daniela para explicar estos resultados."*

---

## 4. Guion de Cierre: Resultados, Hallazgos y Desafíos *(Daniela Orobio — 3 min)*

### Diapositiva 7 — Reporte Real de Ejecución *(Daniela Orobio)*
> *"Consolidando la ejecución automatizada que acaban de ver: ejecutamos los **29 casos seleccionados en 32.5 segundos**, obteniendo **27 casos aprobados (93.10%)** y **2 casos fallidos (6.90%)**.*
> *Desglosado por módulo: **Producción (F3) logró 100%** con 12 de 12 aprobados, y **Distribución (F4) logró 100%** con 7 de 7 aprobados, lo que confirma que la lógica transaccional en PostgreSQL es sumamente robusta. Los dos fallos ocurrieron en Materias Primas (F1) y Fórmulas (F2)."*

### Diapositiva 8 — Hallazgos Relevantes y Nuevos Defectos *(Daniela Orobio)*
> *"Lo más valioso de pasar de pruebas manuales a pruebas automatizadas estrictas fue descubrir hallazgos reales que en la Entrega 1 se habían pasado por alto:*
> *1. **DEF-02 (Nuevo) en `F1-CP-05`:** Según la regla RN-04, el stock máximo de una materia prima es 50 unidades. Al enviar automatizadamente `50.01 kg` para Glicerina, ni el formulario ni el backend lo bloquearon: Express respondió `201 Created` y lo guardó en la base de datos.*
> *2. **DEF-03 (Nuevo) en `F2-CP-02`:** Según RN-08, toda fórmula debe tener al menos un ingrediente. Sin embargo, al dar clic en 'Guardar Fórmula' sin materias primas, el endpoint respondió `200 OK` y el frontend mostró la alerta `'Formula guardada'`, borrando además la receta previa.*
> *3. **Regresión confirmada de DEF-01 en `F1-CP-03`:** El defecto que reportamos en la Entrega 1 sobre `"aloe vera "` con espacios y minúsculas ya fue rechazado con HTTP 409 gracias al índice único `LOWER(TRIM(nombre))` en la base de datos.*
> *4. **Observación en `F1-CP-06` (`-1 kg`):** Aunque PostgreSQL sí protege el sistema impidiendo guardar negativos mediante su restricción `CHECK`, el backend retorna un error genérico `500` en lugar de una validación controlada `400 Bad Request`."*

### Diapositiva 9 — Desafíos Superados y Conclusiones *(Daniela Orobio)*
> *"Para finalizar, resumimos los tres grandes desafíos técnicos que superamos en esta entrega:*
> *1. **Aislamiento de inventario** para el Arreglo Ortogonal mediante `resetBaseline()` en PostgreSQL.*
> *2. **Validaciones HTML5**, comprobando `checkValidity()` cuando el navegador frena la petición antes de llegar a la API.*
> *3. **Condiciones de carrera con `window.alert()`**, resueltas sincronizando respuesta HTTP y diálogo en paralelo.*
> *Como conclusión, la automatización con Playwright nos permitió ejecutar en menos de medio minuto 29 escenarios reales multicapa, certificando la solidez del núcleo transaccional de Version-Eco y entregando al equipo de desarrollo dos defectos concretos y reproducibles antes de salir a producción. Muchas gracias."*
