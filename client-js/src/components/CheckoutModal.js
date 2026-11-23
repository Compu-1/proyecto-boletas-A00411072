// @ts-check

/**
 * Componente: Modal de Checkout y Comprobante Oficial de Compra
 * Responsabilidades simples:
 * 1. Abrir un formulario pidiendo Nombre y Correo del comprador.
 * 2. Llamar a la operación remota confirmBooking() en Java.
 * 3. Mostrar el comprobante con el código alfanumérico generado (RES-XXXXXX).
 */
export class CheckoutModal {
  /**
   * @param {HTMLElement} container - <div id="modal-container">
   * @param {Object} options
   * @param {(name: string, email: string) => Promise<any>} options.onConfirm - Ejecuta la compra en Java
   * @param {() => void} options.onSuccess - Refresca la interfaz tras la compra
   */
  constructor(container, { onConfirm, onSuccess }) {
    this.container = container;
    this.onConfirm = onConfirm;
    this.onSuccess = onSuccess;
  }

  /**
   * Abre el formulario para ingresar datos del comprador
   * @param {Array<any>} seats - Lista de sillas retenidas por el usuario
   */
  open(seats) {
    const total = seats.reduce((sum, s) => sum + s.price, 0);
    const seatNames = seats.map(s => s.id).join(', ');

    this.container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Confirmar Compra de Boletas</h3>
            <button type="button" class="modal-close-btn" id="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <!-- Resumen de lo que se va a comprar -->
            <div style="background: #f3f4f6; padding: 12px; margin-bottom: 16px; border: 1px solid var(--icesi-border);">
              <p style="font-size: 0.85rem;"><strong>Sillas seleccionadas:</strong> ${seatNames}</p>
              <p style="font-size: 0.85rem; margin-top: 4px;"><strong>Total a pagar:</strong> $${total.toLocaleString()} COP</p>
            </div>

            <!-- Formulario de contacto -->
            <form id="checkout-form">
              <div class="form-group">
                <label class="form-label" for="cust-name">Nombre Completo:</label>
                <input type="text" class="form-control" id="cust-name" placeholder="Ej. Juan Pérez" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="cust-email">Correo Electrónico:</label>
                <input type="email" class="form-control" id="cust-email" placeholder="juan@u.icesi.edu.co" required />
              </div>

              <div id="checkout-error" style="color: #dc2626; font-size: 0.82rem; margin-top: 8px; display: none;"></div>

              <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px;">
                <button type="button" class="btn btn-outline" id="btn-cancel" style="width: auto;">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btn-submit" style="width: auto;">Pagar y Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const close = () => this.close();
    this.container.querySelector('#modal-close')?.addEventListener('click', close);
    this.container.querySelector('#btn-cancel')?.addEventListener('click', close);

    // Manejar el envío del formulario
    const form = this.container.querySelector('#checkout-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('cust-name'));
      const emailInput = /** @type {HTMLInputElement} */ (document.getElementById('cust-email'));
      const errorEl = document.getElementById('checkout-error');
      const submitBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-submit'));

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (!name || !email) return;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';
        if (errorEl) errorEl.style.display = 'none';

        const result = await this.onConfirm(name, email);
        this.showVoucher(result, name, email);

        if (this.onSuccess) {
          this.onSuccess();
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pagar y Confirmar';
        const msg = (err && typeof err.ice_name === 'function') ? err.ice_name() : (err.message || String(err));
        if (errorEl) {
          errorEl.textContent = `Error: ${msg}`;
          errorEl.style.display = 'block';
        }
      }
    });
  }

  /**
   * Muestra la ventana con el código de reserva oficial emitido por el servidor
   */
  showVoucher(result, name, email) {
    const bookingCode = result.bookingCode || 'RES-OK';
    const seatsList = (result.seatIds || []).join(', ');
    const total = result.totalAmount || 0;

    this.container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">¡Compra Exitosa!</h3>
            <button type="button" class="modal-close-btn" id="modal-voucher-close">×</button>
          </div>
          <div class="modal-body" style="text-align: center;">
            <p style="color: #059669; font-weight: 700; margin-bottom: 8px;">
               Tus boletas han sido confirmadas en el sistema.
            </p>

            <!-- Comprobante / Voucher -->
            <div class="voucher-card">
              <div class="voucher-title">Código Oficial de Reserva</div>
              <div class="voucher-code">${bookingCode}</div>
              <p style="font-size: 0.8rem; color: var(--icesi-muted);">
                Guarda este código para el ingreso al evento.
              </p>
            </div>

            <!-- Resumen de compra -->
            <div style="text-align: left; background: #f9fafb; padding: 12px; border: 1px solid var(--icesi-border); font-size: 0.85rem;">
              <p><strong>Titular:</strong> ${name}</p>
              <p><strong>Correo:</strong> ${email}</p>
              <p><strong>Sillas:</strong> ${seatsList}</p>
              <p><strong>Monto Pagado:</strong> $${total.toLocaleString()} COP</p>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px; justify-content: center;">
              <button type="button" class="btn btn-primary" id="btn-done" style="width: 140px;">Finalizar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const finish = () => this.close();
    this.container.querySelector('#modal-voucher-close')?.addEventListener('click', finish);
    this.container.querySelector('#btn-done')?.addEventListener('click', finish);
  }


  close() {
    this.container.innerHTML = '';
  }
}
