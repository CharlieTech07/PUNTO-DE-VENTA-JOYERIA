/* Panel de administración Olimpo — interacción de la maqueta.

   El código fuente es dashboard.ts. El navegador carga dashboard.js, que se
   genera con "npx tsc -p ." dentro de esta carpeta: no edites el .js a mano.

   El menú lateral NO vive aquí: es el componente de components/menu/, que se
   monta solo con la etiqueta <script> del final del HTML. Este archivo solo
   se encarga de lo propio del dashboard: cambiar de sección, los filtros y
   la fecha. El cambio de modo claro/oscuro lo maneja el menú.

   Como el menú se monta después, sus botones todavía no existen cuando corre
   este archivo. Por eso la navegación se conecta hasta que el menú avisa con
   el evento "menu:listo". */

(function panelOlimpo(): void {
  /** Busca un elemento obligatorio y avisa claro si falta en el HTML. */
  function requerir<T extends Element>(selector: string): T {
    const elemento = document.querySelector<T>(selector);

    if (elemento === null) {
      throw new Error(`Falta el elemento "${selector}" en dashboard.html`);
    }

    return elemento;
  }

  /* ---------- Navegación entre secciones ---------- */

  /* Los enlaces del menú apuntan a dashboard.html#seccion. Si ya estamos
     en el dashboard, cambiar el # no recarga la página: solo dispara
     "hashchange" y aquí intercambiamos la sección. */
  function conectarNavegacion(menu: HTMLElement): void {
    const enlaces = Array.from(
      menu.querySelectorAll<HTMLAnchorElement>('[data-vista]'),
    );
    const vistas = Array.from(document.querySelectorAll<HTMLElement>('.vista'));
    const titulo = requerir<HTMLElement>('#tituloVista');

    function mostrarVista(nombre: string, moverArriba: boolean): void {
      // Si el # no corresponde a ninguna sección, caemos en el resumen
      const existe = vistas.some((vista) => vista.id === `vista-${nombre}`);
      const destino = existe ? nombre : 'resumen';

      for (const vista of vistas) {
        vista.classList.toggle('activa', vista.id === `vista-${destino}`);
      }

      let textoTitulo = 'Resumen';

      for (const enlace of enlaces) {
        const esteEsElActivo = enlace.dataset['vista'] === destino;
        enlace.classList.toggle('activo', esteEsElActivo);

        if (esteEsElActivo) {
          textoTitulo = enlace.dataset['titulo'] ?? textoTitulo;
        }
      }

      titulo.textContent = textoTitulo;

      if (moverArriba) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function seccionDelHash(): string {
      return window.location.hash.replace('#', '');
    }

    window.addEventListener('hashchange', () => {
      mostrarVista(seccionDelHash(), true);
    });

    // Al cargar no movemos el scroll: la página ya está arriba
    mostrarVista(seccionDelHash(), false);
  }

  /* ---------- Filtros de segmento (solo apariencia) ---------- */

  function conectarSegmentos(): void {
    const grupos = Array.from(
      document.querySelectorAll<HTMLElement>('.segmentos'),
    );

    for (const grupo of grupos) {
      grupo.addEventListener('click', (evento: MouseEvent) => {
        const elegido = evento.target;

        if (!(elegido instanceof HTMLButtonElement)) {
          return;
        }

        const botones = Array.from(
          grupo.querySelectorAll<HTMLButtonElement>('button'),
        );

        for (const boton of botones) {
          boton.classList.toggle('activo', boton === elegido);
        }
      });
    }
  }

  /* ---------- Fecha del encabezado ---------- */

  function mostrarFecha(): void {
    requerir<HTMLElement>('#fechaHoy').textContent =
      new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
  }

  // Esto no depende del menú
  conectarSegmentos();
  mostrarFecha();

  // Los botones del menú solo existen cuando el componente terminó de montarse
  document.addEventListener('menu:listo', (evento) => {
    const detalle = (evento as CustomEvent<{ menu: HTMLElement }>).detail;
    conectarNavegacion(detalle.menu);
  });
})();
