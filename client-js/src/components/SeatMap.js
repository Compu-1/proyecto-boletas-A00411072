// @ts-check

/**
 * Componente interactivo del mapa de sillas (SeatMap)
 * - Muestra el escenario y las zonas (VIP, Platea, General).
 * - Renderiza cada silla con su número y estado visual (Disponible, Seleccionada por mí, Bloqueada por otro, Vendida).
 * - Notifica mediante callback onSeatClick cuando el usuario hace clic en una silla disponible o en una de sus sillas seleccionadas.
 */
export class SeatMap {
  /**
   * @param {HTMLElement} container - Elemento del DOM donde se renderiza el mapa
   * @param {Object} options
   * @param {(seat: any) => void} options.onSeatClick - Función a ejecutar cuando se hace clic en una silla
   */
  constructor(container, { onSeatClick }) {
    this.container = container;
    this.onSeatClick = onSeatClick;
    this.seats = [];
    this.clientId = '';
  }

  /**
   * Actualiza los datos y redibuja el mapa de sillas
   * @param {Array<any>} seats - Lista de asientos devuelta por getAllSeats()
   * @param {string} clientId - ID único de este cliente
   */
  render(seats, clientId) {
    this.seats = seats || [];
    this.clientId = clientId;

    // Estructura oficial del evento: 3 Zonas, 9 Filas en total
    const zones = [
      { id: 'VIP', name: 'Zona VIP', price: '$120.000 COP', tagClass: 'zone-tag-vip', rows: ['A', 'B'] },
      { id: 'PLATEA', name: 'Zona Platea', price: '$75.000 COP', tagClass: 'zone-tag-platea', rows: ['C', 'D', 'E'] },
      { id: 'GENERAL', name: 'Zona General', price: '$45.000 COP', tagClass: 'zone-tag-general', rows: ['F', 'G', 'H', 'I'] }
    ];

    // Mapear los asientos por su ID para búsqueda rápida: "A-1" -> seat
    const seatsById = new Map();
    this.seats.forEach(s => seatsById.set(s.id, s));

    let zonesHtml = '';

    for (const zone of zones) {
      let rowsHtml = '';

      for (const rowLetter of zone.rows) {
        let seatsHtml = '';

        for (let num = 1; num <= 10; num++) {
          const seatId = `${rowLetter}-${num}`;
          const seat = seatsById.get(seatId);

          if (!seat) {
            seatsHtml += `<div class="seat-item seat-booked" title="No disponible">--</div>`;
            continue;
          }

          // Determinar estado: 0 = AVAILABLE, 1 = LOCKED, 2 = BOOKED
          const stateVal = (seat.state && seat.state.value !== undefined) ? seat.state.value : seat.state;
          const isMine = (seat.lockedByClientId === this.clientId);

          let stateClass = 'seat-available';
          let tooltip = `Silla ${seatId} - Disponible ($${seat.price.toLocaleString()} COP)`;

          if (stateVal === 2) {
            stateClass = 'seat-booked';
            tooltip = `Silla ${seatId} - Vendida`;
          } else if (stateVal === 1) {
            if (isMine) {
              stateClass = 'seat-selected';
              tooltip = `Silla ${seatId} - En tu carrito (Clic para liberar)`;
            } else {
              stateClass = 'seat-locked';
              tooltip = `Silla ${seatId} - Bloqueada temporalmente por otro comprador`;
            }
          }

          const isDisabled = (stateVal === 2) || (stateVal === 1 && !isMine);

          seatsHtml += `
            <button 
              type="button" 
              class="seat-item ${stateClass}" 
              data-seat-id="${seatId}" 
              title="${tooltip}"
              ${isDisabled ? 'disabled' : ''}
            >
              ${num}
            </button>
          `;
        }

        rowsHtml += `
          <div class="seat-row">
            <span class="row-label">${rowLetter}</span>
            <div class="row-seats-container">
              ${seatsHtml}
            </div>
            <span class="row-label">${rowLetter}</span>
          </div>
        `;
      }

      zonesHtml += `
        <div class="zone-group">
          <div class="zone-header">
            <span class="zone-name ${zone.tagClass}">● ${zone.name}</span>
            <span class="zone-price">${zone.price}</span>
          </div>
          <div class="zone-rows">
            ${rowsHtml}
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="seat-map-card">
        <div class="card-header-flex">
          <h2 class="card-title">Distribución del Escenario</h2>
          <span class="client-badge" title="Identificador de tu sesión actual">
            Tu Sesión: ${this.clientId.substring(0, 16)}...
          </span>
        </div>

        <!-- Tarima / Escenario -->
        <div class="stage-banner">
          TARIMA PRINCIPAL 
        </div>

        <!-- Zonas de sillas -->
        <div class="seat-zones">
          ${zonesHtml}
        </div>

        <!-- Convención de colores / Leyenda -->
        <div class="map-legend">
          <div class="legend-item">
            <span class="legend-badge" style="background: var(--seat-avail-bg); border: 1.5px solid var(--seat-avail-border);"></span>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge" style="background: var(--seat-selected-bg);"></span>
            <span>Tu selección</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge" style="background: var(--seat-locked-bg); border: 1.5px dashed var(--seat-locked-border);"></span>
            <span>Bloqueada (Otro)</span>
          </div>
          <div class="legend-item">
            <span class="legend-badge" style="background: var(--seat-booked-bg);"></span>
            <span>Vendida</span>
          </div>
        </div>
      </div>
    `;

    // Vincular eventos de clic en los botones de las sillas activas
    this.container.querySelectorAll('.seat-item:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const seatId = btn.getAttribute('data-seat-id');
        if (!seatId) return;
        const seat = seatsById.get(seatId);
        if (seat && this.onSeatClick) {
          this.onSeatClick(seat);
        }
      });
    });
  }
}
