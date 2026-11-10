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
