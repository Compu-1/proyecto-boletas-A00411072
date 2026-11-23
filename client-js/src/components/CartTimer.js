// @ts-check

export class CartTimer {
  /**
   * @param {HTMLElement} container - Contenedor en el HTML (<aside id="cart-container">)
   * @param {Object} options
   * @param {(seatId: string) => void} options.onReleaseSeat - Acción al quitar una silla
   * @param {() => void} options.onCheckout - Acción al presionar Confirmar Reserva
   * @param {() => void} options.onTimeout - Acción cuando el reloj llega a 00:00
   */
  constructor(container, { onReleaseSeat, onCheckout, onTimeout }) {
    this.container = container;
    this.onReleaseSeat = onReleaseSeat;
    this.onCheckout = onCheckout;
    this.onTimeout = onTimeout;

    this.lockedSeats = [];
    this.timeLeft = 90;
    this.timerInterval = null;
  }

  /**
   * Actualiza las sillas en el carrito y arranca/detiene el reloj según corresponda
   * @param {Array<any>} mySeats - Sillas bloqueadas por este usuario
   */
  update(mySeats) {
    const hadSeats = this.lockedSeats.length > 0;
    this.lockedSeats = mySeats || [];
    const hasSeats = this.lockedSeats.length > 0;

    // Si no teníamos sillas y acabamos de agregar una, iniciamos el reloj en 90s
    if (!hadSeats && hasSeats) {
      this.startTimer(90);
    } else if (!hasSeats) {
      // Si el carrito quedó vacío, detenemos el reloj
      this.stopTimer();
      this.timeLeft = 90;
    }

    this.render();
  }

  /**
   * Inicia la cuenta regresiva de 1 en 1 segundo usando setInterval
   */
  startTimer(seconds) {
    this.stopTimer();
    this.timeLeft = seconds;

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerText();

      // Cuando llega a 0, detenemos y notificamos para liberar
      if (this.timeLeft <= 0) {
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout();
        }
      }
    }, 1000);
  }

  /**
   * Detiene el intervalo del reloj
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Formatea segundos a MM:SS (ejemplo: 90 -> "01:30")
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  /**
   * Actualiza solo el texto del reloj en el DOM sin redibujar todo
   */
  updateTimerText() {
    const digitsEl = this.container.querySelector('.timer-digits');
    if (digitsEl) {
      digitsEl.textContent = this.formatTime(this.timeLeft);
    }
  }

  /**
   * Dibuja el HTML del carrito
   */
  render() {
    const total = this.lockedSeats.reduce((sum, s) => sum + s.price, 0);
    const hasSeats = this.lockedSeats.length > 0;

    this.container.innerHTML = `
      <div class="sidebar-card">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem; font-weight: 700;">Tu Carrito de Compra</h3>

        <!-- Temporizador (visible solo cuando hay sillas seleccionadas) -->
        ${hasSeats ? `
          <div class="timer-box">
            <div class="timer-info">
              <span>Tiempo restante</span>
              <p style="font-size: 0.75rem; margin-top: 2px;">Para confirmar compra</p>
            </div>
            <div class="timer-digits">${this.formatTime(this.timeLeft)}</div>
          </div>
        ` : ''}

        <!-- Lista de sillas apartadas -->
        <div class="cart-items-list">
          ${!hasSeats ? `
            <div class="cart-empty-message">
              <p>No tienes sillas seleccionadas.</p>
              <p style="font-size: 0.8rem; margin-top: 6px;">Haz clic en una silla disponible para comenzar.</p>
            </div>
          ` : this.lockedSeats.map(seat => `
            <div class="cart-item">
              <div>
                <div class="cart-item-title">Silla ${seat.id}</div>
                <div class="cart-item-sub">Fila ${seat.row} • Silla ${seat.number}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="cart-item-price">$${seat.price.toLocaleString()}</span>
                <button type="button" class="cart-item-remove" data-id="${seat.id}" title="Quitar silla">×</button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Total y botón para proceder al pago -->
        ${hasSeats ? `
          <div class="cart-summary">
            <div class="summary-row">
              <span class="summary-label">Total a pagar:</span>
              <span class="summary-total">$${total.toLocaleString()} COP</span>
            </div>
            <button type="button" class="btn btn-primary" id="btn-checkout">
              Confirmar Reserva (${this.lockedSeats.length})
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Vincular clic en la 'x' de cada silla para liberarla
    this.container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id && this.onReleaseSeat) {
          this.onReleaseSeat(id);
        }
      });
    });

    // Vincular clic en el botón 'Confirmar Reserva'
    const checkoutBtn = this.container.querySelector('#btn-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (this.onCheckout) {
          this.onCheckout();
        }
      });
    }
  }
}
