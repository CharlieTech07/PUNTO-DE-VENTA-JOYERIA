// client/src/services/carrito.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

// Lo mínimo que necesita el ticket de una pieza de la vitrina
export interface PiezaParaTicket {
  id: number; // id del producto
  id_inventario: number;
  id_sucursal?: number | null;
  nombre_sucursal?: string;
  nombre: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number | string;
  stock?: number | string;
}

export interface ItemCarrito {
  id_producto: number;
  id_inventario: number;
  id_sucursal: number | null;
  nombre_sucursal: string;
  nombre: string;
  tipo_metal: string;
  kilataje: string;
  precio_unitario: number; // el precio de la vitrina al momento de agregarla
  cantidad: number;
  stock: number;
}

export type ResultadoAgregar = 'agregado' | 'sin-existencias' | 'otra-sucursal';

// Los precios de la vitrina ya traen IVA: en México el precio al público lo incluye.
// Para el ticket y la factura solo se desglosa: subtotal + IVA = total.
export const IVA = 0.16;
const redondear = (n: number) => Math.round(n * 100) / 100;
export const sinIva = (importeConIva: number) => redondear(importeConIva / (1 + IVA));

interface EstadoCarrito {
  idUsuario: string | number | null;
  items: ItemCarrito[];
}

// Lista de piezas que el cajero va juntando antes de cobrar.
// La venta y la factura salen de aquí: items() y total().
@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // sessionStorage y no localStorage: el ticket sobrevive a una recarga,
  // pero se borra al cerrar la pestaña
  private readonly CLAVE = 'olimpo:carrito';
  private readonly authService = inject(AuthService);

  private readonly estado = signal<EstadoCarrito>(this.leerGuardado());

  readonly items = computed(() => this.estado().items);
  readonly vacio = computed(() => this.items().length === 0);
  readonly totalPiezas = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0)
  );
  readonly total = computed(() =>
    this.items().reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0)
  );
  // Se suma renglón por renglón, igual que los conceptos de la factura,
  // y el IVA es lo que falta para llegar al total exacto
  readonly subtotal = computed(() =>
    redondear(this.items().reduce((suma, item) => suma + sinIva(item.precio_unitario * item.cantidad), 0))
  );
  readonly iva = computed(() => redondear(this.total() - this.subtotal()));
  // Un ticket es de una sola sucursal: la de la primera pieza
  readonly sucursal = computed(() => this.items()[0]?.nombre_sucursal ?? '');

  agregar(pieza: PiezaParaTicket): ResultadoAgregar {
    this.sincronizarConSesion();

    const stock = Number(pieza.stock ?? 0);
    const id_sucursal = pieza.id_sucursal ?? null;
    const items = this.items();

    if (items.length > 0 && items[0].id_sucursal !== id_sucursal) {
      return 'otra-sucursal';
    }

    const existente = items.find(item => item.id_inventario === pieza.id_inventario);
    if ((existente?.cantidad ?? 0) >= stock) {
      return 'sin-existencias';
    }

    if (existente) {
      this.cambiarCantidad(pieza.id_inventario, existente.cantidad + 1);
      return 'agregado';
    }

    this.guardar({
      idUsuario: this.authService.obtenerUsuario()?.id ?? null,
      items: [...items, {
        id_producto: pieza.id,
        id_inventario: pieza.id_inventario,
        id_sucursal,
        nombre_sucursal: pieza.nombre_sucursal ?? '',
        nombre: pieza.nombre,
        tipo_metal: pieza.tipo_metal,
        kilataje: pieza.kilataje,
        // Postgres manda los NUMERIC como texto
        precio_unitario: Number(pieza.precio_venta),
        cantidad: 1,
        stock
      }]
    });
    return 'agregado';
  }

  aumentar(id_inventario: number): void {
    const item = this.buscar(id_inventario);
    if (item && item.cantidad < item.stock) {
      this.cambiarCantidad(id_inventario, item.cantidad + 1);
    }
  }

  // Al llegar a cero la pieza sale del ticket
  disminuir(id_inventario: number): void {
    const item = this.buscar(id_inventario);
    if (!item) return;
    if (item.cantidad <= 1) {
      this.quitar(id_inventario);
    } else {
      this.cambiarCantidad(id_inventario, item.cantidad - 1);
    }
  }

  quitar(id_inventario: number): void {
    this.guardar({
      ...this.estado(),
      items: this.items().filter(item => item.id_inventario !== id_inventario)
    });
  }

  vaciar(): void {
    this.guardar({ idUsuario: null, items: [] });
  }

  cantidadDe(id_inventario: number): number {
    return this.buscar(id_inventario)?.cantidad ?? 0;
  }

  // Si entra otro usuario en la misma pestaña, no hereda el ticket del anterior
  sincronizarConSesion(): void {
    const dueno = this.estado().idUsuario;
    const actual = this.authService.obtenerUsuario()?.id ?? null;
    if (dueno !== null && dueno !== actual) {
      this.vaciar();
    }
  }

  private buscar(id_inventario: number): ItemCarrito | undefined {
    return this.items().find(item => item.id_inventario === id_inventario);
  }

  private cambiarCantidad(id_inventario: number, cantidad: number): void {
    this.guardar({
      ...this.estado(),
      items: this.items().map(item =>
        item.id_inventario === id_inventario ? { ...item, cantidad } : item
      )
    });
  }

  private guardar(estado: EstadoCarrito): void {
    this.estado.set(estado);
    try {
      sessionStorage.setItem(this.CLAVE, JSON.stringify(estado));
    } catch {}
  }

  private leerGuardado(): EstadoCarrito {
    try {
      const guardado = JSON.parse(sessionStorage.getItem(this.CLAVE) ?? 'null');
      if (guardado && Array.isArray(guardado.items)) {
        return guardado;
      }
    } catch {}
    return { idUsuario: null, items: [] };
  }
}
