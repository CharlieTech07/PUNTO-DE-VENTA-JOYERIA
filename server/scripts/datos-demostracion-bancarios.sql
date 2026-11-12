-- Datos totalmente ficticios para una demostración escolar.
-- Ejecuta solo después de migracion-datos-bancarios-fiscales.sql en pos_olimpo.
-- La CLABE usada es una secuencia de prueba y no debe usarse para transferencias.

-- Solo completa los datos del emisor si aún están vacíos; nunca reemplaza datos ya capturados.
INSERT INTO public.datos_facturacion_empresa
  (id, razon_social, rfc, regimen_fiscal, codigo_postal, calle, numero_exterior,
   colonia, municipio, estado, correo, telefono)
VALUES
  (1, 'OLIMPO JOYERIA - DEMOSTRACION', 'DEMO000000XXX', '616', '06000',
   'Avenida de la Muestra', '123', 'Centro de Prueba', 'Cuauhtemoc',
   'Ciudad de Mexico', 'facturacion.demo@example.invalid', '5500000000')
ON CONFLICT (id) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  rfc = EXCLUDED.rfc,
  regimen_fiscal = EXCLUDED.regimen_fiscal,
  codigo_postal = EXCLUDED.codigo_postal,
  calle = EXCLUDED.calle,
  numero_exterior = EXCLUDED.numero_exterior,
  colonia = EXCLUDED.colonia,
  municipio = EXCLUDED.municipio,
  estado = EXCLUDED.estado,
  correo = EXCLUDED.correo,
  telefono = EXCLUDED.telefono,
  actualizado_en = now()
WHERE public.datos_facturacion_empresa.razon_social = ''
  AND public.datos_facturacion_empresa.rfc = '';

INSERT INTO public.cuentas_bancarias
  (id_sucursal, alias, banco, titular, tipo_cuenta, numero_cuenta, clabe, moneda, forma_pago)
SELECT s.id,
       'DEMO · Cuenta de muestra',
       'Banco de ejemplo (ficticio)',
       'Olimpo Joyería (datos de muestra)',
       'Cuenta',
       '0000000001',
       '000000000000000001',
       'MXN',
       'Transferencia de muestra'
FROM public.sucursales s
WHERE NOT EXISTS (
  SELECT 1 FROM public.cuentas_bancarias cb
  WHERE cb.id_sucursal = s.id AND cb.alias = 'DEMO · Cuenta de muestra'
);
