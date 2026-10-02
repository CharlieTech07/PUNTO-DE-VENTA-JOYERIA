import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MenuComponent } from '../../components/menu/menu';

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
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MenuComponent], // <-- Agrégalo aquí
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  public products: Product[] = [
    {
      id: 1,
      category: 'ANILLO SOLITARIO',
      name: 'Éclat de la Rose',
      description: '1.2 ct - Oro blanco 18k',
      price: 48200,
      // Imagen funcional de anillo
      imageUrl: 'anillo.webp'
    },
    {
      id: 2,
      category: 'COLGANTE',
      name: 'Larme Dorée',
      description: 'Pera 0.8 ct - Oro amarillo',
      price: 32900,
      // Imagen funcional de colgante
      imageUrl: 'colla.webp'
    },
    {
      id: 3,
      category: 'PENDIENTES',
      name: 'Aurore Éternelle',
      description: 'Halo 0.5 ct c/u - Oro amarillo',
      price: 21400,
      imageUrl: 'pendientes.webp'
    },
    {
      id: 4,
      category: 'ANILLO SOLITARIO',
      name: "Lumière d'Amour",
      description: '1.5 ct - Oro blanco 18k',
      price: 55000,
      imageUrl: 'anillo2.webp'
    },
    {
      id: 5,
      category: 'COLGANTE',
      name: 'Goutte de Ciel',
      description: 'Zafiro y diamantes - Oro blanco',
      price: 41200,
      imageUrl: 'collar2.webp'
    },
    {
      id: 6,
      category: 'PENDIENTES',
      name: 'Étoile Brillante',
      description: '0.3 ct c/u - Oro amarillo',
      price: 18500,
      imageUrl: 'pendientes-de-novia-estilo-vintage-en-plata-.jpg'
    },
    {
      id: 7,
      category: 'COLLAR',
      name: 'Braise Royale',
      description: 'Rubí cojín 5.2 ct - Oro blanco 18k',
      price: 86400,
      imageUrl: 'collar-rubi.jpg'
    },
    {
      id: 8,
      category: 'COLLAR',
      name: 'Cascade Royale',
      description: 'Diamante pera 3.8 ct - Oro blanco 18k',
      price: 124900,
      imageUrl: 'collar-diamantes.jpg'
    },
    {
      id: 9,
      category: 'COLLAR',
      name: 'Clair de Lune',
      description: 'Perlas Akoya tres hilos - Oro blanco 18k',
      price: 57800,
      imageUrl: 'collar-perlas.jpg'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  public agregarAlCarrito(product: Product): void {
    console.log('Producto agregado:', product);
  }
}