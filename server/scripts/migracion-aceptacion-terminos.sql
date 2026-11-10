-- Registro de quién leyó y aceptó los términos de uso y el aviso de privacidad.
-- Ejecutar una sola vez desde Query Tool de pgAdmin en pos_olimpo, después de
-- migracion-nombre-usuario.sql. Se puede repetir sin error.
--
-- Cada empleado acepta desde el enlace personal del correo de bienvenida o, si no lo
-- usó, la primera vez que entra al sistema. Cuando cambian los textos se sube la versión
-- (VERSION_TERMINOS en server/src/services/terminos.service.ts) y se les vuelve a pedir.

BEGIN;

CREATE TABLE IF NOT EXISTS public.aceptaciones_terminos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  version varchar(20) NOT NULL,
  aceptado_en timestamptz NOT NULL DEFAULT now(),
  medio varchar(20) NOT NULL,
  ip varchar(64),
  navegador varchar(300),
  CONSTRAINT aceptaciones_medio_valido CHECK (medio IN ('correo', 'primer_acceso')),
  CONSTRAINT aceptaciones_una_por_version UNIQUE (id_usuario, version)
);

-- Enlace personal del correo. Se guarda solo su huella (SHA-256), como una contraseña,
-- y vence a los 30 días. Si lo abren otra vez después de confirmar, solo muestra la fecha.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS clave_terminos_hash char(64);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS clave_terminos_vence timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_clave_terminos_unica
  ON public.usuarios (clave_terminos_hash) WHERE clave_terminos_hash IS NOT NULL;

COMMIT;
