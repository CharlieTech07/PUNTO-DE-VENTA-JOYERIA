// server/src/plantillas/correo-bienvenida.ts
// El correo que recibe cada empleado al darlo de alta: la bienvenida, su usuario y un
// enlace personal para leer y aceptar los términos de uso y el aviso de privacidad
// (la página /confirmar-lectura). Los textos completos ya no van en el correo: así es más
// corto, cae menos en spam y la aceptación queda registrada en el sistema.
// Diseño "estuche": fondo oscuro, marco dorado doble y greca, como el login.
// Los estilos van en línea porque los clientes de correo ignoran las hojas de estilo,
// y los adornos son tablas y colores (no imágenes de fondo), que se ven en cualquier cliente.
import path from 'path';

export interface DatosBienvenida {
  nombres: string;
  apellido_paterno: string;
  nombre_usuario: string;
  correo: string;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  nombre_sucursal: string | null;
  enlace_terminos: string; // enlace personal a /confirmar-lectura
  // Decisión temporal de Cristian (oct 2026): mientras no exista "cambiar la contraseña al
  // primer ingreso", la contraseña inicial también va en el correo. Para quitarla basta con
  // dejar de mandar este dato desde auth.ts.
  contrasena_temporal?: string;
}

const LO_QUE_HACE: Record<DatosBienvenida['rol'], string> = {
  Cajero: 'Desde su cuenta podrá registrar ventas y consultar las piezas y existencias de su sucursal.',
  Gerente: 'Desde su cuenta podrá registrar ventas y, además, supervisar el inventario, los precios y los reportes de su sucursal.',
  Administrador: 'Desde su cuenta podrá gestionar los catálogos, las sucursales y las cuentas del personal.'
};

// Paleta del sistema (styles/tema.css). Los textos largos van sobre fondo claro para leerse bien.
const C = {
  noche: '#120d09',      // fondo de afuera
  estuche: '#241c14',    // encabezado, caja de la cuenta y pie
  brillo: '#4a3624',     // resplandor detrás del logo
  hoja: '#fbf8f2',
  oro: '#e0c289',
  oroClaro: '#ebd5a6',
  oroMedio: '#c9a96a',
  oroOscuro: '#8a6d3b',
  oroTexto: '#8f6e2f',
  texto: '#2e2418',
  texto2: '#5b4c3a',
  texto3: '#85745f',
  arena: '#d6c7b2',
  arena3: '#a08d76',
  claro: '#f6eee2'
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = 'Arial, Helvetica, sans-serif';

// Los datos los escribe quien da de alta: se escapan para que no se cuele HTML en el correo
function esc(texto: string): string {
  return texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function dondeTrabaja(d: DatosBienvenida): string {
  return d.rol === 'Administrador' || !d.nombre_sucursal
    ? 'y acceso a todas las sucursales'
    : `en la sucursal ${d.nombre_sucursal}`;
}

// Línea dorada de 1 px (un div dentro de una celda, para que quede centrada en vertical)
const linea = (color: string) => `<div style="height:1px;line-height:1px;font-size:0;background:${color};">&nbsp;</div>`;

// Línea dorada con un rombo al centro, para enmarcar el paso de los términos
function divisor(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle">${linea(C.oroMedio)}</td>
    <td valign="middle" width="34" align="center" style="width:34px;font-family:${SERIF};font-size:12px;line-height:12px;color:${C.oroMedio};">&#9670;</td>
    <td valign="middle">${linea(C.oroMedio)}</td>
  </tr></table>`;
}

// La greca del emblema (imagen adjunta de 1200 x 64, se muestra a la mitad)
const greca = (ancho: number) =>
  `<img src="cid:greca-olimpo" width="${ancho}" height="${Math.round(ancho * 64 / 1200)}" alt="" style="display:block;width:100%;max-width:${ancho}px;height:auto;border:0;">`;

export function correoBienvenida(d: DatosBienvenida) {
  const asunto = `Le damos la bienvenida a Olimpo, ${d.nombres}`;
  const datosCuenta: [string, string][] = [
    ['Usuario', d.nombre_usuario],
    ...(d.contrasena_temporal ? [['Contraseña temporal', d.contrasena_temporal] as [string, string]] : []),
    ['Puesto', d.rol],
    ['Sucursal', d.rol === 'Administrador' || !d.nombre_sucursal ? 'Todas' : d.nombre_sucursal],
    ['Correo registrado', d.correo]
  ];
  const parrafo = (t: string, extra = '') =>
    `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.texto};${extra}">${t}</p>`;
  const comoEntrar = d.contrasena_temporal
    ? 'Para entrar al sistema, escriba su usuario y su contraseña temporal en la pantalla de acceso. Por seguridad, no reenvíe este correo y pida a su administrador que le cambie la contraseña después de entrar.'
    : 'Para entrar al sistema, escriba su usuario y su contraseña en la pantalla de acceso. La contraseña inicial se la entrega en persona quien creó su cuenta: por seguridad, nunca la enviamos por correo.';
  // La contraseña en letra de máquina, para no confundir l con 1 ni O con 0
  const estiloValor = (k: string) => {
    if (k === 'Usuario') return `font-family:${SERIF};font-size:20px;color:${C.oroClaro};letter-spacing:1px;`;
    if (k === 'Contraseña temporal') return `font-family:Consolas,'Courier New',monospace;font-size:17px;color:${C.oroClaro};letter-spacing:1px;`;
    return `font-family:${SANS};font-size:15px;color:${C.claro};`;
  };

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(asunto)}</title>
</head>
<body style="margin:0;padding:0;background:${C.noche};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.noche};">
  <tr><td align="center" style="padding:28px 12px 32px;">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
      <tr><td style="padding:0 0 14px;">${greca(600)}</td></tr>
    </table>

    <!-- Marco dorado doble, como el estuche de una pieza -->
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border:1px solid ${C.oroMedio};border-radius:14px;">
      <tr><td style="padding:5px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.oroOscuro};border-radius:10px;overflow:hidden;background:${C.hoja};">

          <tr><td align="center" style="background:${C.estuche};background-image:radial-gradient(circle at 50% 32%, ${C.brillo} 0%, ${C.estuche} 62%);padding:38px 28px 26px;">
            <img src="cid:logo-olimpo" width="112" height="112" alt="Olimpo" style="display:block;margin:0 auto 16px;border:0;">
            <div style="font-family:${SERIF};font-size:34px;letter-spacing:12px;padding-left:12px;color:${C.oro};">OLIMPO</div>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:10px auto 0;"><tr>
              <td valign="middle" width="44">${linea(C.oroMedio)}</td>
              <td valign="middle" style="padding:0 14px;font-family:${SERIF};font-size:11px;letter-spacing:5px;color:${C.arena};white-space:nowrap;">HAUTE JOAILLERIE</td>
              <td valign="middle" width="44">${linea(C.oroMedio)}</td>
            </tr></table>
            <div style="height:26px;line-height:26px;font-size:0;">&nbsp;</div>
            ${greca(536)}
          </td></tr>
          <tr><td style="height:3px;line-height:3px;font-size:0;background:${C.oroMedio};">&nbsp;</td></tr>

          <tr><td style="padding:34px 34px 8px;">
            <div style="margin:0 0 10px;font-family:${SERIF};font-size:12px;letter-spacing:4px;color:${C.oroTexto};">BIENVENIDA AL EQUIPO</div>
            <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:30px;font-weight:normal;line-height:1.2;color:${C.texto};">Le damos la bienvenida, ${esc(d.nombres)}</h1>
            ${parrafo(`Nos da mucho gusto que se sume al equipo de Olimpo Haute Joaillerie. Ya tiene una cuenta en nuestro punto de venta, con el puesto de ${esc(d.rol.toLowerCase())} ${esc(dondeTrabaja(d))}. ${esc(LO_QUE_HACE[d.rol])}`)}

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:${C.estuche};border:1px solid ${C.oroMedio};border-radius:12px;">
              <tr><td style="padding:20px 24px 6px;">
                <div style="font-family:${SERIF};font-size:12px;letter-spacing:4px;color:${C.oro};">&#9670;&nbsp;&nbsp;SU CUENTA</div>
              </td></tr>
              ${datosCuenta.map(([k, v], i) => `
              <tr><td style="padding:${i === 0 ? 10 : 6}px 24px 0;">
                <span style="display:inline-block;width:150px;font-family:${SANS};font-size:13px;color:${C.arena3};">${k}</span><span style="${estiloValor(k)}">${esc(v)}</span>
              </td></tr>`).join('')}
              <tr><td style="padding:0 0 20px;"></td></tr>
            </table>

            ${parrafo(comoEntrar)}

            <div style="margin:30px 0 10px;">${divisor()}</div>
            <div style="text-align:center;padding:14px 0 30px;">
              <div style="font-family:${SERIF};font-size:12px;letter-spacing:4px;color:${C.oroTexto};">UN PASO ANTES DE EMPEZAR</div>
              <div style="margin:10px 0 0;font-family:${SERIF};font-size:23px;line-height:1.3;color:${C.texto};">Lea y confirme los términos de uso y el aviso de privacidad</div>
              <p style="margin:12px 0 22px;font-family:${SANS};font-size:14.5px;line-height:1.6;color:${C.texto2};">Explican cómo usar el sistema y cómo cuidamos sus datos. Léalos con calma y, al terminar, marque que los acepta. Solo toma unos minutos.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
                <td align="center" bgcolor="${C.estuche}" style="border-radius:8px;background:${C.estuche};border:1px solid ${C.oroMedio};">
                  <a href="${esc(d.enlace_terminos)}" style="display:inline-block;padding:16px 32px;font-family:${SERIF};font-size:13px;letter-spacing:3px;color:${C.oroClaro};text-decoration:none;">LEER Y CONFIRMAR LOS TÉRMINOS</a>
                </td>
              </tr></table>
              <p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.texto3};">El enlace es personal: no lo reenvíe.<br>Si no puede abrirlo, los verá la primera vez que entre al sistema.</p>
            </div>
            <div style="margin:0 0 26px;">${divisor()}</div>

            ${parrafo('Le deseamos mucho éxito en esta nueva etapa.', 'margin-bottom:4px;')}
            <p style="margin:0 0 30px;font-family:${SERIF};font-size:17px;font-style:italic;color:${C.oroTexto};">El equipo de Olimpo</p>
          </td></tr>

          <tr><td style="height:3px;line-height:3px;font-size:0;background:${C.oroMedio};">&nbsp;</td></tr>
          <tr><td align="center" style="background:${C.estuche};padding:26px 34px 28px;">
            <div style="font-family:${SERIF};font-size:15px;letter-spacing:7px;padding-left:7px;color:${C.oro};">OLIMPO</div>
            <div style="margin:6px 0 16px;font-family:${SERIF};font-size:9px;letter-spacing:4px;color:${C.arena3};">HAUTE JOAILLERIE</div>
            <div style="font-family:${SANS};font-size:12px;line-height:1.6;color:${C.arena3};">Recibió este correo porque se le creó una cuenta en el punto de venta de Olimpo. Si no esperaba recibirlo, avísenos respondiendo a este mensaje.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
      <tr><td style="padding:14px 0 0;">${greca(600)}</td></tr>
    </table>

  </td></tr>
</table>
</body>
</html>`;

  const texto = [
    `Le damos la bienvenida, ${d.nombres}`,
    '',
    `Nos da mucho gusto que se sume al equipo de Olimpo Haute Joaillerie. Ya tiene una cuenta en nuestro punto de venta, con el puesto de ${d.rol.toLowerCase()} ${dondeTrabaja(d)}. ${LO_QUE_HACE[d.rol]}`,
    '',
    'SU CUENTA',
    ...datosCuenta.map(([k, v]) => `${k}: ${v}`),
    '',
    comoEntrar,
    '',
    'UN PASO ANTES DE EMPEZAR',
    'Lea los términos de uso y el aviso de privacidad, y confirme que los acepta, en este enlace personal (no lo reenvíe):',
    d.enlace_terminos,
    'Si no puede abrirlo, los verá la primera vez que entre al sistema.',
    '',
    'Le deseamos mucho éxito en esta nueva etapa.',
    'El equipo de Olimpo'
  ].join('\n');

  // Imágenes incrustadas (cid): así se ven aunque el servidor no tenga una dirección pública
  const adjuntos = [
    { filename: 'olimpo.png', path: path.join(__dirname, 'logo-correo.png'), cid: 'logo-olimpo' },
    { filename: 'greca.png', path: path.join(__dirname, 'greca-correo.png'), cid: 'greca-olimpo' }
  ];

  return { asunto, html, texto, adjuntos };
}
