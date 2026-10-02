"use strict";
/**
 * Control de acceso de la pantalla de login.
 *
 * OJO: esto NO es autenticación. Solo valida que los campos estén llenos y
 * lleva a la vitrina. No hay backend todavía: la ruta `auth` del servidor se
 * eliminó al reescribir la API, así que no hay con quién validar el usuario.
 * Cuando exista, esto se reemplaza por una llamada al servicio de Angular y la
 * comparación va del lado del servidor con bcrypt. La contraseña nunca se
 * guarda ni se registra aquí.
 *
 * Igual que menu.ts y dashboard.ts, va envuelto en una función y sin
 * import/export: se sirve como script normal, y como módulo ES el navegador
 * lo bloquearía.
 */
(function inicializarAcceso() {
    'use strict';
    /** A dónde entra el usuario al pasar el acceso: la vitrina de Alan. */
    const DESTINO = '../inicio/index.html';
    /** Mismo mínimo que pidió el compañero en su validación de Angular. */
    const MINIMO_CONTRASENA = 8;
    function porId(id) {
        return document.getElementById(id);
    }
    /** Pinta o limpia el error de un campo. El mensaje vive en el <p class="error">
     *  que ya trae el marcado, y el `.field` se marca con `con-error` para que
     *  el CSS lo muestre. Sin esa clase el mensaje queda oculto. */
    function marcarError(campo, mensaje) {
        const contenedor = campo.closest('.field');
        if (contenedor === null) {
            return;
        }
        const parrafo = contenedor.querySelector('.error');
        if (mensaje === null) {
            contenedor.classList.remove('con-error');
            campo.removeAttribute('aria-invalid');
            return;
        }
        contenedor.classList.add('con-error');
        campo.setAttribute('aria-invalid', 'true');
        if (parrafo !== null) {
            parrafo.textContent = mensaje;
        }
    }
    /** Devuelve el mensaje a mostrar, o null si el campo está bien. */
    function revisarCorreo(valor) {
        const limpio = valor.trim();
        if (limpio === '') {
            return 'El correo es obligatorio.';
        }
        // Validación mínima de forma. La de verdad la hace el backend.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
            return 'Escriba un correo válido.';
        }
        return null;
    }
    function revisarContrasena(valor) {
        if (valor === '') {
            return 'La contraseña es obligatoria.';
        }
        if (valor.length < MINIMO_CONTRASENA) {
            return 'La contraseña debe tener al menos ' + MINIMO_CONTRASENA + ' caracteres.';
        }
        return null;
    }
    function conectar() {
        const formulario = document.querySelector('.login-form');
        const correo = porId('email');
        const contrasena = porId('password');
        if (formulario === null || correo === null || contrasena === null) {
            return;
        }
        // Al escribir se limpia el error, para no dejarlo colgado mientras corrigen.
        correo.addEventListener('input', () => marcarError(correo, null));
        contrasena.addEventListener('input', () => marcarError(contrasena, null));
        formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();
            const errorCorreo = revisarCorreo(correo.value);
            const errorContrasena = revisarContrasena(contrasena.value);
            marcarError(correo, errorCorreo);
            marcarError(contrasena, errorContrasena);
            if (errorCorreo !== null) {
                correo.focus();
                return;
            }
            if (errorContrasena !== null) {
                contrasena.focus();
                return;
            }
            // Aquí irá la llamada real al backend. Por ahora solo pasa a la vitrina.
            window.location.href = DESTINO;
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', conectar);
    }
    else {
        conectar();
    }
})();
