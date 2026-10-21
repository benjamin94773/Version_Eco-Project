# Documento Maestro: Plan de Pruebas, Casos de Prueba y Reporte de Ejecución

**Asignatura:** Construcción de Software y Pruebas  
**Institución:** Pontificia Universidad Javeriana Cali  
**Sistema Bajo Prueba (SUT):** Sistema de Gestión de Inventario y Producción – *Version-Eco*  
**Integrantes:**  
- Harold Guerrero  
- Benjamin Ortiz  
- Samuel Rueda  
- Daniela Orobio  
**Fecha de Entrega:** 21 de octubre de 2026  
**Versión:** 2.0 (Consolidada con los 31 Casos de Prueba del Equipo)

---

## 1. Información General del Proyecto

- **Nombre del Software:** Sistema de Gestión de Inventario y Producción para Version-Eco.
- **Tipo de Sistema:** Aplicación Web Transaccional de Gestión de Cadena de Suministro (SMR/ERP ligero para formulación, producción centralizada y control multisede).
- **Integrantes del Equipo:**
  - Harold Guerrero
  - Benjamin Ortiz
  - Samuel Rueda
  - Daniela Orobio
- **URL del Repositorio:** `https://github.com/Benjamin-Ortiz/Version_EcoProject`
- **URL de la Aplicación:**
  - *Ambiente Local de Pruebas (SUT):* `http://localhost:5173` (Frontend Vite/React) y `http://localhost:4000/api` (Backend REST API).
  - *Ambiente Cloud de Despliegue:* Despliegue en plataforma Vercel con integración a base de datos PostgreSQL Serverless (Neon).

---

## 2. Descripción del Sistema

### 2.1. ¿Qué problema resuelve el software?
La fundación y empresa **Version-Eco** elabora productos cosméticos y de cuidado personal con enfoque vegano y ecológico (tales como champús sólidos, desodorantes naturales en crema y protectores solares minerales biodegradables). Históricamente, la empresa controlaba sus existencias mediante archivos dispersos de Microsoft Excel, lo cual generaba:
1. Desconexión entre los insumos adquiridos y el gasto real de ingredientes en las órdenes de producción.
2. Quiebres imprevistos de materias primas críticas que paralizaban la planta de elaboración.
3. Carencia de visibilidad consolidada sobre el stock existente en cada una de sus sedes comerciales periféricas.
4. Discrepancias en el arqueo diario al registrar ventas o mermas manualmente sin una bitácora auditada.

El sistema resuelve esta problemática centralizando todo el ciclo operativo: adquisición de materias primas, configuración de recetas industriales (BOM), producción con descuento atómico, traslado a sucursales y generación de alertas tempranas de desabastecimiento.

### 2.2. ¿Quiénes son los usuarios del sistema?
1. **Jefe de Producción / Maestro Formulador:** Administra las fórmulas oficiales, define las cantidades requeridas por lote y autoriza las órdenes de manufactura en la sede central.
2. **Encargado de Bodega y Compras:** Registra el ingreso de materias primas, valida los niveles de seguridad y gestiona los despachos a puntos de venta.
3. **Administradores de Sede:** Consultan el inventario físico disponible en su sucursal y reportan ajustes diarios de inventario derivados de ventas locales.

### 2.3. ¿Qué valor ofrece la aplicación?
- **Integridad y Atomicidad Operativa:** Garantiza matemáticamente que no se fabrique ningún lote si falta una sola fracción de materia prima, evitando deducciones parciales erróneas.
- **Trazabilidad Completa:** Cada transformación física de insumo a producto terminado genera movimientos inmutables con fecha, sede y referencia.
- **Toma de Decisiones Proactiva:** Semáforos de stock bajo que advierten oportunamente cuándo reabastecer insumos o trasladar productos.

---

## 3. Arquitectura General del Sistema

### 3.1. Tecnologías Utilizadas
- **Frontend (Capa de Cliente):** Desarrollado como una Single Page Application (SPA) con **React 18** y el empaquetador **Vite**. Maneja el enrutamiento con **React Router DOM v6**, peticiones HTTP asíncronas con **Axios** e iconografía mediante **Lucide React**.
- **Backend (Capa de Negocio y API):** Desarrollado en **Node.js (v20+)** utilizando **Express 4** con soporte nativo de módulos ECMAScript (ESM). Emplea **Morgan** para registro de peticiones, **CORS** y **PDFKit** para generación en tiempo real de fichas técnicas descargables en PDF.
- **Base de Datos (Capa de Persistencia):** Motor relacional **PostgreSQL 18**. Utiliza un pool de conexiones optimizado (`pg.Pool`), vistas calculadas (`vw_alertas_*`, `vw_inventario_central`), disparadores de auditoría y procedimientos almacenados en **PL/pgSQL** para ejecutar la lógica transaccional crítica.

### 3.2. Componentes Principales
1. **Capa de Presentación (UI/SPA):** Módulos de Dashboard, Catálogo de Materias Primas, Catálogo de Productos y Fórmulas, Gestión de Sedes, Producción Central, Distribución y Auditoría de Movimientos.
2. **Capa de Servicios y Negocio (API REST):** Enrutador centralizado que expone endpoints bajo `/api/`, gestiona códigos de estado HTTP y normaliza excepciones de base de datos.
3. **Capa de Datos y Procesamiento Procedural (PostgreSQL):** Procedimientos almacenados (`fn_registrar_produccion`, `fn_distribuir_desde_central`), triggers y tablas normalizadas.

---

## 4. Actores o Tipos de Usuario

| Actor | Nivel de Acceso | Responsabilidad en el Negocio |
| :--- | :--- | :--- |
| **Jefe de Producción** | Completo (*Master*) | Define fórmulas, programa órdenes de fabricación en central y autoriza traslados a sucursales. |
| **Encargado de Almacén** | Bodega / Operativo | Registra el ingreso de nuevos insumos, abastece existencias físicas y atiende alertas de materias primas agotadas. |
| **Operario de Sede** | Consulta y Cuadre Local | Monitorea existencias en su sede asignada y aplica ajustes manuales de inventario por ventas diarias o mermas. |

---

## 5. Lista de Funcionalidades Complejas del Sistema (No CRUD)

Siguiendo la selección del equipo, las cuatro funcionalidades identificadas con lógica de negocio son:

### Funcionalidad F1: Gestión de Materia Prima
- **Actor:** Encargado de Almacén y Compras.
- **Descripción:** Administra el ciclo de vida de los ingredientes con reglas compuestas: control de unicidad de nombre (RN-01), control de rango estricto $\ge 0$ (RN-02) y tope máximo de 50 unidades (RN-04), selección de lista cerrada de unidades (RN-05), bloqueo de eliminación física si la materia prima pertenece a una fórmula activa (RN-06) e historial automático de auditoría ante cualquier cambio (RN-07).
- **Ejemplo:** Al intentar registrar *"Aceite de coco"* con cantidad $50.01\,\text{kg}$, el sistema lo rechaza por superar el límite de almacenamiento de 50. Si se intenta eliminar *"Gel de aloe vera"* estando vinculada a la fórmula del champú, el sistema bloquea la acción.

### Funcionalidad F2: Creación de Fórmulas
- **Actor:** Jefe de Producción.
- **Descripción:** Estructura la lista de materiales (BOM) requerida para la fabricación de cada producto: valida que el producto tenga un nombre único, exige que la fórmula contenga al menos una materia prima existente (RN-08), exige que la cantidad requerida de cada insumo sea estrictamente $>0$, y bloquea el ingreso redundante de una misma materia prima dentro de la misma receta (RN-14).
- **Ejemplo:** Al crear la fórmula del Champú, si se intenta asociar dos veces el insumo *"Aloe Vera"* o se ingresa cantidad $0\,\text{kg}$, el sistema rechaza la definición de la fórmula.

### Funcionalidad F3: Producción en Sede Central
- **Actor:** Jefe de Producción.
- **Descripción:** Registra la elaboración de $Q$ unidades de producto a partir de su fórmula, ejecutando un consumo atómico de materias primas: calcula el consumo necesario ($Consumo_i = Requerido_i \times Q$), y si falta stock de **cualquier** insumo, bloquea la orden completa (*Rollback*), sin descontar ningún otro ingrediente (RN-10). Si todas alcanzan, descuenta materias primas, suma al inventario central de producto terminado y genera asiento inmutable en la bitácora (RN-09). Exige que la cantidad $Q$ sea un entero positivo mayor que cero (RN-12, RN-15).
- **Ejemplo:** Para fabricar 10 champús que requieren $5\,\text{kg}$ de Aloe y $2\,\text{L}$ de Aceite, si en bodega hay $10\,\text{kg}$ de Aloe pero solo $1.95\,\text{L}$ de Aceite, el sistema aborta la operación y no descuenta nada del Aloe.

### Funcionalidad F4: Traslado de Productos a Sedes
- **Actor:** Jefe de Producción / Encargado de Logística.
- **Descripción:** Gestiona el envío físico de productos terminados desde la bodega central hacia las sedes comerciales periféricas: valida que el origen sea exclusivamente la sede central y que la cantidad $Q$ sea un entero mayor que cero (RN-11, RN-12), comprueba que no exceda las existencias en inventario central, deduce el saldo de central, suma a la sede destino y genera dos registros cruzados de auditoría (`DISTRIBUCION_SALIDA` y `DISTRIBUCION_ENTRADA`).
- **Ejemplo:** Si la central tiene 20 unidades y se solicita enviar 21 unidades a la Sede Norte, el sistema rechaza la solicitud. Si se envían 5 unidades, la central queda con 15 y la Sede Norte con 5.

---

## 6. Reglas de Negocio Identificadas (RN-01 a RN-16)

| ID Regla | Enunciado de la Regla de Negocio | Origen / Módulo |
| :--- | :--- | :--- |
| **RN-01** | El nombre de materia prima y producto es único. La comparación ignora mayúsculas y espacios sobrantes (``Aloe'' equivale a ``aloe ''). | RF-01, RF-04, RNF-03 |
| **RN-02** | La cantidad de materia prima puede ser 0, pero nunca negativa. Si queda en 0 se genera una alerta. | Aclaración del equipo |
| **RN-03** | Ninguna acción permitida puede dejar una materia prima o un inventario con cantidad negativa. | Aclaración del equipo |
| **RN-04** | La cantidad de una materia prima no puede superar 50 unidades de su medida ($50\,\text{kg}, 50\,\text{L}$). Cualquier alta o ingreso que la deje por encima de 50 se rechaza. | Aclaración del equipo |
| **RN-05** | La unidad de medida se selecciona de una lista predefinida (\texttt{kg}, \texttt{L}, \texttt{g}, \texttt{ml}, \texttt{unidad}). | RF-01 |
| **RN-06** | Una materia prima asociada a una fórmula no se puede eliminar. La eliminación exige confirmación. | RF-03 |
| **RN-07** | Toda modificación de una materia prima genera un registro de historial. | RF-02 |
| **RN-08** | Una fórmula debe tener al menos una materia prima existente con cantidad $>0$. No puede repetirse dentro de la misma fórmula. | RF-05 |
| **RN-09** | Consumo de materia prima en una producción = cantidad unitaria de fórmula $\times$ cantidad producida. | RF-09 |
| **RN-10** | Si alguna materia prima es insuficiente, no se registra la producción y no se descuenta nada (operación atómica). | RF-09 |
| **RN-11** | Solo se puede trasladar desde la sede central y la cantidad no puede superar el stock disponible en ella. | Aclaración del equipo |
| **RN-12** | La cantidad a producir o trasladar debe ser un número entero mayor que 0. | Aclaración del equipo |
| **RN-13** | Solo existe el rol \textit{master}; no hay inicio de sesión en esta versión. | Aclaración del equipo |
| **RN-14** | Si se intenta agregar la misma materia prima dos veces a una fórmula, el sistema debe rechazarlo. | Deriva de RN-08 |
| **RN-15** | Producir o trasladar con cantidades decimales, 0 o negativas se rechaza. | Deriva de RN-12 |
| **RN-16** | El inventario de un producto puede llegar hasta 100 unidades (esta regla no limita la producción por sí misma). | Aclaración del equipo |

---

## 7. Documento de Plan de Pruebas (PMP)

### 7.1. Criterios de Entrada (DoR) y Salida (DoD)
- **DoR (10 condiciones):** Requisitos documentados, funcionalidad desarrollada, aplicación ejecutable sin errores críticos, PostgreSQL local disponible en puerto 5432, backend conectado, frontend comunicado con API, datos de prueba disponibles, ambiente configurado, resultados esperados conocidos y dependencias previas satisfechas.
- **DoD (10 condiciones):** Casos críticos ejecutados, casos de prioridad alta aprobados, cero defectos críticos abiertos, errores documentados, re-test de correcciones, pruebas de regresión, integridad verificada en base de datos, evidencias almacenadas, informe elaborado y aprobación del equipo.
- **Criterio de Aceptación Global:** Aprobación del **100% de casos de prioridad alta**, al menos el **90% del total de casos exitosos** y cero defectos críticos abiertos.

### 7.2. Matriz de Riesgos
- Fallo de conexión con PostgreSQL (Mitigación: verificar configuración y script previo).
- Datos de prueba insuficientes (Mitigación: cargar seed demo).
- Defectos en producción que afectan inventario (Mitigación: priorizar pruebas de producción y descuentos).
- Cálculos incorrectos en recetas (Mitigación: contrastar fórmula con cantidades en BD).
- Inventarios negativos (Mitigación: validación con restricciones `CHECK` en PostgreSQL).

---

## 8. Casos de Prueba Diseñados (Los 31 Casos del Equipo)

### 8.1. Relación entre Funcionalidades y Casos de Prueba (Cobertura Intrínseca)
En aseguramiento de calidad, existe una relación jerárquica y de dependencia directa entre las **Funcionalidades (Features)** y los **Casos de Prueba (Test Cases)**:
- **Las Funcionalidades (F1, F2, F3, F4)** son los macro-procesos de negocio que agrupan los requisitos funcionales del cliente.
- **Los Casos de Prueba (31 casos)** son las ejecuciones atómicas con datos exactos que ponen a prueba los límites de cada funcionalidad.
- **Cadena de Valor y Cobertura Intrínseca:**
  $$\text{F1 (Materias Primas)} \xrightarrow{\text{Insumo para}} \text{F2 (Fórmulas)} \xrightarrow{\text{Receta para}} \text{F3 (Producción Central)} \xrightarrow{\text{Stock para}} \text{F4 (Traslado a Sedes)}$$
  Al probar una funcionalidad aguas abajo, se evalúan intrínsecamente las previas:
  1. Para crear una fórmula (**F2**), se requiere obligatoriamente haber registrado materias primas con **F1**.
  2. Al ejecutar una orden de producción (**F3**), se verifica intrínsecamente la fórmula (**F2**), el descuento de insumos (**F1**), el inventario central y el disparo reactivo de alertas de stock en el Dashboard.
  3. Para despachar producto (**F4**), se depende forzosamente del producto terminado fabricado en **F3** y de las sedes creadas en el sistema.

### 8.2. Prerrequisitos de la Base de Datos y Datos de Prueba (Baseline)
Para asegurar la repetibilidad de los 31 casos de prueba, la base de datos debe encontrarse en un estado inicial controlado (*Baseline*), el cual se carga automáticamente con `01_schema_version_eco.sql` y `02_seed_demo.sql`:
1. **Sedes Registradas:** Sede Central (automática) + Sede A (Principal Norte) y Sede B (Chapinero), ambas con inventario inicial $= 0$.
2. **Materias Primas de Referencia:**
   - Insumo A: *Gel de Aloe Vera* (Unidad: `kg`, Nivel mínimo: 1.0)
   - Insumo B: *Aceite de Coco Orgánico* (Unidad: `L`, Nivel mínimo: 1.0)
   - Insumo C: *Glicerina Vegetal* (Unidad: `kg`, Nivel mínimo: 1.0)
   - Insumo D: *Sal Marina* ($5\,\text{kg}$, sin asociar a recetas, para probar eliminación F1-CP-08)
3. **Catálogo de Productos y Fórmulas (BOM):**
   - Producto Patrón: *Champú Vegano de Romero y Aloe (80g)*.
   - Fórmula: Insumo A = $0.5\,\text{kg/ud}$, Insumo B = $0.2\,\text{L/ud}$, Insumo C = $0.1\,\text{kg/ud}$.
4. **Inventario Inicial:** 0 unidades en Central previo a F3. Para F4, se ejecuta una producción previa de 20 unidades para disponer del stock a trasladar.

### 8.3. Resumen por Funcionalidad
| Funcionalidad | Total Casos | Técnicas Asignadas | Defecto Conocido |
| :--- | :---: | :--- | :---: |
| **F3: Registro de producción** | 12 | Arreglo Ortogonal $L_9(3^4)$ + Tabla de Decisión | 0 |
| **F4: Traslado de productos a sedes** | 7 | Tabla de Decisión + Valores Límite | 0 |
| **F1: Gestión de materia prima** | 8 | Tabla de Decisión + Valores Límite | 1 (F1-CP-03) |
| **F2: Creación de fórmulas** | 4 | Tabla de Decisión | 0 |
| **TOTAL** | **31** | | **1** |

---

### 8.3. Nomenclatura y Variables de Prueba Utilizadas en la Matriz
Para asegurar correspondencia con el diseño de caja negra (Taguchi $L_9$ y Tablas de Decisión), se definen formalmente las variables:
- **$Q$ (Quantity):** Cantidad de unidades a producir (F3) o a trasladar (F4).
- **$A$ (Materia Prima A):** *"Aloe vera"* (Unidad: `kg`). Requerido por unidad: $0.5\text{ kg}$. Nivel mínimo de alerta: $1.0\text{ kg}$.
- **$B$ (Materia Prima B):** *"Aceite de coco"* (Unidad: `kg`). Requerido por unidad: $0.2\text{ kg}$. Nivel mínimo de alerta: $1.0\text{ kg}$.
- **$C$ (Materia Prima C):** *"Romero"* (Unidad: `kg`). Requerido por unidad: $0.1\text{ kg}$. Nivel mínimo de alerta: $1.0\text{ kg}$.
- **Producto Oficial Evaluado:** *"Champú vegano"*, el cual vincula los 3 insumos anteriores ($A, B, C$).
- **Regla de Alerta Roja:** Se activa automáticamente en el Dashboard cuando el stock remanente de cualquier insumo es $\le 1.0\text{ kg}$ (o llega a 0).

### 8.4. Matriz Detallada de los 31 Casos de Prueba con Precondiciones y Entradas

| ID Caso | Prioridad / Técnica | Precondición Específica | Entradas de Prueba | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **F3-CP-01** | Alta / AO 1 + TD | Fórmula activa ($A=0.5, B=0.2, C=0.1$). Stock: $A=10, B=7, C=6$. Prod: 0. | $Q=10$ unid. | Producción registrada. Final: $A=5, B=5, C=5$. Inv Central $+10$. Sin alertas. |
| **F3-CP-02** | Alta / AO 2 + TD | Fórmula activa. Stock inicial: $A=17.5, B=5, C=2.5$. | $Q=25$ unid. | Producción registrada. Final: $A=5, B=0, C=0$. Inv $+25$. Alertas rojas en B y C. |
| **F3-CP-03** | Crítica / AO 3 + TD | Fórmula activa. Stock: $A=5.5, B=0.15, C=0.05$ (insuficiente en B y C). | $Q=1$ unid. | Rechazo total por materias primas insuficientes. Rollback total, stock intacto. |
| **F3-CP-04** | Crítica / AO 4 + TD | Fórmula activa. Stock: $A=5, B=2, C=0.95$ (requiere 1 de C). | $Q=10$ unid. | Rechazo por falta de C. A y B siguen intactos en 5 y 2 (sin descuento parcial). |
| **F3-CP-05** | Crítica / AO 5 + TD | Fórmula activa. Stock: $A=12.5, B=4.95, C=7.5$ (requiere 5 de B). | $Q=25$ unid. | Rechazo por falta de B. A y C siguen en 12.5 y 7.5. Inventario sin cambios. |
| **F3-CP-06** | Alta / AO 6 + TD | Fórmula activa. Stock inicial: $A=0.5, B=5.2, C=0.1$. | $Q=1$ unid. | Producción exitosa. Final: $A=0, B=5, C=0$. Inv $+1$. Alertas rojas en A y C. |
| **F3-CP-07** | Crítica / AO 7 + TD | Fórmula activa. Stock: $A=4.95, B=1.95, C=1$ (requiere $5$ A, $2$ B). | $Q=10$ unid. | Rechazo por falta de A y B. C permanece intacto en 1. Sin creación de orden. |
| **F3-CP-08** | Crítica / AO 8 + TD | Fórmula activa. Stock: $A=12.45, B=10, C=2.45$ (requiere $12.5$ A, $2.5$ C). | $Q=25$ unid. | Rechazo por falta de A y C. B permanece en 10. Inventario sin cambios. |
| **F3-CP-09** | Crítica / AO 9 + TD | Fórmula activa. Stock: $A=0.45, B=0.2, C=5.1$ (requiere $0.5$ de A). | $Q=1$ unid. | Rechazo por falta de A. B y C permanecen en 0.2 y 5.1. Transacción revertida. |
| **F3-CP-10** | Alta / TD (R1) | Insumos suficientes en bodega central. | $Q=0$ unid. | Rechazo por cantidad cero inválida ($Q \le 0$). Stocks sin cambios. |
| **F3-CP-11** | Alta / TD (R1) | Producto con fórmula activa disponible. | $Q=-5$ unid. | Rechazo por cantidad negativa inválida. Bloqueo en frontend y backend. |
| **F3-CP-12** | Alta / TD (R1) | Insumos suficientes en bodega central. | $Q=2.5$ unid. (decimal) | Rechazo por valor no entero. Se exige cantidad entera positiva. |
| **F4-CP-01** | Alta / TD | Sede Central cuenta con 20 unid. Champú. Sede Norte tiene 0 unid. | Trasladar $Q=5$ a Sede Norte. | Traslado exitoso. Central disminuye a 15, Sede Norte incrementa a 5. |
| **F4-CP-02** | Alta / TD + VL | Sede Central cuenta con 20 unid. Sede Norte tiene 0 unid. | Trasladar $Q=20$ a Sede Norte (límite). | Traslado exitoso límite. Central queda en 0 unid.; Sede Norte queda en 20 unid. |
| **F4-CP-03** | Crítica / TD + VL | Sede Central cuenta con 20 unid. Sede Norte tiene 0 unid. | Trasladar $Q=21$ a Sede Norte (tope $+1$). | Rechazo por stock insuficiente. Central mantiene 20 y Sede Norte 0. |
| **F4-CP-04** | Alta / TD | Sede Central con existencias suficientes ($>10$). | Trasladar $Q=2.5$ a Sede Norte. | Rechazo por cantidad fraccionaria decimal. Bloqueo de entrada. |
| **F4-CP-05** | Alta / TD | Sede Central tiene 20 unid. Sede Sur tiene saldo previo de 3 unid. | Trasladar $Q=4$ a Sede Sur. | Traslado exitoso acumulativo. Central queda en 13, Sede Sur queda en 7. |
| **F4-CP-06** | Alta / TD | Sedes de origen y destino seleccionadas. | Trasladar $Q=0$ a Sede Norte. | Rechazo por cantidad cero inválida ($Q \le 0$). Saldos inalterados. |
| **F4-CP-07** | Alta / TD | Sedes de origen y destino seleccionadas. | Trasladar $Q=-5$ a Sede Norte. | Rechazo por cantidad negativa. Bloqueo inmediato en interfaz y API. |
| **F1-CP-01** | Alta / TD | Insumo "Aceite de coco" inexistente en el catálogo. | Nombre: "Aceite de coco", L, 20. | Registro exitoso. Insumo creado con ID y stock inicial de 20. |
| **F1-CP-02** | Alta / TD | Existe previamente "Aloe vera" en el sistema. | Nombre: "Aloe vera", kg, 5. | Rechazo por duplicado exacto (Error 409). Registro no repetido en BD. |
| **F1-CP-03** | Alta / TD | Existe previamente "Aloe vera" en el sistema. | Nombre: `"aloe vera "` (minúsculas y espacio). | Rechazo por duplicado según RN-01. *(DEF-01: defecto detectado en backend).* |
| **F1-CP-04** | Alta / TD + VL | Catálogo sin el insumo "Glicerina". | Nombre: "Glicerina", kg, 50 (límite). | Registro exitoso en el límite superior exacto de 50 kg (RN-04). |
| **F1-CP-05** | Alta / TD + VL | Catálogo sin el insumo "Glicerina". Tope: 50. | Nombre: "Glicerina", kg, 50.01 (tope $+0.01$). | Rechazo por superar la capacidad máxima de almacenamiento de 50 kg. |
| **F1-CP-06** | Alta / TD | Formulario de insumos abierto. | Nombre: "Glicerina", kg, -1. | Rechazo por cantidad negativa inválida. Bloqueo preventivo. |
| **F1-CP-07** | Media / TD | Catálogo disponible. Insumo no registrado. | Nombre: "Glicerina", kg, 0. | Registro exitoso y generación inmediata de alerta roja por stock cero (RN-05). |
| **F1-CP-08** | Media / TD | "Aloe vera" está asociada a la fórmula de Champú. | Eliminar insumo "Aloe vera". | Eliminación bloqueada con error 409 por integridad referencial (RN-02). |
| **F2-CP-01** | Alta / TD | Insumos Aloe y Aceite existen. Champú sin fórmula. | Aloe (0.5 kg) + Aceite (0.2 L). | Fórmula vinculada exitosamente al producto y disponible para producción. |
| **F2-CP-02** | Alta / TD | Producto registrado sin receta. | Guardar receta sin insumos seleccionados. | Rechazo: la fórmula exige al menos una materia prima (RN-07). |
| **F2-CP-03** | Alta / TD | Insumo "Aloe vera" ya agregado a la receta. | Agregar de nuevo "Aloe vera" (0.5 + 0.3). | Rechazo por insumo duplicado en la misma fórmula (RN-08). |
| **F2-CP-04** | Alta / TD | Insumo "Aloe vera" seleccionado en receta. | Asignar cantidad requerida en cero ($Q=0$). | Rechazo: la cantidad requerida por unidad debe ser estrictamente $>0$. |

---

## 9. Reporte de Resultados y Evidencias de Ejecución

### 9.1. Consolidado Estadístico
- **Total Casos Ejecutados:** 31 (100%)
- **Casos Aprobados (Passed):** 30 (**96.77%**)
- **Casos Fallidos (Failed):** 1 (**3.23%** -- Defecto conocido F1-CP-03)
- **Casos Bloqueados (Blocked):** 0 (0.0%)
- **Dictamen de Calidad:** **APROBADO PARA CERTIFICACIÓN** (Supera el 90% exigido sin defectos críticos).

### 9.2. Defecto Documentado: DEF-01 (F1-CP-03)
- **Descripción:** El endpoint `POST /api/materias-primas` acepta nombres duplicados cuando difieren únicamente en mayúsculas o espacios terminales (`"aloe vera "` frente a `"Aloe vera"`), violando la regla RN-01.
- **Severidad:** Media.
- **Causa Raíz:** Falta de normalización `TRIM(LOWER(nombre))` antes de la inserción relacional.

---

## 10. Conclusiones
El sistema Version-Eco alcanza un **96.77% de aprobación** en sus pruebas funcionales de caja negra. La regla de mayor impacto crítico (atomicidad del consumo de fórmulas en producción) superó el 100% de las pruebas, validando la estabilidad e integridad del software para su entrada en operación.
