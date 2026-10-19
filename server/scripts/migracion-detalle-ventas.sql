-- Restaura la tabla ausente que necesita POST /api/ventas.
-- CREATE TABLE IF NOT EXISTS permite ejecutar este ajuste una sola vez o repetirlo.
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_venta bigint NOT NULL,
    id_producto bigint NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal_linea numeric(12,2) NOT NULL,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta) REFERENCES public.ventas(id) ON DELETE CASCADE
);
