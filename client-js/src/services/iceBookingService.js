// @ts-check
import { Ice } from 'ice';
import '../generated/BookingService.js';

// En ZeroC Ice para navegador, el módulo Slice se registra en window y en el ModuleRegistry de Ice
const BookingApp = (typeof window !== 'undefined' && window.BookingApp)
  ? window.BookingApp
  : Ice._ModuleRegistry.module('BookingApp');

class IceBookingService {
  constructor() {
    this.communicator = null;
    this.proxy = null;
    this.clientId = this.initClientId();
    this.isConnected = false;
  }

  /**
   * Genera o recupera un ID único para la sesión del navegador
   */
  initClientId() {
    let id = sessionStorage.getItem('ice_booking_client_id');
    if (!id) {
      id = 'WEB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      sessionStorage.setItem('ice_booking_client_id', id);
    }
    return id;
  }

  getClientId() {
    return this.clientId;
  }

  /**
   * Conecta con el servidor ZeroC Ice por WebSocket (puerto 10002)
   */
  async connect() {
    if (this.proxy && this.isConnected) {
      return this.proxy;
    }

    try {
      const host = (window.location.hostname === 'localhost' || !window.location.hostname) ? '127.0.0.1' : window.location.hostname;
      const wsPort = 10002;
      const proxyStr = `BookingService:ws -h ${host} -p ${wsPort}`;

      console.log(`[Ice] Conectando a ${proxyStr}...`);

      const initData = new Ice.InitializationData();
      initData.properties = Ice.createProperties();
      initData.properties.setProperty('Ice.MessageSizeMax', '4096');

      // 1. Inicializar el Communicator de Ice
      this.communicator = Ice.initialize(initData);

      // 2. Crear el proxy base con la cadena de conexión WebSocket
      const base = this.communicator.stringToProxy(proxyStr);

      // 3. Hacer checkedCast para verificar que el servicio remoto implementa BookingService
      this.proxy = await BookingApp.BookingServicePrx.checkedCast(base);
      if (!this.proxy) {
        throw new Error('No se pudo obtener el proxy remoto de BookingService.');
      }

      this.isConnected = true;
      console.log('[Ice] Conexión establecida con éxito con BookingService (WS:10002).');
      return this.proxy;
    } catch (err) {
      this.isConnected = false;
      console.error('[Ice] Error de conexión:', err);
      throw err;
    }
  }

  async getProxy() {
    if (!this.proxy || !this.isConnected) {
      await this.connect();
    }
    return this.proxy;
  }

  // Métodos remotos RPC (devuelven Promises nativas)
  async getEventInfo() {
    const prx = await this.getProxy();
    return await prx.getEventInfo();
  }

  async getAllSeats() {
    const prx = await this.getProxy();
    return await prx.getAllSeats();
  }

  async lockSeat(seatId) {
    const prx = await this.getProxy();
    return await prx.lockSeat(seatId, this.clientId);
  }

  async releaseSeat(seatId) {
    const prx = await this.getProxy();
    return await prx.releaseSeat(seatId, this.clientId);
  }

  async confirmBooking(seatIds, customerName, customerEmail) {
    const prx = await this.getProxy();
    return await prx.confirmBooking(seatIds, this.clientId, customerName, customerEmail);
  }

  async getMyLockedSeats() {
    const prx = await this.getProxy();
    return await prx.getMyLockedSeats(this.clientId);
  }

  async getMyBookings() {
    const prx = await this.getProxy();
    return await prx.getMyBookings(this.clientId);
  }
}


export const iceService = new IceBookingService();
export { BookingApp };