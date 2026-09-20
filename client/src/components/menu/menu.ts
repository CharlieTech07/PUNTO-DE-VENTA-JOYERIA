/* Menú lateral de administración — se monta solo.
 *
 * El código fuente es menu.ts. El navegador carga menu.js, que se genera con
 * "npx tsc -p ." dentro de esta carpeta: no edites el .js a mano.
 *
 * Para usarlo en tu pantalla basta UNA línea, antes de cerrar el <body>:
 *
 *   <script src="../../components/menu/menu.js" data-activo="ventas"></script>
 *
 * Eso trae el menú y sus estilos. No tienes que tocar tu CSS ni tu HTML:
 * el menú va en position: fixed y él mismo le deja el espacio a tu página.
 *
 * El atributo data-activo marca qué sección se ve seleccionada. Es opcional.
 *
 * Cuando termina de montarse dispara el evento "menu:listo", por si quieres
 * conectar los botones con tu propia lógica:
 *
 *   document.addEventListener('menu:listo', () => { ... });
 *
 * Cada botón trae data-vista con el nombre de su sección.
 *
 *
 * POR QUÉ EL MARCADO ESTÁ AQUÍ ADENTRO Y NO EN UN menu.html APARTE
 *
 * Se intentó tenerlo en un archivo aparte y traerlo con fetch, pero Live
 * Server le inyecta su script de recarga automática a todo lo que sirve
 * como .html. Al ser un fragmento sin </body>, esa inyección se atraganta y
 * CORTA el final del archivo: llegaban solo 3 de los 8 botones.
 *
 * Teniéndolo aquí no hay petición que se pueda corromper, el menú aparece
 * al instante y además la página hasta funciona abriéndola con doble clic. */

type TemaOlimpo = 'oscuro' | 'claro';

(function menuOlimpo(): void {
  // Hay que leerlo de inmediato: dentro de un callback ya vale null
  const etiqueta = document.currentScript as HTMLScriptElement | null;

  if (etiqueta === null) {
    console.error('[menú] Cárgalo con <script src="...">, no de otra forma.');
    return;
  }

  const urlBase = etiqueta.src;
  const seccionActiva = etiqueta.dataset['activo'] ?? '';

  const ICONO_SOL =
    '<circle cx="12" cy="12" r="4.2" />' +
    '<path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />';

  const ICONO_LUNA = '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />';

  const MARCADO = `
<aside class="menu-olimpo">
  <div class="menu-olimpo__marca">
    <img class="menu-olimpo__emblema" data-logo alt="Emblema de Joyería Olimpo" />
    <div class="menu-olimpo__nombre">Olimpo</div>
    <div class="menu-olimpo__rol">Administración</div>
  </div>

  <div class="menu-olimpo__titulo menu-olimpo__etiqueta">Secciones</div>

  <nav class="menu-olimpo__lista">
    <a class="menu-olimpo__item" data-vista="home" data-titulo="Home"
       data-destino="../../pages/inicio/index.html">
      <svg viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20a1 1 0 001 1h11a1 1 0 001-1V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
      <span class="menu-olimpo__texto">Home</span>
    </a>

    <a class="menu-olimpo__item" data-vista="resumen" data-titulo="Resumen"
       data-destino="../../pages/dashboard/dashboard.html#resumen">
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
      <span class="menu-olimpo__texto">Resumen</span>
    </a>

    <a class="menu-olimpo__item" data-vista="ventas" data-titulo="Ventas"
       data-destino="../../pages/dashboard/dashboard.html#ventas">
      <svg viewBox="0 0 24 24">
        <path d="M6 2 L3 7 v13 a1 1 0 001 1h16a1 1 0 001-1V7l-3-5z" />
        <path d="M3 7h18" />
        <path d="M16 11a4 4 0 01-8 0" />
      </svg>
      <span class="menu-olimpo__texto">Ventas</span>
    </a>

    <a class="menu-olimpo__item" data-vista="ingresos" data-titulo="Ingresos"
       data-destino="../../pages/dashboard/dashboard.html#ingresos">
      <svg viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 7-7" />
        <path d="M14 8h6v6" />
      </svg>
      <span class="menu-olimpo__texto">Ingresos</span>
    </a>

    <a class="menu-olimpo__item" data-vista="inventario" data-titulo="Inventario"
       data-destino="../../pages/dashboard/dashboard.html#inventario">
      <svg viewBox="0 0 24 24">
        <path d="M6 3h12l3 6-9 12L3 9z" />
        <path d="M3 9h18" />
        <path d="M12 3l-3 6 3 12 3-12-3-6z" />
      </svg>
      <span class="menu-olimpo__texto">Inventario</span>
      <em class="menu-olimpo__insignia">8</em>
    </a>

    <a class="menu-olimpo__item" data-vista="apartados" data-titulo="Apartados"
       data-destino="../../pages/dashboard/dashboard.html#apartados">
      <svg viewBox="0 0 24 24">
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
      </svg>
      <span class="menu-olimpo__texto">Apartados</span>
      <em class="menu-olimpo__insignia">3</em>
    </a>

    <a class="menu-olimpo__item" data-vista="empleados" data-titulo="Empleados"
       data-destino="../../pages/dashboard/dashboard.html#empleados">
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3.4" />
        <path d="M2.5 20a6.5 6.5 0 0113 0" />
        <path d="M16 5.5a3.4 3.4 0 010 5.6" />
        <path d="M17.5 14.2A6.5 6.5 0 0121.5 20" />
      </svg>
      <span class="menu-olimpo__texto">Empleados</span>
    </a>

    <a class="menu-olimpo__item" data-vista="metal" data-titulo="Precio del metal"
       data-destino="../../pages/dashboard/dashboard.html#metal">
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M5 7l-2.5 6a3.2 3.2 0 005 0z" />
        <path d="M19 7l-2.5 6a3.2 3.2 0 005 0z" />
        <path d="M8 21h8" />
      </svg>
      <span class="menu-olimpo__texto">Precio del metal</span>
    </a>

    <a class="menu-olimpo__item" data-vista="auditoria" data-titulo="Bitácora de auditoría"
       data-destino="../../pages/dashboard/dashboard.html#auditoria">
      <svg viewBox="0 0 24 24">
        <path d="M12 2.5l8 3.2v6.1c0 4.7-3.3 8.4-8 9.7-4.7-1.3-8-5-8-9.7V5.7z" />
        <path d="M9 12l2 2 4-4.5" />
      </svg>
      <span class="menu-olimpo__texto">Auditoría</span>
    </a>
  </nav>

  <div class="menu-olimpo__pie">
    <div class="menu-olimpo__usuario">
      <div class="menu-olimpo__etiqueta">Administra la casa</div>
      <div class="menu-olimpo__usuario-nombre">Doña Valentina Ruiz</div>
    </div>

    <button class="menu-olimpo__accion" data-accion="tema">
      <svg viewBox="0 0 24 24" data-icono="tema">${ICONO_SOL}</svg>
      <span data-texto="tema">Modo claro</span>
    </button>

    <button class="menu-olimpo__accion menu-olimpo__accion--tenue" data-accion="volver">
      <svg viewBox="0 0 24 24">
        <path d="M14 6l-6 6 6 6" />
      </svg>
      <span>Volver al POS</span>
    </button>
  </div>
</aside>`;

  /** Resuelve rutas contra la ubicación de este script, no de la página.
   *  Así el menú funciona sin importar en qué carpeta esté quien lo usa. */
  function rutaDelComponente(archivo: string): string {
    return new URL(archivo, urlBase).href;
  }

  function enlazarEstilos(): void {
    const href = rutaDelComponente('menu.css');

    // Si la página ya lo trae por su cuenta, no lo repetimos
    const yaEsta = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ).some((link) => link.href === href);

    if (yaEsta) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  /** Convierte cada data-destino en un href absoluto. Así los enlaces
   *  funcionan igual desde cualquier pantalla, sin importar su carpeta. */
  function resolverEnlaces(menu: HTMLElement): void {
    const enlaces = Array.from(
      menu.querySelectorAll<HTMLAnchorElement>('[data-destino]'),
    );

    for (const enlace of enlaces) {
      const destino = enlace.dataset['destino'];

      if (destino !== undefined) {
        enlace.href = rutaDelComponente(destino);
      }
    }
  }

  function marcarSeccionActiva(menu: HTMLElement): void {
    if (seccionActiva === '') {
      return;
    }

    menu
      .querySelector<HTMLButtonElement>(`[data-vista="${seccionActiva}"]`)
      ?.classList.add('activo');
  }

  function conectarCambioDeTema(menu: HTMLElement): void {
    const boton = menu.querySelector<HTMLButtonElement>('[data-accion="tema"]');
    const texto = menu.querySelector<HTMLElement>('[data-texto="tema"]');
    const icono = menu.querySelector<SVGSVGElement>('[data-icono="tema"]');

    if (boton === null || texto === null || icono === null) {
      return;
    }

    boton.addEventListener('click', () => {
      const eraOscuro = document.documentElement.dataset['tema'] !== 'claro';
      const nuevoTema: TemaOlimpo = eraOscuro ? 'claro' : 'oscuro';

      document.documentElement.dataset['tema'] = nuevoTema;
      texto.textContent = eraOscuro ? 'Modo oscuro' : 'Modo claro';
      icono.innerHTML = eraOscuro ? ICONO_LUNA : ICONO_SOL;
    });
  }

  function montar(): void {
    enlazarEstilos();

    const contenedor = document.createElement('div');
    contenedor.innerHTML = MARCADO;

    const menu = contenedor.querySelector<HTMLElement>('.menu-olimpo');

    if (menu === null) {
      console.error('[menú] El marcado no trae el elemento .menu-olimpo');
      return;
    }

    // El logo se resuelve contra el componente, no contra la página
    const emblema = menu.querySelector<HTMLImageElement>('[data-logo]');

    if (emblema !== null) {
      emblema.src = rutaDelComponente('../../../public/logo.png');
    }

    document.body.insertBefore(menu, document.body.firstChild);
    document.body.classList.add('menu-olimpo-activo');

    resolverEnlaces(menu);
    marcarSeccionActiva(menu);
    conectarCambioDeTema(menu);

    document.dispatchEvent(new CustomEvent('menu:listo', { detail: { menu } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
