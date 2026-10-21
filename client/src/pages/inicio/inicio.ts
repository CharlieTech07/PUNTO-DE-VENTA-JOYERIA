import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuComponent } from '../../components/menu/menu';
import { DeepLTranslationService } from '../../services/deepl-translation.service';
import { LanguageService, Lang } from '../../services/lenguage.service';
import { ProductosService } from '../../services/productos.service';
import { TranslatePipe } from '../../services/translate.pipe';

export interface ProductoVisual {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  imagen_base64?: string;
}

type CampoTraducible = 'descripcion' | 'tipo_metal';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink, MenuComponent, TranslatePipe],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly language = inject(LanguageService);
  private readonly deepL = inject(DeepLTranslationService);
  private readonly productosService = inject(ProductosService);
  private readonly translatedProducts = new Map<number, Partial<Record<CampoTraducible, string>>>();

  public terminoBusqueda = '';
  public products: ProductoVisual[] = [];
  public cargando = true;
  public errorCarga = false;

  ngOnInit(): void {
    this.language.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => this.updateCatalogTranslations(lang));
    this.cargarVitrina();
  }

  public productText(product: ProductoVisual, field: CampoTraducible): string {
    return this.translatedProducts.get(product.id)?.[field] ?? product[field];
  }

  public cargarVitrina(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.productosService.getProductos()
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
          console.error('Error al cargar la vitrina de joyas:', err);
          this.errorCarga = true;
          this.cargando = false;
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
    console.log('Joya seleccionada para ticket:', product);
    alert(`"${product.nombre}" agregada al flujo de venta.`);
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
