-- Ejecutar una sola vez desde Query Tool de pgAdmin en pos_olimpo.
-- Cambia los correos y las tres contraseñas antes de ejecutar.
-- Las contraseñas se guardan como bcrypt, compatibles con el login del proyecto.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_nombre_sucursal text := 'Centro';
  v_direccion_sucursal text := 'Domicilio por configurar';

  v_admin_correo text := 'CAMBIAR_admin@olimpo.local';
  v_admin_password text := 'CAMBIAR_admin';

  v_gerente_correo text := 'CAMBIAR_gerente@olimpo.local';
  v_gerente_password text := 'CAMBIAR_gerente';

  v_cajero_correo text := 'CAMBIAR_cajero@olimpo.local';
  v_cajero_password text := 'CAMBIAR_cajero';

  v_sucursal_id bigint;
BEGIN
  IF v_admin_password LIKE 'CAMBIAR_%'
    OR v_gerente_password LIKE 'CAMBIAR_%'
    OR v_cajero_password LIKE 'CAMBIAR_%' THEN
    RAISE EXCEPTION 'Edita las tres contraseñas de ejemplo antes de ejecutar este script.';
  END IF;

  SELECT id INTO v_sucursal_id
  FROM public.sucursales
  WHERE lower(nombre) = lower(v_nombre_sucursal) AND activa = true
  ORDER BY id
  LIMIT 1;

  IF v_sucursal_id IS NULL THEN
    INSERT INTO public.sucursales (nombre, direccion, activa)
    VALUES (v_nombre_sucursal, v_direccion_sucursal, true)
    RETURNING id INTO v_sucursal_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.usuarios WHERE rol = 'Administrador'::public.rol_usuario) THEN
    RAISE EXCEPTION 'Ya existe un Administrador global. El esquema permite solo uno.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE rol = 'Gerente'::public.rol_usuario AND id_sucursal = v_sucursal_id
  ) THEN
    RAISE EXCEPTION 'Ya existe un Gerente asignado a la sucursal %.', v_nombre_sucursal;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE lower(correo) IN (lower(v_admin_correo), lower(v_gerente_correo), lower(v_cajero_correo))
  ) THEN
    RAISE EXCEPTION 'Uno de los correos indicados ya está registrado. Usa correos distintos.';
  END IF;

  INSERT INTO public.usuarios
    (id_sucursal, nombres, apellido_paterno, correo, contrasena_hash, rol, activo)
  VALUES
    (NULL, 'Administrador', 'Global', lower(v_admin_correo), crypt(v_admin_password, gen_salt('bf', 10)), 'Administrador', true),
    (v_sucursal_id, 'Gerente', 'Sucursal', lower(v_gerente_correo), crypt(v_gerente_password, gen_salt('bf', 10)), 'Gerente', true),
    (v_sucursal_id, 'Cajero', 'Sucursal', lower(v_cajero_correo), crypt(v_cajero_password, gen_salt('bf', 10)), 'Cajero', true);

  RAISE NOTICE 'Usuarios iniciales creados. Sucursal asignada: % (id=%).', v_nombre_sucursal, v_sucursal_id;
END;
$$;
