---
name: design-kowalski
description: Directrices de diseño y micro-interacciones inspiradas en Emil Kowalski para crear interfaces pulidas, dinámicas y premium.
---

# Principios de Diseño - Estilo Emil Kowalski

Este Skill define las directrices para implementar interfaces de usuario web con un alto nivel de pulido visual, fluidez y micro-interacciones interactivas, inspiradas en el trabajo de Emil Kowalski.

## 1. Micro-interacciones y Transiciones
- **Feedback Inmediato:** Cada interacción del usuario (clicks, hovers, focos, arrastres) debe tener una respuesta visual sutil pero clara.
- **Transiciones de Estado Suaves:** Evitar cambios bruscos de estado. Utilizar transiciones de opacidad, transformaciones de escala y desplazamientos fluidos.
- **Física de Resorte (Spring Physics):** Para animaciones y transiciones de UI, preferir curvas de timing que imiten resortes reales (ej. `cubic-bezier(0.34, 1.56, 0.64, 1)` para un efecto sutil de rebote al abrir modales o al pasar el cursor sobre botones).

## 2. Detalles y Pulido
- **Contornos Reactivos (Borders):** Usar bordes sutiles con gradientes o semi-transparentes que reaccionen al estado del elemento.
- **Sombras Dinámicas:** Usar múltiples capas de sombras (`box-shadow`) para simular profundidad natural y elevación (elevaciones suaves para tarjetas, elevaciones pronunciadas para modales).
- **Glassmorphism Inteligente:** Aplicar fondos traslúcidos con `backdrop-filter: blur(...)` para menús flotantes, modales y barras de navegación.

## 3. Guía de Implementación en Código
- **CSS Transitions:** Utilizar duraciones cortas (entre `150ms` y `300ms`) con `ease-out` o curvas cúbicas personalizadas.
- **Interactividad Dinámica:** Al activar un elemento (como un botón o pestaña), aplicar un ligero encogimiento (`transform: scale(0.98)`) en el evento de click activo para simular un botón físico.
