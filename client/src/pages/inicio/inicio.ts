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
      imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 2,
      category: 'COLGANTE',
      name: 'Larme Dorée',
      description: 'Pera 0.8 ct - Oro amarillo',
      price: 32900,
      // Imagen funcional de colgante
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 3,
      category: 'PENDIENTES',
      name: 'Aurore Éternelle',
      description: 'Halo 0.5 ct c/u - Oro amarillo',
      price: 21400,
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 4,
      category: 'ANILLO SOLITARIO',
      name: "Lumière d'Amour",
      description: '1.5 ct - Oro blanco 18k',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b4549e?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 5,
      category: 'COLGANTE',
      name: 'Goutte de Ciel',
      description: 'Zafiro y diamantes - Oro blanco',
      price: 41200,
      imageUrl: 'https://images.unsplash.com/photo-1599643477874-c5a5c11f24fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 6,
      category: 'PENDIENTES',
      name: 'Étoile Brillante',
      description: '0.3 ct c/u - Oro amarillo',
      price: 18500,
      imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  public agregarAlCarrito(product: Product): void {
    console.log('Producto agregado:', product);
  }
}