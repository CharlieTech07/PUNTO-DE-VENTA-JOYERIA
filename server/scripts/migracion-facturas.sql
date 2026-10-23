-- server/scripts/migracion-facturas.sql
-- Facturas de venta. Se puede correr mas de una vez sin romper nada.

-- Candado: si ya existe una tabla facturas con otra estructura (sin id_venta), se detiene.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'facturas')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'facturas'
                         AND column_name = 'id_venta') THEN
        RAISE EXCEPTION 'Ya existe public.facturas con otra estructura (sin id_venta).';
    END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS public.seq_folio_factura;

CREATE TABLE IF NOT EXISTS public.facturas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    serie varchar(5) NOT NULL DEFAULT 'F',
    folio bigint NOT NULL UNIQUE DEFAULT nextval('public.seq_folio_factura'),
    id_venta bigint NOT NULL REFERENCES public.ventas(id) ON DELETE RESTRICT,
    id_sucursal bigint NOT NULL REFERENCES public.sucursales(id),
    id_usuario bigint NOT NULL REFERENCES public.usuarios(id),
    fecha_emision timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Copia de los datos del receptor, como los capturo el formulario
    rfc_receptor varchar(13) NOT NULL,
    nombre_receptor varchar(300) NOT NULL,
    cp_receptor char(5) NOT NULL,
    regimen_fiscal char(3) NOT NULL,
    uso_cfdi char(3) NOT NULL,
    correo_receptor varchar(254) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    iva numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    estado varchar(10) NOT NULL DEFAULT 'Emitida'
        CHECK (estado IN ('Emitida', 'Cancelada')),
    motivo_cancelacion text,
    cancelada_por bigint REFERENCES public.usuarios(id),
    cancelada_en timestamp,
    -- Una factura cancelada siempre dice quien, cuando y por que
    CHECK (estado = 'Emitida' OR (motivo_cancelacion IS NOT NULL
        AND cancelada_por IS NOT NULL AND cancelada_en IS NOT NULL))
);

-- Una venta solo puede tener una factura vigente
CREATE UNIQUE INDEX IF NOT EXISTS facturas_una_vigente_por_venta
    ON public.facturas (id_venta) WHERE estado = 'Emitida';

CREATE TABLE IF NOT EXISTS public.detalle_facturas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura bigint NOT NULL REFERENCES public.facturas(id) ON DELETE RESTRICT,
    descripcion text NOT NULL,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    valor_unitario numeric(12,2) NOT NULL, -- sin IVA
    importe numeric(12,2) NOT NULL         -- sin IVA
);
