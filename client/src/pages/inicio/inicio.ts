import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Si usas componentes Standalone
import { Router } from '@angular/router';

export interface Product {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true, // Retirar si utilizas NgModules tradicionales
  imports: [CommonModule], // Retirar si utilizas NgModules tradicionales
  template: `
    <section class="inicio">
      <div class="products-grid">
        <article class="product-card" *ngFor="let product of products">
          <img [src]="product.imageUrl" [alt]="product.name" />
          <div class="product-info">
            <span class="category">{{ product.category }}</span>
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <div class="price-row">
              <strong>{{ product.price | currency:'USD':'symbol':'1.0-0' }}</strong>
              <button type="button" (click)="agregarAlCarrito(product)">Agregar</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: []
})
export class InicioComponent implements OnInit {
  public products: Product[] = [
    {
      id: 1,
      category: 'ANILLO SOLITARIO',
      name: 'Éclat de la Rose',
      description: '1.2 ct - Oro blanco 18k',
      price: 48200,
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b4549e?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 2,
      category: 'COLGANTE',
      name: 'Larme Dorée',
      description: 'Pera 0.8 ct - Oro amarillo',
      price: 32900,
      imageUrl: 'https://images.unsplash.com/photo-1599643477874-c5a5c11f24fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 3,
      category: 'PENDIENTES',
      name: 'Aurore Éternelle',
      description: 'Halo 0.5 ct c/u - Oro amarillo',
      price: 21400,
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Si más adelante consumes una API, aquí llamarías al servicio
  }

  public agregarAlCarrito(product: Product): void {
    console.log('Producto agregado:', product);
    // Lógica para conectar con un servicio de carrito o venta
  }
}