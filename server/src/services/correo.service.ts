// server/src/services/correo.service.ts
// Envía correos desde la cuenta de Gmail del sistema (CORREO_USUARIO en server/.env).
// Gmail no acepta la contraseña normal de la cuenta: hay que generar una
// "contraseña de aplicación" (pide tener activa la verificación en dos pasos)
// y ponerla en CORREO_CONTRASENA_APP.
import nodemailer, { Transporter } from 'nodemailer';
import { correoBienvenida, DatosBienvenida } from '../plantillas/correo-bienvenida.js';

let transporte: Transporter | null = null;

function obtenerTransporte(): Transporter {
  const usuario = process.env.CORREO_USUARIO;
  const contrasena = process.env.CORREO_CONTRASENA_APP;
  if (!usuario || !contrasena) {
    throw new Error('Falta configurar CORREO_USUARIO y CORREO_CONTRASENA_APP en server/.env');
  }
  transporte ??= nodemailer.createTransport({
    service: 'gmail',
    // Google la muestra en bloques separados por espacios
    auth: { user: usuario, pass: contrasena.replace(/\s/g, '') },
    // Si Gmail no responde, que el alta no se quede esperando minutos
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  });
  return transporte;
}

export async function enviarBienvenida(datos: DatosBienvenida): Promise<void> {
  const correo = correoBienvenida(datos);
  await obtenerTransporte().sendMail({
    from: { name: 'Olimpo Haute Joaillerie', address: process.env.CORREO_USUARIO! },
    to: datos.correo,
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
    attachments: correo.adjuntos
  });
}

export async function enviarReporte(datos: {
  correo: string;
  archivo: string;
  buffer: Buffer;
  sucursal: string;
  fechaInicio: string;
  fechaFin: string;
  idioma: 'es' | 'en';
}): Promise<void> {
  const sucursalSegura = datos.sucursal.replace(/[&<>"']/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[caracter]!);
  const en = datos.idioma === 'en';
  const asunto = en
    ? `Sales report · ${datos.sucursal} · ${datos.fechaInicio} to ${datos.fechaFin}`
    : `Reporte de ventas · ${datos.sucursal} · ${datos.fechaInicio} a ${datos.fechaFin}`;
  const texto = en
    ? `Attached is the sales report for ${datos.sucursal}, covering ${datos.fechaInicio} to ${datos.fechaFin}.`
    : `Adjuntamos el reporte de ventas de ${datos.sucursal} para el periodo ${datos.fechaInicio} a ${datos.fechaFin}.`;
  await obtenerTransporte().sendMail({
    from: { name: 'POS Olimpo', address: process.env.CORREO_USUARIO! },
    to: datos.correo,
    subject: asunto,
    text: texto,
    html: en
      ? `<p>Attached is the sales report for <strong>${sucursalSegura}</strong>, covering <strong>${datos.fechaInicio}</strong> to <strong>${datos.fechaFin}</strong>.</p>`
      : `<p>Adjuntamos el reporte de ventas de <strong>${sucursalSegura}</strong> para el periodo <strong>${datos.fechaInicio}</strong> a <strong>${datos.fechaFin}</strong>.</p>`,
    attachments: [{ filename: datos.archivo, content: datos.buffer, contentType: 'application/pdf' }]
  });
}
