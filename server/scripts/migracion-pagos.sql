-- Pagos de cada venta: con qué se cobró (efectivo, tarjeta de débito o de crédito,
-- transferencia) y cuánto. Una venta puede llevar varios pagos (pago mixto).
-- Ejecutar una sola vez desde Query Tool de pgAdmin en pos_olimpo, después de
-- migracion-facturas.sql. Se puede repetir sin error.
--
-- De la tarjeta solo se guarda el número de autorización del voucher (4 a 12 números):
-- nunca el número de la tarjeta. ventas.metodo_pago se sigue llenando como antes
-- (efectivo, tarjeta, transferencia o mixto). Que los pagos sumen el total de la venta
-- lo revisa el servidor (server/src/services/pagos.service.ts).

BEGIN;

CREATE TABLE IF NOT EXISTS public.pagos_venta (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_venta bigint NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  metodo varchar(20) NOT NULL,
  monto numeric(12, 2) NOT NULL,
  recibido numeric(12, 2),
  cambio numeric(12, 2),
  referencia varchar(30),
  meses smallint NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pagos_venta_metodo_valido
    CHECK (metodo IN ('efectivo', 'debito', 'credito', 'transferencia')),
  CONSTRAINT pagos_venta_monto_positivo CHECK (monto > 0),
  -- El efectivo guarda cuánto dio el cliente y el cambio; los demás no llevan
  CONSTRAINT pagos_venta_recibido_efectivo CHECK (
    (metodo = 'efectivo' AND recibido IS NOT NULL AND cambio IS NOT NULL
      AND recibido >= monto AND cambio = recibido - monto)
    OR (metodo <> 'efectivo' AND recibido IS NULL AND cambio IS NULL)),
  -- Tarjeta: autorización del voucher. Transferencia: clave de rastreo o referencia
  CONSTRAINT pagos_venta_referencia_valida CHECK (
    (metodo = 'efectivo' AND referencia IS NULL)
    OR (metodo IN ('debito', 'credito') AND referencia IS NOT NULL
      AND referencia ~ '^[0-9]{4,12}$')
    OR (metodo = 'transferencia' AND referencia IS NOT NULL
      AND referencia ~ '^[A-Z0-9-]{6,30}$')),
  -- Meses sin intereses: solo con tarjeta de crédito
  CONSTRAINT pagos_venta_meses_validos CHECK (
    meses = 0 OR (metodo = 'credito' AND meses IN (3, 6, 12)))
);

CREATE INDEX IF NOT EXISTS pagos_venta_id_venta ON public.pagos_venta (id_venta);

COMMIT;
