-- Migracion de las tablas que existen en dbAlan.dump y faltan en dbCarlos.
-- Ejecutar conectado a la base de datos pos_olimpo de Carlos.
-- El dump de Alan contiene 0 registros en las tres tablas; no se agregan filas.

BEGIN;

CREATE TABLE public.cuentas_bancarias (
    id bigint GENERATED ALWAYS AS IDENTITY,
    id_sucursal bigint,
    alias character varying(80) NOT NULL,
    banco character varying(100) NOT NULL,
    titular character varying(200) NOT NULL,
    tipo_cuenta character varying(30) DEFAULT 'Cuenta'::character varying NOT NULL,
    numero_cuenta character varying(30),
    clabe character varying(18),
    moneda character varying(3) DEFAULT 'MXN'::character varying NOT NULL,
    forma_pago character varying(100),
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cuentas_bancarias_clabe_formato
        CHECK (clabe IS NULL OR clabe::text ~ '^[0-9]{18}$'::text),
    CONSTRAINT cuentas_bancarias_pkey PRIMARY KEY (id),
    CONSTRAINT cuentas_bancarias_id_sucursal_fkey
        FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE RESTRICT
);

CREATE INDEX cuentas_bancarias_sucursal_activas_idx
    ON public.cuentas_bancarias USING btree (id_sucursal, activa, banco, alias);

CREATE TABLE public.datos_facturacion_empresa (
    id smallint DEFAULT 1 NOT NULL,
    razon_social character varying(300) DEFAULT ''::character varying NOT NULL,
    rfc character varying(13) DEFAULT ''::character varying NOT NULL,
    regimen_fiscal character varying(3) DEFAULT ''::character varying NOT NULL,
    codigo_postal character(5) DEFAULT ''::bpchar NOT NULL,
    calle character varying(150) DEFAULT ''::character varying NOT NULL,
    numero_exterior character varying(20) DEFAULT ''::character varying NOT NULL,
    numero_interior character varying(20),
    colonia character varying(100),
    municipio character varying(100),
    estado character varying(100),
    correo character varying(254),
    telefono character varying(20),
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT datos_facturacion_empresa_id_check CHECK (id = 1),
    CONSTRAINT datos_facturacion_empresa_pkey PRIMARY KEY (id)
);

CREATE TABLE public.facturas_v3_obsoleta (
    id bigint NOT NULL,
    id_sucursal bigint NOT NULL,
    folio_completo character varying(20) NOT NULL,
    uuid_fiscal uuid DEFAULT gen_random_uuid() NOT NULL,
    rfc_cliente character varying(13) DEFAULT 'XAXX010101000'::character varying,
    nombre_cliente character varying(150) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    impuesto_iva numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    metodo_pago character varying(30) DEFAULT 'EFECTIVO'::character varying,
    fecha_emision timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'EMITIDA'::character varying,
    CONSTRAINT facturas_v3_obsoleta_pkey PRIMARY KEY (id),
    CONSTRAINT fk_facturas_sucursal
        FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE RESTRICT
);

-- Datos de dbAlan.dump: 0 filas en cuentas_bancarias,
-- datos_facturacion_empresa y facturas_v3_obsoleta.

COMMIT;
