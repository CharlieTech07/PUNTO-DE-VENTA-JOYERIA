import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuComponent } from '../../components/menu/menu';
import { DeepLTranslationService } from '../../services/deepl-translation.service';
import { LanguageService, Lang } from '../../services/lenguage.service';
import { InventarioService } from '../../services/inventario_sucursal.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { CarritoService } from '../../services/carrito.service';
import { VentasComponent } from '../ventas/ventas';

export interface ProductoVisual {
  id: number;
  id_inventario: number;
  id_sucursal: number;
  nombre_sucursal?: string;
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  imagen_base64?: string;
  stock?: number; // solo viene cuando se carga el inventario de una sucursal
}

type CampoTraducible = 'descripcion' | 'tipo_metal';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, UpperCasePipe, FormsModule, RouterLink, MenuComponent, TranslatePipe, VentasComponent],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly language = inject(LanguageService);
  private readonly deepL = inject(DeepLTranslationService);
  private readonly inventarioService = inject(InventarioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly carrito = inject(CarritoService);
  private readonly translatedProducts = new Map<number, Partial<Record<CampoTraducible, string>>>();

  public terminoBusqueda = '';
  public products: ProductoVisual[] = [];
  public cargando = true;
  public errorCarga = false;
  public nombreSucursal = '';
  public esAdmin = false;

  ngOnInit(): void {
    this.language.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => this.updateCatalogTranslations(lang));
    this.cargarVitrina();
  }

  public productText(product: ProductoVisual, field: CampoTraducible): string {
    return this.translatedProducts.get(product.id)?.[field] ?? product[field];
  }

  public imagenProducto(product: ProductoVisual): string {
    const imagen = product.imagen_base64?.trim();
    const indiceProducto = this.products.indexOf(product);
    const base64Normalizado = imagen
      ?.replace(/^data:image\/[^,]+;base64,/i, '')
      .replace(/\s/g, '');
    const yaSeMostro = !!base64Normalizado && indiceProducto > 0 &&
      this.products.slice(0, indiceProducto).some(otro =>
        otro.imagen_base64
          ?.replace(/^data:image\/[^,]+;base64,/i, '')
          .replace(/\s/g, '') === base64Normalizado
      );

    if (imagen && !yaSeMostro) {
      return imagen.startsWith('data:image/')
        ? imagen
        : `data:image/jpeg;base64,${imagen}`;
    }

    return this.imagenLocalProducto(product);
  }

  public recuperarImagenProducto(event: Event, product: ProductoVisual): void {
    const imagen = event.currentTarget as HTMLImageElement | null;
    if (!imagen || imagen.dataset['respaldoAplicado'] === 'true') {
      return;
    }

    imagen.dataset['respaldoAplicado'] = 'true';
    imagen.src = this.imagenLocalProducto(product);
  }

  public cargarVitrina(): void {
    this.cargando = true;
    this.errorCarga = false;
    const usuario = this.authService.obtenerUsuario();

    // Gerente y Cajero: su sucursal. Administrador: todas las sucursales.
    this.esAdmin = usuario?.rol === 'Administrador';
    this.nombreSucursal = this.esAdmin ? '' : (usuario?.nombre_sucursal ?? '');

    this.inventarioService.getMiInventario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: productos => {
          this.products = productos;
          this.translatedProducts.clear();
          this.cargando = false;
          this.updateCatalogTranslations(this.language.lang);
          this.changeDetector.detectChanges();
        },
        error: err => {
          console.error('Error al cargar el inventario:', err);
          this.cargando = false;
          // Token vencido o inválido: se regresa al login
          if (err.status === 401) {
            this.authService.cerrarSesion();
            this.router.navigate(['/login'], { replaceUrl: true });
            return;
          }
          this.errorCarga = true;
          this.changeDetector.detectChanges();
        }
      });
  }

  public get productosFiltrados(): ProductoVisual[] {
    const query = this.terminoBusqueda.trim().toLocaleLowerCase();
    if (!query) {
      return this.products;
    }

    return this.products.filter(product =>
      product.nombre.toLocaleLowerCase().includes(query) ||
      product.tipo_metal.toLocaleLowerCase().includes(query) ||
      product.descripcion.toLocaleLowerCase().includes(query)
    );
  }

  public agregarAlCarrito(product: ProductoVisual): void {
    const resultado = this.carrito.agregar(product);
    if (resultado === 'otra-sucursal') {
      alert(this.language.t('Una venta solo puede incluir piezas de una sucursal. Vacía el carrito para cambiar de sucursal.'));
      return;
    }
    if (resultado === 'sin-existencias') {
      alert(this.language.t('No hay más existencias disponibles para esta pieza.'));
    }
  }

  private imagenLocalProducto(product: ProductoVisual): string {
    const texto = `${product.nombre} ${product.descripcion} ${product.tipo_metal}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
    const esPlata = /\b(plata|silver)\b|\.925/.test(texto);

    if (/\b(argolla|alianza|matrimonial|boda|wedding)\b/.test(texto)) {
      return '/argolla-matrimonial.jpg';
    }

    if (/\b(pulsera|brazalete|esclava)\b/.test(texto)) {
      if (/torzal|rope/.test(texto)) {
        return '/pulsera-torzal-oro.jpg';
      }
      return esPlata ? '/cadena-plata.jpg' : '/pulsera-oro.jpg';
    }

    if (/\b(cadena|chain)\b/.test(texto) && esPlata) {
      return '/cadena-plata.jpg';
    }

    if (/\b(arete|aretes|pendiente|pendientes|arracada|arracadas)\b/.test(texto)) {
      return esPlata
        ? '/pendientes-de-novia-estilo-vintage-en-plata-.jpg'
        : '/pendientes.webp';
    }

    if (/\b(cadena|collar|gargantilla|dije|medalla)\b/.test(texto)) {
      if (/\brubi\b|\bruby\b/.test(texto)) {
        return '/collar-rubi.jpg';
      }
      if (/\b(perla|pearls?)\b/.test(texto)) {
        return '/collar-perlas.jpg';
      }
      if (/diamante|diamond/.test(texto)) {
        return '/collar-diamantes.jpg';
      }
      return /turquesa|turquoise/.test(texto) ? '/colla.webp' : '/collar2.webp';
    }

    if (/\b(anillo|argolla|alianza|solitario)\b/.test(texto)) {
      return '/anillo.webp';
    }

    return '/anillo.webp';
  }

  private updateCatalogTranslations(lang: Lang): void {
    this.translatedProducts.clear();
    if (lang !== 'en' || this.products.length === 0) {
      return;
    }

    const entries = this.products.flatMap(product => [
      { id: product.id, field: 'tipo_metal' as const, text: product.tipo_metal },
      { id: product.id, field: 'descripcion' as const, text: product.descripcion }
    ]).filter(entry => !!entry.text?.trim());

    this.deepL.translateMany(entries.map(entry => entry.text))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(translations => {
        if (this.language.lang !== 'en') {
          return;
        }

        entries.forEach((entry, index) => {
          const translated = this.translatedProducts.get(entry.id) ?? {};
          translated[entry.field] = translations[index] ?? entry.text;
          this.translatedProducts.set(entry.id, translated);
        });
        this.changeDetector.markForCheck();
      });
  }
}
