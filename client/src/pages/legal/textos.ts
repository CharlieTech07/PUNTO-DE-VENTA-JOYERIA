// client/src/pages/legal/textos.ts
// Textos del aviso de privacidad y de los términos y condiciones, en los dos
// idiomas del sistema. Van aquí y no en translation-catalog.ts porque son
// párrafos completos, no frases sueltas de la interfaz.
//
// ANTES DE PUBLICARLOS hay que llenar los datos entre corchetes de abajo.
// Están en un solo lugar para no tener que buscarlos dentro de los textos.

import type { Lang } from '../../services/lenguage.service';

const RESPONSABLE = '[Nombre legal de la joyería]';
const DOMICILIO = '[domicilio]';
const CORREO_PRIVACIDAD = '[correo de privacidad]';

// Fecha de esta versión. Si cambian los textos, se actualiza.
export const ACTUALIZADO: Record<Lang, string> = {
  es: '19 de octubre de 2026',
  en: 'October 19, 2026'
};

export type Documento = 'privacidad' | 'terminos';

export interface SeccionLegal {
  titulo: string;
  lista?: string[];    // se pinta primero
  parrafos?: string[]; // y estos después de la lista
}

export interface TextoLegal {
  titulo: string;
  intro: string[];
  secciones: SeccionLegal[];
}

export const TEXTOS_LEGALES: Record<Lang, Record<Documento, TextoLegal>> = {
  es: {
    privacidad: {
      titulo: 'Aviso de privacidad',
      intro: [
        `${RESPONSABLE} («Olimpo»), con domicilio en ${DOMICILIO}, es responsable de los datos personales que usted nos da al comprar en nuestras sucursales, y de los de nuestro personal. Aquí le explicamos qué datos pedimos, para qué los usamos y cómo puede controlarlos.`
      ],
      secciones: [
        {
          titulo: 'Qué datos pedimos',
          lista: [
            'Si pide factura: nombre o razón social, RFC, código postal, régimen fiscal, uso del CFDI y correo electrónico.',
            'Si trabaja con nosotros: nombre, apellidos, correo, puesto y sucursal. Su contraseña se guarda cifrada; nadie puede leerla, ni siquiera el administrador.'
          ],
          parrafos: ['No pedimos datos sensibles y no guardamos números de tarjeta.']
        },
        {
          titulo: 'Para qué los usamos',
          lista: [
            'Para emitir su factura y enviársela.',
            'Para registrar la venta y cumplir con nuestras obligaciones fiscales.',
            'En el caso del personal, para darle acceso al sistema con los permisos de su puesto y saber quién hizo cada operación.'
          ],
          parrafos: ['No usamos sus datos para publicidad. Si algún día quisiéramos hacerlo, primero se lo pediríamos.']
        },
        {
          titulo: 'Con quién los compartimos',
          parrafos: ['Solo con el SAT y con el proveedor autorizado que timbra las facturas, porque la ley lo exige, y con autoridades que los soliciten con fundamento legal. No vendemos ni prestamos sus datos.']
        },
        {
          titulo: 'Qué se guarda en su navegador',
          parrafos: ['El sistema guarda en el navegador la sesión iniciada, el tema (claro u oscuro), el idioma y la venta en curso. No usamos cookies de publicidad ni herramientas de rastreo.']
        },
        {
          titulo: 'Sus derechos',
          parrafos: [`En cualquier momento puede pedirnos ver sus datos, corregirlos, borrarlos o dejar de usarlos para algún fin, y también retirar su consentimiento. Escríbanos a ${CORREO_PRIVACIDAD} con su nombre, lo que necesita y una copia de su identificación. Le respondemos en un máximo de 20 días hábiles. Los datos de facturación los debemos conservar el tiempo que marca la ley fiscal, aunque pida borrarlos.`]
        },
        {
          titulo: 'Cambios a este aviso',
          parrafos: ['Si cambiamos este aviso, publicaremos la nueva versión en el sistema y en nuestras sucursales, con su fecha.']
        }
      ]
    },
    terminos: {
      titulo: 'Términos y condiciones de uso del sistema',
      intro: ['Estos términos aplican a todo el personal que usa el punto de venta de Olimpo. Para iniciar sesión hay que aceptarlos, marcando la casilla de la pantalla de acceso.'],
      secciones: [
        {
          titulo: '1. Quién puede usarlo',
          parrafos: ['Solo el personal autorizado, con una cuenta creada por el administrador. Cada cuenta tiene un puesto (administrador, gerente o cajero) y, salvo la del administrador, una sucursal.']
        },
        {
          titulo: '2. Su cuenta',
          parrafos: ['Es personal. No comparta su contraseña ni deje la sesión abierta en una computadora sin atender. Si cree que alguien usó su cuenta, avise de inmediato al gerente o al administrador. Lo que se haga con su cuenta se considera hecho por usted.']
        },
        {
          titulo: '3. Lo que puede hacer cada puesto',
          lista: [
            'Cajero: registrar ventas y consultar las piezas y existencias de su sucursal.',
            'Gerente: lo mismo que el cajero, y además supervisar inventario, precios y reportes de su sucursal.',
            'Administrador: además, gestionar catálogos, sucursales y cuentas del personal.'
          ],
          parrafos: ['No intente entrar a funciones que no le corresponden.']
        },
        {
          titulo: '4. Uso correcto',
          lista: [
            'Registre solo ventas reales, con las piezas y cantidades que salen de la vitrina.',
            'Los descuentos, cancelaciones, cambios de precio y bajas de inventario necesitan autorización de un gerente.',
            'Si las existencias del sistema no coinciden con lo que hay en la vitrina, avise al gerente antes de vender.',
            'Las operaciones importantes pueden quedar registradas con su usuario, la fecha y la hora.'
          ]
        },
        {
          titulo: '5. Confidencialidad',
          parrafos: ['Los precios de compra, el inventario, las ventas y los datos de los clientes son información confidencial de la joyería. No los copie, fotografíe ni comparta fuera del trabajo.']
        },
        {
          titulo: '6. Datos de los clientes',
          parrafos: ['Pida solo los datos necesarios para la venta o la factura, y úselos solo para eso, como indica el aviso de privacidad. Nunca anote números de tarjeta.']
        },
        {
          titulo: '7. Fallas del sistema',
          parrafos: ['El sistema puede fallar o estar en mantenimiento. Si pasa a mitad de una venta, revise si ya quedó registrada antes de repetirla.']
        },
        {
          titulo: '8. Mal uso',
          parrafos: ['Usar el sistema en contra de estos términos puede llevar a la suspensión de su cuenta y a las medidas que marque el reglamento interno.']
        },
        {
          titulo: '9. Cambios',
          parrafos: ['Podemos actualizar estos términos. Le avisaremos dentro del sistema, y la versión vigente siempre estará disponible aquí.']
        }
      ]
    }
  },

  en: {
    privacidad: {
      titulo: 'Privacy notice',
      intro: [
        `${RESPONSABLE} ("Olimpo"), located at ${DOMICILIO}, is responsible for the personal data you give us when you shop at our stores, and for that of our staff. Here we explain what data we ask for, what we use it for, and how you can control it.`,
        'This translation is provided for convenience. If it differs from the Spanish version, the Spanish version prevails.'
      ],
      secciones: [
        {
          titulo: 'What data we ask for',
          lista: [
            'If you request an invoice: name or company name, RFC (tax ID), ZIP code, tax regime, CFDI use, and email address.',
            'If you work with us: first name, last names, email, position, and store. Your password is stored encrypted; no one can read it, not even the administrator.'
          ],
          parrafos: ['We do not ask for sensitive data and we do not store card numbers.']
        },
        {
          titulo: 'What we use it for',
          lista: [
            'To issue your invoice and send it to you.',
            'To record the sale and meet our tax obligations.',
            'For staff, to give you access to the system with the permissions of your position and to know who carried out each operation.'
          ],
          parrafos: ['We do not use your data for advertising. If we ever wanted to, we would ask you first.']
        },
        {
          titulo: 'Who we share it with',
          parrafos: ['Only with the SAT (Mexico\'s tax authority) and with the authorized provider that certifies invoices, because the law requires it, and with authorities that request it on legal grounds. We do not sell or lend your data.']
        },
        {
          titulo: 'What is stored in your browser',
          parrafos: ['The system stores in your browser the active session, the theme (light or dark), the language, and the sale in progress. We do not use advertising cookies or tracking tools.']
        },
        {
          titulo: 'Your rights',
          parrafos: [`At any time you can ask us to show you your data, correct it, delete it, or stop using it for a given purpose, and you can also withdraw your consent. Write to us at ${CORREO_PRIVACIDAD} with your name, what you need, and a copy of your ID. We reply within 20 business days at most. We must keep invoicing data for as long as tax law requires, even if you ask us to delete it.`]
        },
        {
          titulo: 'Changes to this notice',
          parrafos: ['If we change this notice, we will publish the new version in the system and in our stores, with its date.']
        }
      ]
    },
    terminos: {
      titulo: 'Terms and conditions of use of the system',
      intro: [
        'These terms apply to all staff who use the Olimpo point of sale. To sign in, you must accept them by checking the box on the sign-in screen.',
        'This translation is provided for convenience. If it differs from the Spanish version, the Spanish version prevails.'
      ],
      secciones: [
        {
          titulo: '1. Who can use it',
          parrafos: ['Only authorized staff, with an account created by the administrator. Each account has a position (administrator, manager, or cashier) and, except for the administrator\'s, a store.']
        },
        {
          titulo: '2. Your account',
          parrafos: ['It is personal. Do not share your password or leave your session open on an unattended computer. If you think someone used your account, tell the manager or the administrator right away. Anything done with your account is considered done by you.']
        },
        {
          titulo: '3. What each position can do',
          lista: [
            'Cashier: record sales and check the pieces and stock of their store.',
            'Manager: the same as the cashier, plus supervising inventory, prices, and reports for their store.',
            'Administrator: in addition, managing catalogs, stores, and staff accounts.'
          ],
          parrafos: ['Do not try to access functions that are not part of your position.']
        },
        {
          titulo: '4. Proper use',
          lista: [
            'Record only real sales, with the pieces and quantities that leave the display case.',
            'Discounts, cancellations, price changes, and inventory write-offs require a manager\'s authorization.',
            'If the stock in the system does not match what is in the display case, tell the manager before selling.',
            'Important operations may be logged with your user, the date, and the time.'
          ]
        },
        {
          titulo: '5. Confidentiality',
          parrafos: ['Purchase prices, inventory, sales, and customer data are confidential information of the jewelry store. Do not copy, photograph, or share them outside of work.']
        },
        {
          titulo: '6. Customer data',
          parrafos: ['Ask only for the data needed for the sale or the invoice, and use it only for that, as the privacy notice states. Never write down card numbers.']
        },
        {
          titulo: '7. System failures',
          parrafos: ['The system may fail or be under maintenance. If this happens in the middle of a sale, check whether it was already recorded before entering it again.']
        },
        {
          titulo: '8. Misuse',
          parrafos: ['Using the system against these terms may lead to the suspension of your account and to the measures set out in the internal regulations.']
        },
        {
          titulo: '9. Changes',
          parrafos: ['We may update these terms. We will let you know within the system, and the current version will always be available here.']
        }
      ]
    }
  }
};
