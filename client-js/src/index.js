// @ts-check
import './styles/main.css';
import { iceService } from './services/iceBookingService.js';

async function main() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="font-family: sans-serif; padding: 30px;">
        <h2>Conectando con el servidor Java ZeroC Ice...</h2>
      </div>
    `;
  }

  try {
    // 1. Conectar por WebSocket
    await iceService.connect();
    console.log('[App] Conectado exitosamente');

    // 2. Llamada RPC remota a getEventInfo()
    const info = await iceService.getEventInfo();
    console.log('[App] Información del Evento recibida de Java:', info);

    // 3. Llamada RPC remota a getAllSeats()
    const seats = await iceService.getAllSeats();
    console.log('[App] Asientos recibidos de Java:', seats);

    // 4. Renderizar la respuesta real en pantalla
    if (app) {
      app.innerHTML = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #5454e9;"> ¡Conexión RPC Exitosa con Java!</h1>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 5px solid #5454e9;">
            <h2 style="margin-top: 0;">${info.name}</h2>
            <p><strong>Lugar:</strong> ${info.venue}</p>
            <p><strong>Fecha:</strong> ${info.date}</p>
            <p><strong>Aforo Total:</strong> ${info.totalSeats} sillas</p>
            <p><strong>Disponibles:</strong> ${info.availableSeats} | <strong>Bloqueadas:</strong> ${info.lockedSeats} | <strong>Vendidas:</strong> ${info.bookedSeats}</p>
            <p><strong>Precios:</strong> VIP: $${info.vipPrice.toLocaleString()} COP | Platea: $${info.plateaPrice.toLocaleString()} COP | General: $${info.generalPrice.toLocaleString()} COP</p>
          </div>
          <p style="color: #059669; font-weight: bold; margin-top: 15px;">
             Se recibieron las ${seats.length} sillas correctamente desde el backend Java a través de WebSocket.
          </p>
        </div>
      `;
    }
  } catch (err) {
    console.error('[App] Error al comunicar con Java:', err);
    const detail = (err && typeof err.ice_name === 'function') ? err.ice_name() : (err.message || String(err));
    if (app) {
      app.innerHTML = `
        <div style="font-family: sans-serif; padding: 30px; color: #dc2626;">
          <h2> Error al conectar con el servidor ZeroC Ice</h2>
          <p><strong>Detalle del error:</strong> ${detail}</p>
          <p>Revisa también la consola del navegador (F12 -> Console).</p>
        </div>
      `;
    }
  }
}

main();