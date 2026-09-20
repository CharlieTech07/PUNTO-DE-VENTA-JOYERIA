/* Menú lateral de administración — se monta solo.
 *
 * El código fuente es menu.ts. El navegador carga menu.js, que se genera con
 * "npx tsc -p ." dentro de esta carpeta: no edites el .js a mano.
 *
 * Para usarlo en tu pantalla basta UNA línea, al final del <body>:
 *
 *   <script src="../../components/menu/menu.js" data-activo="ventas"></script>
 *
 * Eso trae el menú y sus estilos. No tienes que tocar tu CSS ni tu HTML:
 * el menú va en position: fixed y él mismo le deja el espacio a tu página.
 *
 * El atributo data-activo marca qué sección se ve seleccionada. Es opcional.
 *
 * Cuando el menú termina de montarse dispara el evento "menu:listo", por si
 * quieres conectar los botones con tu propia lógica:
 *
 *   document.addEventListener('menu:listo', () => { ... });
 *
 * Cada botón trae data-vista con el nombre de su sección. */

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

  function marcarSeccionActiva(menu: HTMLElement): void {
    if (seccionActiva === '') {
      return;
    }

    const boton = menu.querySelector<HTMLButtonElement>(
      `[data-vista="${seccionActiva}"]`,
    );

    boton?.classList.add('activo');
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

  async function montar(): Promise<void> {
    enlazarEstilos();

    let marcado: string;

    try {
      const respuesta = await fetch(rutaDelComponente('menu.html'));

      if (!respuesta.ok) {
        throw new Error(`El servidor respondió ${respuesta.status}`);
      }

      marcado = await respuesta.text();
    } catch {
      console.error(
        '[menú] No se pudo cargar menu.html. Abre la página con Live Server, ' +
          'no con doble clic.',
      );
      return;
    }

    const contenedor = document.createElement('div');
    contenedor.innerHTML = marcado;

    const menu = contenedor.querySelector<HTMLElement>('.menu-olimpo');

    if (menu === null) {
      console.error('[menú] menu.html no trae el elemento .menu-olimpo');
      return;
    }

    // El logo también se resuelve contra el componente, no contra la página
    const emblema = menu.querySelector<HTMLImageElement>('[data-logo]');

    if (emblema !== null) {
      emblema.src = rutaDelComponente('../../../public/logo.png');
    }

    document.body.insertBefore(menu, document.body.firstChild);
    document.body.classList.add('menu-olimpo-activo');

    marcarSeccionActiva(menu);
    conectarCambioDeTema(menu);

    document.dispatchEvent(new CustomEvent('menu:listo', { detail: { menu } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void montar());
  } else {
    void montar();
  }
})();
