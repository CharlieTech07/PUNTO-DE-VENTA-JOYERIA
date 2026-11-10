-- Configuración global del negocio: datos fiscales del emisor y cuentas bancarias.
-- Ejecutar una sola vez en la base pos_olimpo. CREATE TABLE IF NOT EXISTS permite
-- volver a ejecutarlo si las tablas ya existen.

CREATE TABLE IF NOT EXISTS public.datos_facturacion_empresa (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razon_social varchar(300) NOT NULL DEFAULT '',
  rfc varchar(13) NOT NULL DEFAULT '',
  regimen_fiscal varchar(3) NOT NULL DEFAULT '',
  codigo_postal char(5) NOT NULL DEFAULT '',
  calle varchar(150) NOT NULL DEFAULT '',
  numero_exterior varchar(20) NOT NULL DEFAULT '',
  numero_interior varchar(20),
  colonia varchar(100),
  municipio varchar(100),
  estado varchar(100),
  correo varchar(254),
  telefono varchar(20),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_sucursal bigint REFERENCES public.sucursales(id) ON DELETE RESTRICT,
  alias varchar(80) NOT NULL,
  banco varchar(100) NOT NULL,
  titular varchar(200) NOT NULL,
  tipo_cuenta varchar(30) NOT NULL DEFAULT 'Cuenta',
  numero_cuenta varchar(30),
  clabe varchar(18),
  moneda varchar(3) NOT NULL DEFAULT 'MXN',
  forma_pago varchar(100),
  activa boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cuentas_bancarias_clabe_formato CHECK (clabe IS NULL OR clabe ~ '^[0-9]{18}$')
);

ALTER TABLE public.cuentas_bancarias
  ADD COLUMN IF NOT EXISTS id_sucursal bigint REFERENCES public.sucursales(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS cuentas_bancarias_sucursal_activas_idx
  ON public.cuentas_bancarias (id_sucursal, activa, banco, alias);
