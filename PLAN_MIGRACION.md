# Plan de Migración: Sistema de Inventario Policlínico Tabancura

Este documento detalla el plan estratégico para migrar el sistema de inventario actual basado en Excel (`InventarioTribunales2026.xlsm`) a una aplicación web moderna utilizando **Node.js, Next.js y PostgreSQL**. Este plan queda documentado aquí para ser ejecutado en futuras sesiones de desarrollo.

## 1. Arquitectura Técnica
- **Frontend/Backend:** Next.js (App Router) en entorno Node.js.
- **Base de Datos:** PostgreSQL autoalojada. En futuras sesiones se proporcionarán las credenciales de conexión.
- **ORM:** Prisma ORM para gestionar la conexión y el esquema de la base de datos de manera robusta.
- **Estilos y UX:** Implementación guiada por el documento `scratch/Diseño_sistemas.md` e inspirada por los principios de diseño y micro-interacciones de **Emil Kowalski** (ver la guía del skill en [.agents/skills/design-kowalski/SKILL.md](file:///c:/Users/EQUIPO/Desktop/Sandbox/devPythonActual/pt.cl-inventario/.agents/skills/design-kowalski/SKILL.md)). Se priorizará la física de resorte (spring animations), transiciones fluidas de estado y una estética de interfaz altamente pulida. *Nota: Se descartó el requerimiento del menú de accesibilidad integral.*
- **Infraestructura de despliegue:** Preparado para despliegue automatizado a través de GitHub hacia Coolify.

## 2. Esquema de Base de Datos Propuesto
De acuerdo al análisis del archivo Excel, se deben crear los siguientes modelos en Prisma:

* **Product (Productos):** 
  * Campos: `id`, `codigo` (ej. MA000003), `nombre`, `clasificacion` (Artículos de aseo, etc.), `tipo`, `unidad`, `stockActual`, `valorNeto`.
* **Supplier (Proveedor):** 
  * Campos: `id`, `rut`, `razonSocial`, `direccion`, `contacto`, `email`, `telefono`.
* **Location/Recipient (Destinos):** 
  * Campos: `id`, `nombre`, `tipo` (Persona, Box de atención, Recepción).
* **Transaction (Movimientos de Inventario):** 
  * Campos: `id`, `fecha`, `productoId`, `cantidad`, `tipoMovimiento` (Ingreso/Compra, Egreso/Consumo), `destinoId` (asociado a un Location/Recipient, como en la pestaña "Tree Oss").

## 3. Módulos de la Aplicación (UI/UX)
- **Dashboard Principal:** Vista resumen con indicadores de stock general y alertas de bajo inventario.
- **Gestión de Productos:** Tabla de datos para visualizar, agregar, editar y eliminar productos.
- **Gestión de Proveedores:** Mantenedor del directorio de proveedores institucionales.
- **Registros de Movimientos (Ingresos y Salidas):** Formularios para capturar recepciones de compras y registrar el consumo diario hacia los diferentes box y pacientes.

## 4. Próximos Pasos (Sesiones Futuras)
1. **Inicialización:** Crear el proyecto de Next.js y configurar los estilos/tokens de diseño (`globals.css`).
2. **Conexión a BD:** Configurar Prisma con las credenciales de la base de datos PostgreSQL proporcionadas.
3. **Migración de Datos:** Crear un script (`seed.js`) para volcar la información actual de las pestañas `PRODUCTOS`, `PROVEEDOR` y `Stok_Inicial` del Excel hacia PostgreSQL.
4. **Desarrollo de Vistas:** Implementar las pantallas y lógicas de los módulos.
5. **Autenticación (Opcional a confirmar):** Configurar NextAuth si se requiere restringir el acceso al inventario.
6. **Despliegue:** Conectar el repositorio con Coolify.
