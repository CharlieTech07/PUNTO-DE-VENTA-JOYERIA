"use strict";
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
(function panelOlimpo() {
    /** Busca un elemento obligatorio y avisa claro si falta en el HTML. */
    function requerir(selector) {
        const elemento = document.querySelector(selector);
        if (elemento === null) {
            throw new Error(`Falta el elemento "${selector}" en dashboard.html`);
        }
        return elemento;
    }
    /* ---------- Navegación entre secciones ---------- */
    function conectarNavegacion(menu) {
        const botones = Array.from(menu.querySelectorAll('[data-vista]'));
        const vistas = Array.from(document.querySelectorAll('.vista'));
        const titulo = requerir('#tituloVista');
        function mostrarVista(nombre, textoTitulo) {
            for (const vista of vistas) {
                vista.classList.toggle('activa', vista.id === `vista-${nombre}`);
            }
            for (const boton of botones) {
                boton.classList.toggle('activo', boton.dataset['vista'] === nombre);
            }
            titulo.textContent = textoTitulo;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        for (const boton of botones) {
            boton.addEventListener('click', () => {
                const vista = boton.dataset['vista'];
                const textoTitulo = boton.dataset['titulo'];
                if (vista !== undefined && textoTitulo !== undefined) {
                    mostrarVista(vista, textoTitulo);
                }
            });
        }
    }
    /* ---------- Filtros de segmento (solo apariencia) ---------- */
    function conectarSegmentos() {
        const grupos = Array.from(document.querySelectorAll('.segmentos'));
        for (const grupo of grupos) {
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
    }
    /* ---------- Fecha del encabezado ---------- */
    function mostrarFecha() {
        requerir('#fechaHoy').textContent =
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
        const detalle = evento.detail;
        conectarNavegacion(detalle.menu);
    });
})();
