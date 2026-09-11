# Contexto del proyecto — Punto de Venta "OLIMPO"

## Qué es este proyecto

Sistema web de Punto de Venta e Inventarios para joyerías, desarrollado como proyecto académico de Ingeniería de Software (Universidad de Colima, Facultad de Ingeniería Electromecánica, grupo 3-E), Manzanillo, Colima.

**Repositorio:** github.com/CharlieTech07/PUNTO-DE-VENTA-JOYERIA

**Objetivo general:** automatizar ventas, control de stock, seguimiento de apartados y control de accesos por roles, en un periodo de 4 meses.

**Equipo (Equipo 5):**
- Argüellez Ruiz Carlos Arturo — líder de equipo
- Amador Benítez Juan
- Escobar Nuñez Cristian Alexander — (yo, quien te da este contexto)
- Ibarra Figueroa Jesús Enrique
- Juárez Cano Alan Yakxel

**Metodología:** Scrumban (Scrum + Kanban). Sprints cortos, tablero Kanban con columnas pendiente / en proceso / finalizado. Cada miembro trabaja en su propia rama y se integra vía pull requests.

---

## Stack tecnológico (ya definido, no proponer alternativas)

| Capa | Tecnología |
|---|---|
| Frontend | **Angular** + **TypeScript** (HTML/CSS gestionados a través de Angular) |
| Backend | **Node.js** + **TypeScript** |
| Base de datos | **PostgreSQL** |
| API | RESTful |
| Editor | Visual Studio Code |
| Control de versiones | Git + GitHub |
| Diseño de interfaces / prototipado | Lovable |
| Cronogramas | Canva |

**Importante:** el frontend es **Angular, no React**. No usar conceptos de React (hooks, context, JSX). Usar las convenciones de Angular: componentes, servicios, guards, pipes, módulos, RxJS/Observables, formularios reactivos.

---

## Estructura de carpetas

```
PUNTO-DE-VENTA-JOYERIA/
├── backend/
│   ├── src/
│   │   ├── controllers/     # reciben la petición HTTP, delegan a services, responden
│   │   ├── services/        # lógica de negocio (cálculo de precios, validación de stock, reglas de apartado)
│   │   ├── models/          # entidades / esquemas de PostgreSQL
│   │   ├── routes/          # definición de endpoints REST
│   │   ├── middlewares/     # autenticación, RBAC, validación, manejo de errores
│   │   ├── config/          # conexión a PostgreSQL, variables de entorno
│   │   └── utils/           # funciones auxiliares reutilizables
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                # proyecto Angular (generado con Angular CLI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # componentes reutilizables de UI
│   │   │   ├── pages/       # vistas principales (login, caja, inventario, apartados, reportes)
│   │   │   ├── services/    # servicios que consumen la API del backend (HttpClient)
│   │   │   ├── guards/      # protección de rutas por rol (RBAC en el frontend)
│   │   │   ├── models/      # interfaces TypeScript de las entidades
│   │   │   └── pipes/       # transformaciones de datos en plantillas (formato de moneda, peso, etc.)
│   │   ├── assets/
│   │   └── styles/
│   ├── angular.json
│   └── package.json
│
├── docs/
│   ├── imagenes/            # capturas de avance / mockups (documentación, no parte de la app)
│   ├── protocolo/
│   └── minutas-semanales/
│
├── .gitignore
└── README.md
```

**Reglas de arquitectura del backend (capas):**
- `controllers` NO deben tener lógica de negocio — solo reciben, delegan a `services` y responden
- `services` es donde vive el cálculo y las reglas de negocio
- `models` solo define estructura de datos, no lógica

---

## Módulos del sistema

Acceso (login), Productos, Caja (ventas), Inventario, Apartados, Reportes.

---

## Entidades principales de la base de datos

`usuarios`, `roles`, `productos`, `existencias`, `ventas`, `detalles_venta`, `clientes`, `apartados`, `pagos`.

---

## Reglas de negocio específicas de la joyería (no es un POS genérico)

1. **Inventario de alto valor y piezas diferenciadas**: el control debe ser riguroso por el elevado valor de la mercancía. Cada pieza necesita: identificador único, peso, tipo de metal, quilataje, piedras (si aplica), costo de adquisición.

2. **Precio dinámico por fluctuación del metal**: el precio de los metales preciosos cambia constantemente, y ese cambio debe reflejarse de forma inmediata en el punto de venta. El precio NO debe quedar hardcodeado por pieza — se calcula a partir del valor vigente del metal. Fórmula base:
   ```
   precio = (peso_gramos × precio_metal_del_día) + costo_mano_de_obra + valor_piedras + margen
   ```

3. **Apartados (layaway)**: el cliente da un anticipo, la pieza queda bloqueada del inventario disponible, y hay un calendario de abonos con fecha límite. Si vence el plazo sin liquidar, el sistema debe permitir liberar la pieza.

4. **Actualización de stock en tiempo real**: evitar discrepancias entre stock físico y registrado.

5. **Roles del sistema (RBAC) — estos tres, no otros**:
   - `administrador`: gestiona catálogos y usuarios
   - `gerente`: supervisa inventario, precios y reportes
   - `cajero`: realiza operaciones de venta y consultas autorizadas

   Se aplica el **principio de mínimo privilegio**: cada perfil accede solo a lo necesario para su responsabilidad.

6. **Bitácora de auditoría**: toda acción sensible (cancelación de venta, edición de precio, descuento, baja de inventario) debe registrarse con usuario, fecha/hora, acción, detalle y quién autorizó. Requisito de diseño, no opcional.

---

## Seguridad — requisitos no negociables

- Contraseñas SIEMPRE con hash (bcrypt o Argon2), nunca texto plano ni MD5/SHA1 solo
- Nunca concatenar strings del usuario en queries SQL — usar queries parametrizadas u ORM (prevención de SQL injection)
- Nunca almacenar número completo de tarjeta, CVV o pista magnética. Si se simula pago con tarjeta, usar datos claramente ficticios
- Validación SIEMPRE en el backend, nunca confiar solo en la validación del frontend
- RBAC aplicado en el **backend** (middlewares), no solo ocultando botones o rutas en Angular — los guards de Angular son UX, no seguridad
- Credenciales y variables sensibles en `.env`, nunca en el repo. Usar `.env.example` como plantilla sin datos reales
- Protección contra XSS y CSRF en la aplicación web

---

## Calidad y pruebas

Se sigue el modelo de calidad **ISO/IEC 25010:2023**, priorizando: adecuación funcional, eficiencia de desempeño, compatibilidad, capacidad de interacción, confiabilidad, seguridad, mantenibilidad y flexibilidad.

Tipos de prueba contemplados: **unitarias, de integración y de usabilidad**.

---

## Estado actual del proyecto

- Estructura de carpetas definida, en proceso de aplicarse en el repo
- Documentación de protocolo, cronograma y minutas ya iniciada en `docs/`
- Diagrama de casos de uso elaborado
- Código aún no desarrollado — el siguiente paso es repartir módulos del backend entre el equipo por sprint

---

## Cómo debe trabajar Claude Code en este proyecto

- **Explicar todo en español** — el equipo y la documentación del proyecto son en español
- Respetar la separación de capas del backend (controllers / services / models)
- Usar convenciones de **Angular**, no de React, en todo lo relacionado al frontend
- Al crear un módulo nuevo (ventas, inventario, usuarios, apartados), seguir el mismo patrón de carpetas ya establecido
- Aplicar siempre las reglas de seguridad de este documento sin que se le tengan que repetir
- Al generar datos de prueba, nunca usar formatos que parezcan datos reales de tarjetas o identificaciones
- Los tres roles del sistema son administrador, gerente y cajero — no inventar otros
