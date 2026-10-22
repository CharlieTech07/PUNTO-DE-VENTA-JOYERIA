// client/src/models/permisos.ts
// Única fuente de verdad de qué módulos puede ver cada rol.
// El servidor vuelve a validar cada acción, esto solo controla lo que se muestra.
export type RolUsuario = 'Administrador' | 'Gerente' | 'Cajero';

// El orden de cada lista es el orden en que aparecen en el menú (después de Home).
export const VISTAS_POR_ROL: Record<RolUsuario, string[]> = {
  Administrador: ['productos', 'sucursales', 'empleados', 'metal', 'apartados'],
  Gerente: ['inventario', 'sucursales', 'empleados', 'metal', 'apartados'],
  Cajero: ['metal', 'apartados']
};

export function puedeVer(rol: string | null | undefined, vista: string): boolean {
  if (!rol || !(rol in VISTAS_POR_ROL)) return false;
  return VISTAS_POR_ROL[rol as RolUsuario].includes(vista);
}

export function primeraVistaPermitida(rol: string | null | undefined): string {
  if (!rol || !(rol in VISTAS_POR_ROL)) return 'apartados';
  return VISTAS_POR_ROL[rol as RolUsuario][0];
}
