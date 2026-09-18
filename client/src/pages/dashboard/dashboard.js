"use strict";
/* Panel de administración Olimpo — interacción de la maqueta.

   El código fuente es dashboard.ts. El navegador carga dashboard.js, que se
   genera con "npx tsc -p ." dentro de esta carpeta: no edites el .js a mano.

   Va envuelto en una función para no dejar variables globales, y como script
   clásico (no módulo ES) para que la página siga abriendo con doble clic. */
(function panelOlimpo() {
    const ICONO_SOL = '<circle cx="12" cy="12" r="4.2" />' +
        '<path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />';
    const ICONO_LUNA = '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />';
    /** Busca un elemento obligatorio y avisa claro si falta en el HTML. */
    function requerir(selector) {
        const elemento = document.querySelector(selector);
        if (elemento === null) {
            throw new Error(`Falta el elemento "${selector}" en dashboard.html`);
        }
        return elemento;
    }
    /* ---------- Navegación entre secciones ---------- */
    const botonesNav = Array.from(document.querySelectorAll('.nav__item'));
    const vistas = Array.from(document.querySelectorAll('.vista'));
    const titulo = requerir('#tituloVista');
    function mostrarVista(nombre, textoTitulo) {
        for (const vista of vistas) {
            vista.classList.toggle('activa', vista.id === `vista-${nombre}`);
        }
        for (const boton of botonesNav) {
            boton.classList.toggle('activo', boton.dataset['vista'] === nombre);
        }
        titulo.textContent = textoTitulo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    for (const boton of botonesNav) {
        boton.addEventListener('click', () => {
            const vista = boton.dataset['vista'];
            const textoTitulo = boton.dataset['titulo'];
            if (vista !== undefined && textoTitulo !== undefined) {
                mostrarVista(vista, textoTitulo);
            }
        });
    }
    /* ---------- Modo claro / oscuro ---------- */
    const botonTema = requerir('#botonTema');
    const textoTema = requerir('#textoTema');
    const iconoTema = requerir('#iconoTema');
    botonTema.addEventListener('click', () => {
        const eraOscuro = document.documentElement.dataset['tema'] === 'oscuro';
        const nuevoTema = eraOscuro ? 'claro' : 'oscuro';
        document.documentElement.dataset['tema'] = nuevoTema;
        textoTema.textContent = eraOscuro ? 'Modo oscuro' : 'Modo claro';
        iconoTema.innerHTML = eraOscuro ? ICONO_LUNA : ICONO_SOL;
    });
    /* ---------- Filtros de segmento (solo apariencia) ---------- */
    const gruposSegmento = Array.from(document.querySelectorAll('.segmentos'));
    for (const grupo of gruposSegmento) {
        grupo.addEventListener('click', (evento) => {
            const elegido = evento.target;
            if (!(elegido instanceof HTMLButtonElement)) {
                return;
            }
            const botones = Array.from(grupo.querySelectorAll('button'));
            for (const boton of botones) {
                boton.classList.toggle('activo', boton === elegido);
            }
        });
    }
    /* ---------- Fecha del encabezado ---------- */
    requerir('#fechaHoy').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
})();
