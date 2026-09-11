# AGENTS.md

## Proyecto
Este repositorio contiene un sistema de punto de venta para joyería llamado POS Olimpo, con:
- Frontend en Angular en `client/`
- Backend en Express + TypeScript en `server/`
- Base de datos Postgres con acceso desde el servidor

## Objetivos del agente
- Mantener una estructura limpia y consistente entre frontend y backend.
- Priorizar soluciones útiles para ventas, inventario y control de stock.
- Trabajar en español si no se indica otra cosa.
- Respetar la separación de responsabilidades: componentes y lógica del cliente en Angular, y servicios/API en Express.

## Convenciones
- No introducir cambios ajenos al alcance de la tarea actual.
- Mantener nombres descriptivos, camelCase en TypeScript y estructura clara por módulos.
- Si hay que crear endpoints, mantener validación básica y manejo de errores.
- Si se modifica el frontend, revisar compatibilidad con Angular 22 y TypeScript.
- Si se modifica el backend, mantener TypeScript y configuración de Node/Express coherentes.

## Verificación recomendada
Antes de cerrar cambios relevantes:
- Frontend: ejecutar `npm run build` dentro de `client/`
- Backend: ejecutar `npx tsc --noEmit` dentro de `server/`
- Si se agrega lógica de negocio importante, probar el flujo más cercano a la operación real.

## Alcance sugerido
- Mejoras en flujo de ventas, inventario y control de productos.
- Corrección de errores en UI, formularios, validaciones y API.
- Refactorización menor enfocada en legibilidad y mantenibilidad.

## Reglas clave
- No inventar dependencias innecesarias.
- No ocultar errores ni crear soluciones frágiles.
- Documentar cambios importantes si afectan la operación del sistema.
