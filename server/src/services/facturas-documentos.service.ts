import { pool } from '../db.js';
import { obtenerFactura } from './facturas.service.js';

type UsuarioDocumento = {
  id: number;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
};

interface DatosEmisor {
  razon_social: string;
  rfc: string;
  regimen_fiscal: string;
  codigo_postal: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  correo: string | null;
  telefono: string | null;
}

interface CuentaDocumento {
  alias: string;
  banco: string;
  titular: string;
  tipo_cuenta: string;
  numero_cuenta: string | null;
  clabe: string | null;
  moneda: string;
  forma_pago: string | null;
}

export async function obtenerDatosFacturaDocumento(id: unknown, usuario: UsuarioDocumento) {
  const factura = await obtenerFactura(id, usuario);
  const [venta, emisor, cuentas] = await Promise.all([
    pool.query(
      `SELECT v.folio AS folio_venta, v.id_sucursal, s.nombre AS sucursal
       FROM public.ventas v JOIN public.sucursales s ON s.id = v.id_sucursal
       WHERE v.id = $1`,
      [factura.id_venta],
    ),
    pool.query('SELECT * FROM public.datos_facturacion_empresa WHERE id = 1'),
    pool.query(
      `SELECT alias, banco, titular, tipo_cuenta, numero_cuenta, clabe, moneda, forma_pago
       FROM public.cuentas_bancarias
       WHERE activa = true AND (id_sucursal = $1 OR id_sucursal IS NULL)
       ORDER BY banco, alias, id`,
      [factura.id_sucursal],
    ),
  ]);

  return {
    factura,
    venta: venta.rows[0] ?? { folio_venta: '', sucursal: '' },
    emisor: (emisor.rows[0] as DatosEmisor | undefined) ?? null,
    cuentas: cuentas.rows as CuentaDocumento[],
  };
}

function xml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decimal(value: number): string { return Number(value || 0).toFixed(2); }

export function generarXmlDemostrativo(datos: Awaited<ReturnType<typeof obtenerDatosFacturaDocumento>>): string {
  const { factura, emisor, venta, cuentas } = datos;
  const conceptos = factura.conceptos.map(concepto =>
    `    <Concepto descripcion="${xml(concepto.descripcion)}" cantidad="${concepto.cantidad}" valorUnitario="${decimal(concepto.valor_unitario)}" importe="${decimal(concepto.importe)}" />`,
  ).join('\n');
  const cuentasXml = cuentas.map(cuenta =>
    `    <Cuenta alias="${xml(cuenta.alias)}" banco="${xml(cuenta.banco)}" titular="${xml(cuenta.titular)}" tipo="${xml(cuenta.tipo_cuenta)}" numero="${xml(cuenta.numero_cuenta)}" clabe="${xml(cuenta.clabe)}" moneda="${xml(cuenta.moneda)}" formaPago="${xml(cuenta.forma_pago)}" />`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<DocumentoDemostrativo tipo="Factura" version="1.0" validez="SIN VALIDEZ FISCAL" esCFDI="false">
  <Aviso>Documento de demostracion escolar. No es un CFDI ni tiene validez fiscal. No fue timbrado por el SAT o un PAC.</Aviso>
  <Factura folio="${xml(factura.folio_texto)}" estado="${xml(factura.estado)}" fechaEmision="${xml(factura.fecha_emision)}" venta="${xml(venta.folio_venta)}" sucursal="${xml(venta.sucursal)}" moneda="MXN" subtotal="${decimal(factura.subtotal)}" iva="${decimal(factura.iva)}" total="${decimal(factura.total)}">
    <Emisor razonSocial="${xml(emisor?.razon_social || 'Olimpo Haute Joaillerie')}" rfc="${xml(emisor?.rfc)}" regimenFiscal="${xml(emisor?.regimen_fiscal)}" codigoPostal="${xml(emisor?.codigo_postal)}" calle="${xml(emisor?.calle)}" numeroExterior="${xml(emisor?.numero_exterior)}" numeroInterior="${xml(emisor?.numero_interior)}" colonia="${xml(emisor?.colonia)}" municipio="${xml(emisor?.municipio)}" estado="${xml(emisor?.estado)}" correo="${xml(emisor?.correo)}" telefono="${xml(emisor?.telefono)}" />
    <Receptor rfc="${xml(factura.receptor.rfc)}" nombre="${xml(factura.receptor.nombre)}" codigoPostal="${xml(factura.receptor.cp)}" regimenFiscal="${xml(factura.receptor.regimen)}" usoCFDI="${xml(factura.receptor.uso)}" correo="${xml(factura.receptor.correo)}" />
    <Conceptos>
${conceptos}
    </Conceptos>
    <CuentasBancarias>
${cuentasXml}
    </CuentasBancarias>
  </Factura>
</DocumentoDemostrativo>
`;
}

interface LineaPdf { texto: string; tamano?: number; negrita?: boolean; espacio?: number; }

function dinero(value: number): string { return `$${decimal(value)} MXN`; }

function agregarEnvuelta(lineas: LineaPdf[], texto: string, ancho = 88): void {
  const palabras = texto.split(/\s+/);
  let linea = '';
  for (const palabra of palabras) {
    if ((linea + ' ' + palabra).trim().length > ancho && linea) {
      lineas.push({ texto: linea });
      linea = palabra;
    } else {
      linea = (linea + ' ' + palabra).trim();
    }
  }
  if (linea) lineas.push({ texto: linea });
}

function crearLineasPdf(datos: Awaited<ReturnType<typeof obtenerDatosFacturaDocumento>>): LineaPdf[] {
  const { factura, emisor, venta, cuentas } = datos;
  const lineas: LineaPdf[] = [
    { texto: 'FACTURA DEMOSTRATIVA', tamano: 21, negrita: true, espacio: 10 },
    { texto: 'SIN VALIDEZ FISCAL - NO ES UN CFDI TIMBRADO', tamano: 12, negrita: true, espacio: 14 },
    { texto: `Folio: ${factura.folio_texto}    Estado: ${factura.estado}`, negrita: true },
    { texto: `Fecha de emision: ${new Date(factura.fecha_emision).toLocaleString('es-MX')}` },
    { texto: `Venta: ${venta.folio_venta || factura.id_venta}    Sucursal: ${venta.sucursal || factura.id_sucursal}`, espacio: 12 },
    { texto: 'EMISOR', tamano: 13, negrita: true, espacio: 3 },
  ];
  agregarEnvuelta(lineas, emisor?.razon_social || 'Olimpo Haute Joaillerie');
  agregarEnvuelta(lineas, `RFC: ${emisor?.rfc || 'No configurado'}    Regimen: ${emisor?.regimen_fiscal || 'No configurado'}    CP: ${emisor?.codigo_postal || 'No configurado'}`);
  agregarEnvuelta(lineas, `Domicilio: ${[emisor?.calle, emisor?.numero_exterior, emisor?.numero_interior, emisor?.colonia, emisor?.municipio, emisor?.estado].filter(Boolean).join(', ') || 'No configurado'}`);
  if (emisor?.correo || emisor?.telefono) agregarEnvuelta(lineas, `Contacto: ${[emisor.correo, emisor.telefono].filter(Boolean).join(' | ')}`);
  lineas.push({ texto: '', espacio: 5 }, { texto: 'RECEPTOR', tamano: 13, negrita: true, espacio: 3 });
  agregarEnvuelta(lineas, `${factura.receptor.nombre} - RFC ${factura.receptor.rfc} - CP ${factura.receptor.cp}`);
  agregarEnvuelta(lineas, `Regimen fiscal: ${factura.receptor.regimen}    Uso: ${factura.receptor.uso}`);
  agregarEnvuelta(lineas, `Correo: ${factura.receptor.correo}`);
  lineas.push({ texto: '', espacio: 5 }, { texto: 'CONCEPTOS', tamano: 13, negrita: true, espacio: 3 });
  factura.conceptos.forEach((concepto, index) => {
    agregarEnvuelta(lineas, `${index + 1}. ${concepto.cantidad} x ${concepto.descripcion} | Unitario ${dinero(concepto.valor_unitario)} | Importe ${dinero(concepto.importe)}`);
  });
  lineas.push(
    { texto: '', espacio: 4 },
    { texto: `Subtotal: ${dinero(factura.subtotal)}` },
    { texto: `IVA: ${dinero(factura.iva)}` },
    { texto: `TOTAL: ${dinero(factura.total)}`, tamano: 14, negrita: true, espacio: 12 },
    { texto: 'DATOS BANCARIOS DEL NEGOCIO', tamano: 13, negrita: true, espacio: 3 },
  );
  if (cuentas.length) {
    for (const cuenta of cuentas) {
      agregarEnvuelta(lineas, `${cuenta.alias} - ${cuenta.banco} - Titular: ${cuenta.titular} - ${cuenta.moneda}`);
      if (cuenta.clabe) agregarEnvuelta(lineas, `CLABE: ${cuenta.clabe}`);
      if (cuenta.numero_cuenta) agregarEnvuelta(lineas, `Cuenta: ${cuenta.numero_cuenta}`);
      if (cuenta.forma_pago) agregarEnvuelta(lineas, `Forma de pago: ${cuenta.forma_pago}`);
    }
  } else {
    lineas.push({ texto: 'No hay cuentas bancarias activas configuradas.' });
  }
  lineas.push(
    { texto: '', espacio: 6 },
    { texto: 'Este archivo es solo una demostracion escolar. No sustituye una factura fiscal.', tamano: 10, negrita: true },
    { texto: 'No incluye UUID ni sello digital porque no fue timbrado por el SAT o un PAC.', tamano: 10 },
  );
  return lineas;
}

function literalPdf(texto: string): string {
  const compatible = texto.replace(/[\u0100-\uFFFF]/g, '?');
  return compatible.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function generarPdfDemostrativo(datos: Awaited<ReturnType<typeof obtenerDatosFacturaDocumento>>): Buffer {
  const lineas = crearLineasPdf(datos);
  const paginas: LineaPdf[][] = [];
  let pagina: LineaPdf[] = [];
  let puntos = 790;
  for (const linea of lineas) {
    const alto = (linea.tamano ?? 10) + 7 + (linea.espacio ?? 0);
    if (puntos - alto < 55 && pagina.length) {
      paginas.push(pagina);
      pagina = [];
      puntos = 790;
    }
    pagina.push(linea);
    puntos -= alto;
  }
  if (pagina.length) paginas.push(pagina);

  const fuenteNormal = 3 + paginas.length * 2;
  const fuenteNegrita = fuenteNormal + 1;
  const cuerpos: Buffer[] = [];
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  for (let i = 0; i < paginas.length; i++) {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    contentIds.push(contentId);
    let y = 790;
    let contenido = '';
    for (const linea of paginas[i]) {
      const size = linea.tamano ?? 10;
      y -= size + 3;
      const font = linea.negrita ? 'F2' : 'F1';
      contenido += `BT /${font} ${size} Tf 1 0 0 1 48 ${y} Tm (${literalPdf(linea.texto)}) Tj ET\n`;
      y -= 4 + (linea.espacio ?? 0);
    }
    contenido += `BT /F1 9 Tf 1 0 0 1 48 30 Tm (DOCUMENTO DEMOSTRATIVO - SIN VALIDEZ FISCAL | Pagina ${i + 1} de ${paginas.length}) Tj ET\n`;
    cuerpos.push(Buffer.from(contenido, 'latin1'));
  }

  const objetos: Buffer[] = [];
  objetos[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'ascii');
  objetos[2] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`, 'ascii');
  for (let i = 0; i < paginas.length; i++) {
    objetos[pageIds[i]] = Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fuenteNormal} 0 R /F2 ${fuenteNegrita} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`,
      'ascii',
    );
    const stream = cuerpos[i];
    objetos[contentIds[i]] = Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, 'ascii'),
      stream,
      Buffer.from('endstream', 'ascii'),
    ]);
  }
  objetos[fuenteNormal] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', 'ascii');
  objetos[fuenteNegrita] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>', 'ascii');

  const partes: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = new Array(objetos.length).fill(0);
  let longitud = partes[0].length;
  for (let id = 1; id < objetos.length; id++) {
    offsets[id] = longitud;
    const objeto = Buffer.concat([
      Buffer.from(`${id} 0 obj\n`, 'ascii'),
      objetos[id],
      Buffer.from('\nendobj\n', 'ascii'),
    ]);
    partes.push(objeto);
    longitud += objeto.length;
  }
  const inicioXref = longitud;
  let xref = `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objetos.length; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
  partes.push(Buffer.from(xref, 'ascii'));
  return Buffer.concat(partes);
}
