# Guía y Guion de Presentación Grupal — Entrega Final (27 de noviembre de 2026)

**Proyecto:** Sistema de Gestión de Inventario y Producción *Version-Eco*  
**Integrantes:** Harold Guerrero, Benjamin Ortiz, Samuel Rueda, Daniela Orobio  
**Asignatura:** Construcción de Software y Pruebas — Pontificia Universidad Javeriana Cali  

---

## 1. Estructura Recomendada de Diapositivas (9 Slides — ~12 minutos)

| Slide | Tema | Responsable Sugerido | Contenido Clave |
| :---: | :--- | :--- | :--- |
| **1** | **Portada y Recordatorio del SUT** | Benjamin Ortiz | Nombre del sistema (*Version-Eco*), stack tecnológico (React 18 + Vite, Express 4, PostgreSQL 18) y las 4 funcionalidades complejas (F1–F4). |
| **2** | **Actualización del Plan de Pruebas** | Benjamin Ortiz | Estrategia de Automatización E2E Multicapa (UI + Interceptación HTTP + Verificación en BD PostgreSQL) + *Test Data Sandboxing* (`resetBaseline()`). |
| **3** | **Evaluación de Herramientas** | Samuel Rueda | Comparativa ponderada entre **Playwright (10/10)**, Cypress (8.5), Selenium (7.15), Katalon (6.75) y Postman (4.95). Socialización de criterios frente a React/HTML5/alertas nativas. |
| **4** | **¿Por qué Playwright + `pg`?** | Samuel Rueda | Mismo lenguaje ESM que el proyecto, validación nativa `checkValidity()`, manejo de `window.alert`, arranque automático `webServer` y reporte HTML interactivo con trazas (`trace.zip`). |
| **5** | **Selección de Casos (29 de 31)** | Harold Guerrero | Criterios ISTQB (Riesgo/ROI): **29 automatizados (93.55%)** cubriendo el 100% de prioridad Crítica y Alta (12 de F3, 7 de F4, 6 de F1, 4 de F2). Justificación de `F1-CP-07` y `F1-CP-08` como manuales (Media). |
| **6** | **Demostración en Vivo** | Harold Guerrero | Ejecución en vivo con navegador visible (`npx playwright test --headed`) y apertura del reporte HTML (`npx playwright show-report`). |
| **7** | **Resultados y Métricas Reales** | Daniela Orobio | **29 ejecutados en 28.5 s**: **27 aprobados (93.10%)** y **2 fallidos (6.90%)**. 100% de éxito en F3 (Taguchi $L_9$ atómico) y F4 (traslados). |
| **8** | **Hallazgos y Nuevos Defectos** | Daniela Orobio | Explicación de **DEF-02 (`F1-CP-05`)**: acepta `50.01` kg violando RN-04; **DEF-03 (`F2-CP-02`)**: permite guardar fórmula vacía violando RN-08; regresión exitosa de **DEF-01** (`F1-CP-03`). |
| **9** | **Desafíos Técnicos y Conclusiones** | Todo el equipo | Principales retos superados durante la automatización y cierre de aprendizajes para la clase. |

---

## 2. Guion para la Demostración en Vivo (Slide 6)

### Paso previo antes de empezar a exponer
Asegúrate de tener PostgreSQL corriendo y abre una terminal en la carpeta `tests-e2e`:
```powershell
cd tests-e2e
```
*(No hace falta prender `backend` ni `frontend` aparte si están apagados, porque `playwright.config.js` los levanta automáticamente con `webServer`, aunque tenerlos encendidos con `iniciar_local` hace que la demo empiece instantáneamente).*

### Comandos durante la demostración en vivo
1. **Ejecutar una demostración visual rápida de F3 (Producción Atómica Taguchi $L_9$) con navegador abierto (`--headed`):**
   ```powershell
   npx playwright test tests/f3-produccion.spec.js --headed
   ```
   *Qué destacar mientras el público mira:* *"Observen cómo antes de cada caso se inyectan los saldos exactos en PostgreSQL (`resetBaseline`), Chrome llena el formulario automáticamente, valida en Dashboard las alertas rojas cuando $B$ y $C$ llegan a cero (`F3-CP-02`), y confirma el rollback atómico cuando falta stock."*

2. **Ejecutar la suite completa (los 29 casos):**
   ```powershell
   npm test
   ```
   *Resultado esperado en ~28.5 segundos:* `27 passed, 2 failed` (`F1-CP-05` y `F2-CP-02`).

3. **Abrir el Reporte HTML interactivo para mostrar las evidencias:**
   ```powershell
   npm run report
   ```
   *Qué mostrar en el navegador:*
   * Filtrar por **Failed (2)**: hacer clic en `F1-CP-05` y `F2-CP-02`.
   * Mostrar la aserción exacta fallida (`Expected >= 400, Received 201` y `Received 200`), la **captura de pantalla automática** del formulario en ese instante y la **traza interactiva** (`trace.zip`) con línea de tiempo y peticiones de red.

---

## 3. Principales Desafíos Encontrados (Slide 9)

1. **Aislamiento de Estado y Dependencias entre Casos ($L_9$ y F4):**
   * *Problema:* Las pruebas de producción consumen inventario real y las de traslado dependen del stock central generado previamente. Si se ejecutan en paralelo o sin limpieza, los saldos se contaminan y los casos fallan de forma intermitente (*flaky*).
   * *Solución:* Ejecución secuencial (`workers: 1`) combinada con un *Test Data Builder* en PostgreSQL (`helpers/db.js`) que ejecuta `TRUNCATE ... RESTART IDENTITY CASCADE` y restablece el escenario exacto en ~20 ms antes de cada caso.

2. **Manejo de Validaciones Nativas HTML5 (`checkValidity`) vs Peticiones API:**
   * *Problema:* En `F3-CP-10/11/12` y `F4-CP-04/06/07`, los inputs `<input type="number" min="1">` bloquean el envío antes de disparar ninguna petición HTTP o mensaje `.error-msg` en el DOM.
   * *Solución:* Evaluar directamente el estado de restricción del navegador con `qtyInput.evaluate(el => el.checkValidity())` combinado con un listener de red confirmando que nunca se envió la petición `POST`.

3. **Sincronización con Diálogos Bloqueantes Nativos (`window.alert`):**
   * *Problema:* Al guardar una fórmula en React (`ProductosPage.jsx`), el diálogo `alert('Formula guardada')` aparece de forma asíncrona tras la respuesta `PUT` y bloquea el hilo si no se escucha explícitamente; en nuestra primera ejecución causó una condición de carrera en `F2-CP-01`.
   * *Solución:* Sincronización paralela determinística mediante `Promise.all([page.waitForResponse(...), page.waitForEvent('dialog')])`.

4. **Diferencias entre Pruebas Manuales (Entrega 1) y Automatizadas (Entrega 2):**
   * *Hallazgo:* La automatización reveló que el código real del backend no implementaba el tope de 50 kg (`RN-04` -> **DEF-02**) ni el bloqueo de fórmulas vacías (`RN-08` -> **DEF-03**), y que el manejo de negativos (`-1`) devolvía `HTTP 500` por excepción SQL sin captura controlada en Express. Esto demostró ante el equipo el valor real de las aserciones automatizadas estrictas.

---

## 4. Puntos de Socialización con los Compañeros del Curso

* **¿Por qué recomendamos Playwright sobre Cypress o Selenium para proyectos React + Vite + PostgreSQL?**
  * *Frente a Selenium:* Evita configurar WebDrivers externos y elimina esperas manuales (`Thread.sleep`) gracias al *auto-waiting*.
  * *Frente a Cypress:* Permite evaluar validaciones HTML5 nativas, controlar alertas bloqueantes sin romper el flujo, ejecutar en múltiples pestañas/contextos y levantar el servidor Backend+Frontend desde su misma configuración (`webServer`).
  * *Frente a Postman:* Postman solo verifica la API REST, pero no detecta si el formulario React bloquea un decimal (`Q=2.5`) o si las tarjetas rojas del Dashboard realmente se renderizan. Con Playwright validamos **Frontend + API + PostgreSQL en una sola ejecución**.
