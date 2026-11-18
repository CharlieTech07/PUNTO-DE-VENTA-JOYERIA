-- Turnos de caja y movimientos manuales.
-- Ejecutar después de migracion-pagos.sql en pos_olimpo.
BEGIN;

CREATE TABLE IF NOT EXISTS public.caja_turnos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_sucursal bigint NOT NULL REFERENCES public.sucursales(id),
  id_usuario_apertura bigint NOT NULL REFERENCES public.usuarios(id),
  id_usuario_cierre bigint REFERENCES public.usuarios(id),
  estado varchar(10) NOT NULL DEFAULT 'abierta'
    CHECK (estado IN ('abierta', 'cerrada')),
  efectivo_inicial numeric(12, 2) NOT NULL CHECK (efectivo_inicial >= 0),
  ventas_efectivo numeric(12, 2) NOT NULL DEFAULT 0,
  ventas_tarjeta numeric(12, 2) NOT NULL DEFAULT 0,
  ventas_transferencia numeric(12, 2) NOT NULL DEFAULT 0,
  ingresos numeric(12, 2) NOT NULL DEFAULT 0,
  egresos numeric(12, 2) NOT NULL DEFAULT 0,
  efectivo_esperado numeric(12, 2),
  efectivo_contado numeric(12, 2),
  diferencia numeric(12, 2),
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  fecha_cierre timestamptz,
  CONSTRAINT caja_turno_cierre_consistente CHECK (
    (estado = 'abierta' AND fecha_cierre IS NULL AND efectivo_contado IS NULL AND diferencia IS NULL)
    OR
    (estado = 'cerrada' AND fecha_cierre IS NOT NULL AND efectivo_contado IS NOT NULL AND diferencia IS NOT NULL)
  )
);

-- Cada persona puede tener una sola caja abierta al mismo tiempo.
CREATE UNIQUE INDEX IF NOT EXISTS caja_turnos_una_abierta_por_usuario
  ON public.caja_turnos (id_usuario_apertura) WHERE estado = 'abierta';
CREATE INDEX IF NOT EXISTS caja_turnos_sucursal_fecha
  ON public.caja_turnos (id_sucursal, fecha_apertura DESC);

CREATE TABLE IF NOT EXISTS public.caja_movimientos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_turno bigint NOT NULL REFERENCES public.caja_turnos(id),
  id_usuario bigint NOT NULL REFERENCES public.usuarios(id),
  tipo varchar(10) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
  monto numeric(12, 2) NOT NULL CHECK (monto > 0),
  motivo varchar(240) NOT NULL CHECK (length(trim(motivo)) > 0),
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS caja_movimientos_turno_fecha
  ON public.caja_movimientos (id_turno, fecha);

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_caja_turno bigint;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ventas_caja_turno_fk'
  ) THEN
    ALTER TABLE public.ventas
      ADD CONSTRAINT ventas_caja_turno_fk
      FOREIGN KEY (id_caja_turno) REFERENCES public.caja_turnos(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS ventas_id_caja_turno ON public.ventas (id_caja_turno);

COMMIT;
