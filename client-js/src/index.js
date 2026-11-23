// @ts-check
import './styles/main.css';
import { iceService } from './services/iceBookingService.js';
import { SeatMap } from './components/SeatMap.js';
import { CartTimer } from './components/CartTimer.js';
import { CheckoutModal } from './components/CheckoutModal.js';

/** @type {SeatMap | null} */
let seatMapComponent = null;

/** @type {CartTimer | null} */
let cartTimerComponent = null;

/** @type {CheckoutModal | null} */
let checkoutModalComponent = null;

/** @type {Array<any>} */
let currentSeats = [];

/**
 * Muestra una notificación emergente sencilla en pantalla
 * @param {string} message 
 * @param {'info' | 'success' | 'error'} type 
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Consulta el estado más reciente del servidor Java y actualiza los componentes
 */
async function refreshData() {
  try {
    const [info, seats] = await Promise.all([
      iceService.getEventInfo(),
      iceService.getAllSeats()
    ]);

    currentSeats = seats || [];

    // 1. Actualizar números en los indicadores superiores (KPIs)
    updateHeaderKpis(info);

    // 2. Redibujar el mapa de sillas con los nuevos estados
    if (seatMapComponent) {
      seatMapComponent.render(currentSeats, iceService.getClientId());
    }

    // 3. Filtrar mis sillas bloqueadas y actualizar el carrito
    if (cartTimerComponent) {
      const mySeats = currentSeats.filter(s => {
        const stateVal = (s.state && s.state.value !== undefined) ? s.state.value : s.state;
        return stateVal === 1 && s.lockedByClientId === iceService.getClientId();
      });
      cartTimerComponent.update(mySeats);
    }
  } catch (err) {
    console.error('[App] Error al refrescar datos:', err);
  }
}

/**
 * Actualiza los contadores de aforo en la barra superior
 * @param {any} info 
 */
function updateHeaderKpis(info) {
  const availEl = document.getElementById('kpi-available');
  const lockedEl = document.getElementById('kpi-locked');
  const bookedEl = document.getElementById('kpi-booked');
  if (availEl) availEl.textContent = String(info.availableSeats);
  if (lockedEl) lockedEl.textContent = String(info.lockedSeats);
  if (bookedEl) bookedEl.textContent = String(info.bookedSeats);
}

/**
 * Manejador del clic en una silla desde el mapa
 * @param {any} seat 
 */
async function handleSeatClick(seat) {
  const stateVal = (seat.state && seat.state.value !== undefined) ? seat.state.value : seat.state;
  const isMine = (seat.lockedByClientId === iceService.getClientId());

  try {
    if (stateVal === 0) {
      // Estado Disponible -> Bloquear en Java
      console.log(`[App] Bloqueando silla ${seat.id}...`);
      await iceService.lockSeat(seat.id);
      showToast(`Silla ${seat.id} apartada por 90 segundos.`, 'success');
      await refreshData();
    } else if (stateVal === 1 && isMine) {
      // Estado Bloqueada por mí -> Liberar voluntariamente
      console.log(`[App] Liberando silla ${seat.id}...`);
      await iceService.releaseSeat(seat.id);
      showToast(`Silla ${seat.id} liberada.`, 'info');
      await refreshData();
    }
  } catch (err) {
    console.error(`[App] Error en operación sobre silla ${seat.id}:`, err);
    const msg = (err && typeof err.ice_name === 'function') ? err.ice_name() : (err.message || String(err));
    showToast(`No se pudo procesar la silla ${seat.id}: ${msg}`, 'error');
    await refreshData();
  }
}

async function main() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2>Iniciando conexión con Icesi Live Arena (ZeroC Ice WebSocket)...</h2>
    </div>
  `;

  try {
    // 1. Conectar por WebSocket a Java
    await iceService.connect();

    // 2. Obtener datos iniciales
    const info = await iceService.getEventInfo();
    const seats = await iceService.getAllSeats();
    currentSeats = seats;

    // 3. Montar la estructura HTML base de la aplicación
    app.innerHTML = `
      <!-- Encabezado con información del evento y contadores -->
      <header class="app-header">
        <div class="header-inner">
          <div class="header-branding">
            <div class="logo-circle">ILA</div>
            <div class="header-titles">
              <h1>${info.name}</h1>
              <p>${info.venue} • ${info.date}</p>
            </div>
          </div>
          <div class="header-kpis">
            <div class="kpi-card status-online">
              <div class="kpi-label">Servidor</div>
              <div class="kpi-value"><span class="pulse-dot"></span> Online</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Disponibles</div>
              <div class="kpi-value" id="kpi-available" style="color: var(--icesi-green);">${info.availableSeats}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Bloqueadas</div>
              <div class="kpi-value" id="kpi-locked" style="color: var(--icesi-orange);">${info.lockedSeats}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Vendidas</div>
              <div class="kpi-value" id="kpi-booked" style="color: #6b7280;">${info.bookedSeats}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Layout principal en dos columnas -->
      <main class="main-content">
        <!-- Columna Izquierda: Mapa de Sillas interactivo -->
        <section id="seat-map-container"></section>

        <!-- Columna Derecha: Panel de Carrito y Temporizador -->
        <aside id="cart-container" class="cart-sidebar"></aside>
      </main>
    `;

    // 4. Instanciar y renderizar el componente SeatMap
    const mapContainer = document.getElementById('seat-map-container');
    if (mapContainer) {
      seatMapComponent = new SeatMap(mapContainer, {
        onSeatClick: handleSeatClick
      });
      seatMapComponent.render(currentSeats, iceService.getClientId());
    }

    // 5. Instanciar el componente CartTimer
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) {
      cartTimerComponent = new CartTimer(cartContainer, {
        onReleaseSeat: async (seatId) => {
          try {
            await iceService.releaseSeat(seatId);
            showToast(`Silla ${seatId} liberada.`, 'info');
            await refreshData();
          } catch (err) {
            console.error(err);
          }
        },
        onCheckout: () => {
          // Abrir modal de checkout con mis sillas actuales
          const mySeats = currentSeats.filter(s => {
            const stateVal = (s.state && s.state.value !== undefined) ? s.state.value : s.state;
            return stateVal === 1 && s.lockedByClientId === iceService.getClientId();
          });

          if (mySeats.length > 0 && checkoutModalComponent) {
            checkoutModalComponent.open(mySeats);
          }
        },
        onTimeout: async () => {
          showToast('El tiempo de 90 segundos ha expirado. Sillas liberadas.', 'error');
          await refreshData();
        }
      });

      // Inicializar el carrito con las sillas de este cliente
      const mySeats = currentSeats.filter(s => {
        const stateVal = (s.state && s.state.value !== undefined) ? s.state.value : s.state;
        return stateVal === 1 && s.lockedByClientId === iceService.getClientId();
      });
      cartTimerComponent.update(mySeats);
    }

    // 6. Instanciar el Modal de Checkout
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      checkoutModalComponent = new CheckoutModal(modalContainer, {
        onConfirm: async (name, email) => {
          const mySeats = currentSeats.filter(s => {
            const stateVal = (s.state && s.state.value !== undefined) ? s.state.value : s.state;
            return stateVal === 1 && s.lockedByClientId === iceService.getClientId();
          });
          const seatIds = mySeats.map(s => s.id);

          // Llamada RPC a Java confirmBooking
          const result = await iceService.confirmBooking(seatIds, name, email);
          return result;
        },
        onSuccess: async () => {
          showToast('¡Compra realizada con éxito!', 'success');
          await refreshData();
        }
      });
    }

    // 7. Sincronización periódica automática (cada 3 segundos)
    // Garantiza que si otra ventana aparta o compra una silla, se refleje en vivo
    setInterval(() => {
      refreshData();
    }, 3000);

  } catch (err) {
    console.error('[App] Error crítico de inicialización:', err);
    const detail = (err && typeof err.ice_name === 'function') ? err.ice_name() : (err.message || String(err));
    app.innerHTML = `
      <div style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 40px auto; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <h2> Error al conectar con el servidor ZeroC Ice</h2>
        <p><strong>Detalle:</strong> ${detail}</p>
        <p>Asegúrate de que el backend Java esté corriendo en el puerto 10002 (WebSocket).</p>
      </div>
    `;
  }
}

main();
