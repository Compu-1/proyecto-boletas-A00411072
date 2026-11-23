# Icesi Live Arena — Sistema Distribuido de Reserva de Boletas
**Computación en Internet I (09810 - TIC) — Universidad Icesi**

Sistema distribuido de reserva de boletas de alta demanda que articula un backend multi-protocolo en **Java 17 con ZeroC Ice 3.7** y un frontend modular en **Vanilla JavaScript (ES6+) con Webpack 5**.

---

## 📹 Video Demostrativo (Screencast)
- **Enlace al Video:** *(Pega aquí el enlace a tu video de máximo 6 minutos)*

---

## 🏗️ Arquitectura del Sistema
- **Backend (`codigo_base/`):**
  - Servidor RPC multi-protocolo: TCP en puerto `10000` (pruebas nativas) y WebSocket en puerto `10002` (navegador).
  - Gestión de aforo de 90 sillas distribuidas en tres zonas (VIP, Platea y General).
  - *Thread-safety* y exclusión mutua garantizada mediante `synchronized` a nivel de silla y colecciones concurrentes (`ConcurrentHashMap`, `CopyOnWriteArrayList`), previniendo sobreventa.
- **Frontend (`client-js/`):**
  - Single Page Application (SPA) modular construida en JavaScript moderno (ES6+) sin frameworks.
  - Empaquetado profesional mediante Webpack 5 en el puerto `3000`.
  - Componentes desacoplados:
    - `SeatMap.js`: Plano visual interactivo del recinto y estados de ocupación.
    - `CartTimer.js`: Carrito de compras y temporizador reactivo de 90 segundos.
    - `CheckoutModal.js`: Formulario de pago y emisión de comprobante con código oficial `RES-XXXXXX`.

---

## 🚀 Instrucciones de Ejecución

### 1. Iniciar el Servidor Backend (Java)
```bash
cd codigo_base
.\gradlew.bat runServer
```
*El servidor iniciará escuchando en TCP 10000 y WebSocket 10002.*

### 2. Ejecutar la Prueba de Estrés de Concurrencia
```bash
cd codigo_base
.\gradlew.bat runClient
```
*Seleccionar la opción **7** para disparar 10 hilos simultáneos y verificar que solo 1 hilo obtiene el bloqueo (sin sobreventa).*

### 3. Iniciar el Frontend Web (Webpack)
```bash
cd client-js
npm start
```
*Abrir en el navegador en [http://localhost:3000](http://localhost:3000).*

### 4. Compilar Bundle para Producción
```bash
cd client-js
npm run build
```
*Genera los archivos optimizados en `client-js/dist/`.*
