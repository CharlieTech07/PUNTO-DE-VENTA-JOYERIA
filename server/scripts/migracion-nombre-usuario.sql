-- Agrega el nombre de usuario, que es con lo que ahora se entra al sistema (ya no con el correo).
-- Ejecutar una sola vez desde Query Tool de pgAdmin en pos_olimpo.
-- Si todavía no corren crear-usuarios-iniciales.sql, córranlo antes que este.
--
-- A los usuarios que ya existen se les pone como usuario la parte de su correo antes de la @
-- (ej. camila.torres@gmail.com -> camila.torres). Si dos quedan iguales, se les agrega su id.
-- Al final se listan, para avisarle a cada quien con qué usuario entra.

BEGIN;

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nombre_usuario varchar(30);

WITH base AS (
  SELECT id, left(lower(regexp_replace(split_part(correo, '@', 1), '[^a-zA-Z0-9._]', '', 'g')), 24) AS sugerido
  FROM public.usuarios
  WHERE nombre_usuario IS NULL
), contados AS (
  SELECT id, sugerido, count(*) OVER (PARTITION BY sugerido) AS repetidos FROM base
)
UPDATE public.usuarios u
SET nombre_usuario = CASE
  WHEN length(c.sugerido) < 3 THEN 'usuario' || u.id
  WHEN c.repetidos > 1 THEN c.sugerido || u.id
  ELSE c.sugerido
END
FROM contados c
WHERE u.id = c.id;

ALTER TABLE public.usuarios ALTER COLUMN nombre_usuario SET NOT NULL;

-- Minúsculas, números, punto y guion bajo, de 3 a 30 caracteres (lo mismo que valida el servidor)
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_nombre_usuario_formato;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_nombre_usuario_formato
  CHECK (nombre_usuario ~ '^[a-z0-9._]{3,30}$');

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_nombre_usuario_unico ON public.usuarios (nombre_usuario);

COMMIT;

SELECT id, nombres, apellido_paterno, correo, nombre_usuario
FROM public.usuarios
ORDER BY id;
