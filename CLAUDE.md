# Contexto del proyecto — Punto de Venta "OLIMPO"

## Qué es este proyecto

Sistema web de Punto de Venta e Inventarios para joyerías, desarrollado como proyecto académico de Ingeniería de Software (Universidad de Colima, Facultad de Ingeniería Electromecánica, grupo 3-E), Manzanillo, Colima.

**Repositorio:** github.com/CharlieTech07/PUNTO-DE-VENTA-JOYERIA

**Objetivo general:** automatizar ventas, control de stock, seguimiento de apartados y control de accesos por roles, en un periodo de 4 meses.

**Equipo (Equipo 5):**
- Argüellez Ruiz Carlos Arturo — líder de equipo
- Amador Benítez Juan
- Escobar Nuñez Cristian Alexander — 
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

**Estado real en el repo ahora mismo** (lo de `main`, la rama de Carlos, más la maqueta del dashboard hecha en la rama `Cristian`):

```
PUNTO-DE-VENTA-JOYERIA/
├── server/                  # backend (Node.js + TypeScript, Express)
│   ├── src/
│   │   ├── db.ts            # conexión a PostgreSQL
│   │   ├── index.ts         # entrypoint del servidor Express
│   │   └── routes/          # auth, caja, clientes, inventario, productos, ventas
│   ├── tsconfig.json
│   └── package.json
│
├── client/                  # frontend Angular (generado con Angular CLI, SIN carpeta app/)
│   ├── src/
│   │   ├── components/      # menu, modal, navbar, tabla (por ahora .html vacíos)
│   │   ├── pages/           # clientes, inicio, inventario, login, productos, ventas
│   │   │   └── dashboard/   # maqueta del panel de administración (ver abajo)
│   │   ├── services/        # auth, caja, clientes, productos, ventas (consumen la API)
│   │   ├── models/          # interfaces TS: cliente, producto, usuario, venta
│   │   └── styles/
│   │       └── global.css
│   ├── public/
│   │   ├── logo.png         # emblema de la joyería, con transparencia real
│   │   └── favicon.ico
│   ├── angular.json
│   ├── tsconfig.app.json
│   └── package.json
│
├── docs/
│   ├── img/                 # capturas de avance / mockups
│   └── minutas-semanales/   # minutas en .docx
│
├── AGENTS.md                # contexto de proyecto para otros agentes/herramientas de IA
├── .github/chatmodes/       # chatmode de Carlos para este repo
├── .gitignore
└── README.md
```

**Importante:** `server/src/routes/*.ts` todavía tienen datos de prueba embebidos directamente en el handler (sin `controllers/services/models` separados) — es un scaffold inicial de Carlos, no el diseño final. Cuando se implemente lógica de negocio real ahí, sí debe separarse en capas (ver regla de abajo) en vez de seguir agregándola directo en las rutas. Tampoco existen ya `client/src/index.html`, `main.ts` ni el componente raíz (`app.ts`/`app.html`/`app.config.ts`/`app.routes.ts`) — Carlos los quitó al reestructurar; probablemente haga falta recrearlos para que la app Angular arranque, coméntalo si te pones a tocar `client/`.

**Reglas de arquitectura del backend (capas):**
- Cuando existan `controllers`/`services`/`models` en `server/src/`: `controllers` NO deben tener lógica de negocio — solo reciben, delegan a `services` y responden
- `services` es donde vive el cálculo y las reglas de negocio
- `models` solo define estructura de datos, no lógica
- No crear esas carpetas vacías por adelantado — créalas junto con el primer archivo real que le corresponda a cada capa

---

## El panel de administración (`client/src/pages/dashboard/`)

Maqueta del dashboard: modo oscuro, con el mismo lenguaje visual del punto de venta (café oscuro, dorado, títulos serif). Tiene 8 secciones — resumen, ventas, ingresos, inventario, apartados, empleados, precio del metal y auditoría — con datos ficticios escritos a mano, todavía sin conectar a la API.

| Archivo | Rol |
|---|---|
| `dashboard.ts` | **Código fuente.** Es el archivo que se edita |
| `dashboard.js` | **Generado por `tsc`.** No editar a mano |
| `dashboard.html` | Las 8 secciones |
| `dashboard.css` | Sistema de diseño: tokens, componentes, modo claro y oscuro |
| `tsconfig.json` | Config para compilar solo este archivo (`strict` activado) |

Después de tocar el `.ts`, hay que recompilar:

```
cd client/src/pages/dashboard && npx tsc -p .
```

Detalles que no son obvios y conviene respetar:

- **El menú lateral no vive aquí.** Es el componente de `components/menu/`, que se monta solo con las dos etiquetas del `<head>`. `dashboard.ts` solo se encarga de lo propio del dashboard: cambiar de sección, los filtros y la fecha.
- Como el menú se monta después, sus botones no existen cuando corre `dashboard.ts`. Por eso la navegación se conecta hasta el evento `menu:listo`.
- **No es un componente Angular todavía.** Por eso el `.ts` va envuelto en una función y NO usa `import`/`export`: como módulo ES el navegador lo bloquearía, y además `document.currentScript` deja de funcionar.
- Por lo mismo, `client/tsconfig.app.json` **excluye** los `.ts` de la maqueta. Sin esa exclusión Angular intenta compilarlos y rompe el build, porque `isolatedModules` exige que todo `.ts` sea un módulo.

---

## El menú lateral (`client/src/components/menu/`)

Componente compartido: la barra con las 8 secciones, la tarjeta de usuario y el cambio de modo claro. **Es la única copia** — si le agregas una opción, les aparece a todas las pantallas.

| Archivo | Rol |
|---|---|
| `menu.ts` | **Código fuente.** Trae el marcado y la lógica |
| `menu.js` | **Generado por `tsc`.** No editar a mano |
| `menu.css` | Sus estilos |
| `vista-previa.html` | Para verlo funcionando y copiar el ejemplo |

Para montarlo en una pantalla, dos líneas **en el `<head>`**:

```html
<link rel="stylesheet" href="../../components/menu/menu.css" />
<script src="../../components/menu/menu.js" data-activo="ventas"></script>
```

**Van en el `<head>` a propósito, no al final del `<body>`.** Si se ponen al final, el usuario alcanza a ver dos parpadeos al cambiar de pantalla: el contenido nace pegado a la izquierda y brinca cuando el menú entra, y si venía en modo claro se ve un destello oscuro. Estando en el `<head>`, el CSS reserva el ancho del menú desde el primer pintado y el tema se aplica antes de que el navegador dibuje nada.

**El espacio del menú se reserva con `html body { padding-left }`, no con `body`.** No es un capricho de estilo: varias pantallas declaran `body { padding: 0 }` en su propio CSS, y si ese archivo se enlaza después le gana a la regla del menú y **el contenido se mete debajo de la barra**, quedando cortado por la izquierda. Con `html body` la especificidad es mayor y deja de importar el orden de las hojas de estilo. Si alguien la "simplifica" a `body`, el bug regresa.

No hay que tocar el CSS ni la estructura de la página que lo usa. Cuatro decisiones lo hacen posible:

- **Va en `position: fixed`** y él mismo le pone `padding-left` al `<body>`. Así no depende de si la página usa flex, grid o lo que sea. La vitrina de Alan lo monta así, con una sola línea agregada a su archivo.
- **Resuelve sus rutas contra sí mismo** con `document.currentScript.src`, no contra la página. Por eso funciona sin importar en qué carpeta esté quien lo llama, y el logo siempre carga.
- **Todas sus clases llevan el prefijo `menu-olimpo`** y sus colores van como `var(--token, respaldo)`. Así no choca con el CSS de nadie y se ve bien aunque la pantalla no tenga los tokens del sistema de diseño.
- **El marcado vive dentro de `menu.ts`, no en un `.html` aparte.** Esto NO es capricho: se intentó con un `menu.html` traído por `fetch` y **Live Server lo rompía**. Live Server le inyecta su script de recarga a todo lo que sirve como `.html`, y al ser un fragmento sin `</body>` esa inyección le corta el final: llegaban 3 de los 8 botones. Al tenerlo en el `.ts` no hay petición que se pueda corromper, el menú aparece al instante y la página hasta funciona con doble clic. **Si alguien lo vuelve a separar a un `.html`, va a reaparecer ese bug.**

**Los elementos del menú son enlaces `<a>`, no botones**, porque navegan entre pantallas:

| Sección | A dónde va |
|---|---|
| Home | `pages/inicio/index.html` — la vitrina |
| Las otras 8 | `pages/dashboard/dashboard.html#<seccion>` |

El `href` se calcula en `menu.ts` a partir de `data-destino`, resuelto contra la carpeta del componente. Por eso los enlaces sirven igual desde cualquier pantalla.

**El dashboard cambia de sección con el `#` de la URL.** Si ya estás en el dashboard, el enlace solo cambia el hash: no recarga, dispara `hashchange` y `dashboard.ts` intercambia la sección. Si vienes de Home, la página abre directamente en la sección correcta. Un hash desconocido cae en el resumen.

`data-activo` marca la sección seleccionada cuando la pantalla no maneja hash (como Home). El dashboard no lo usa: se marca solo según el `#`. Para conectar los botones con tu lógica, escucha `menu:listo`:

```ts
document.addEventListener('menu:listo', (evento) => {
  const { menu } = (evento as CustomEvent).detail;
  // cada botón trae data-vista
});
```

Después de tocar el `.ts`: `cd client/src/components/menu && npx tsc -p .`

---

## La paleta compartida (`client/src/styles/tema.css`)

**Es la única fuente de los colores del sistema.** Toda pantalla debe enlazarla **antes** de su propio CSS:

```html
<link rel="stylesheet" href="../../styles/tema.css" />
```

Define los tokens (`--fondo`, `--superficie`, `--oro`, `--texto`…) y sus equivalentes de modo claro bajo `html[data-tema="claro"]`. El botón del menú solo cambia ese atributo en la etiqueta `<html>`, y todas las pantallas que usan los tokens cambian al mismo tiempo.

**El tema elegido se guarda en `localStorage` con la clave `olimpo:tema`**, y `menu.ts` lo vuelve a aplicar al cargar cada pantalla. Sin eso se perdía al navegar, porque cada página es una carga nueva y el atributo del `<html>` se reinicia. Si el navegador no deja usar `localStorage` (modo privado), el tema simplemente dura lo que dure esa pantalla.

**Regla:** si necesitas un color, tómalo de aquí. **No escribas un hex suelto en tu CSS**, porque ese pedazo se va a quedar oscuro cuando alguien active el modo claro.

La vitrina de Alan sigue usando sus nombres de siempre (`--bg-color-dark`, `--card-bg-dark`…), pero ahora apuntan a los tokens compartidos, así que su pantalla se ve igual que el dashboard y responde al modo claro sin haber reescrito su CSS.

Ojo: `client/src/styles/global.css` es una plantilla azul genérica que nadie usa y **no** es la paleta del proyecto. No la confundas con `tema.css`.

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

### Lo que YA funciona (rama `Cristian`, sin subir a GitHub todavía)

- **Dos pantallas navegables entre sí**: Home (la vitrina de Alan, en `pages/inicio/`) y el panel de administración (`pages/dashboard/`, 8 secciones)
- **El menú es un componente compartido** (`components/menu/`), una sola copia, montado con dos líneas en el `<head>` de cada pantalla. Ver su sección arriba
- **Modo claro/oscuro funcionando en las dos pantallas**, y se conserva al navegar (`localStorage`)
- **Paleta unificada** en `styles/tema.css`
- Todo se ve con **Live Server**; nadie abre archivos con doble clic

### Lo que falta

- **Nada consume la API todavía.** Las dos pantallas traen datos ficticios escritos a mano. Los servicios (`services/*.service.ts`) están escritos pero nadie los llama
- **Falta el bootstrap de Angular** (`main.ts`, `index.html`, componente raíz). Se perdió al reestructurar y `angular.json` sigue apuntando a archivos que no existen, así que `ng serve` y `ng build` no arrancan. **Carlos dijo que lo arma él la semana del 22 de septiembre de 2026**, y que ahí se junta todo. Hasta entonces la maqueta vive como HTML/CSS/TS plano
- **Falta `server/.env.example`.** `db.ts` espera `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`, pero no hay plantilla y quien clone no puede conectar la base
- **Sin capas `controllers`/`services`/`models`** en el backend: la lógica sigue directa en las rutas
- **Carlos eliminó las rutas** `auth`, `caja`, `clientes` y `ventas` al reescribir la API. Solo quedan `productos` e `inventario`, así que **el login se quedó sin backend**
- **Error en `server/package.json`**: dice `"types": "module"` (seguramente quiso `"type"`) y más abajo `"type": "commonjs"`, que contradice los imports con `.js` del código
- **El `script.ts` de Alan no está conectado**: su `index.html` no tiene etiqueta `<script>`, los productos están escritos a mano en el HTML, y el `.ts` apunta a imágenes de Unsplash mientras el HTML usa las locales de `imagenes/`
- **Archivos muertos** en `pages/inicio/`: `inicio.html` e `inicio.css` son el "Hola mundo" viejo
- **Dos convenciones de nombres** sin unificar: Alan usa `index/style/script`, el dashboard usa `dashboard.html/.css/.ts`
- Código de negocio real (precio por peso, apartados, auditoría, RBAC) **sin implementar**
- Sin pruebas, aunque el documento promete unitarias, de integración y de usabilidad

### Propuesta de base de datos (pendiente de revisar con el compañero)

En `server/db/` hay dos archivos **sin commitear**: `base.sql` y `datos.sql`. Es una propuesta de Cristian sobre el esquema que hizo otro compañero, probada contra Postgres real. Corrige:

1. La contraseña del root venía **en texto plano** en una columna llamada `contrasena_hash`
2. El precio estaba **fijo por pieza**, contra la regla del precio dinámico por peso
3. Faltaban `clientes`, `apartados`, `abonos` y la **bitácora de auditoría**
4. El inventario era por cantidad (`stock INT`), lo que **impide** que cada pieza tenga su peso y su precio

Está esperando respuesta del compañero. **No subirla al repo sin que él la revise.**

---

## Cómo debe trabajar Claude Code en este proyecto

- **Explicar todo en español** — el equipo y la documentación del proyecto son en español
- Respetar la separación de capas del backend (controllers / services / models)
- Usar convenciones de **Angular**, no de React, en todo lo relacionado al frontend
- Al crear un módulo nuevo (ventas, inventario, usuarios, apartados), seguir el mismo patrón de carpetas ya establecido
- Aplicar siempre las reglas de seguridad de este documento sin que se le tengan que repetir
- Al generar datos de prueba, nunca usar formatos que parezcan datos reales de tarjetas o identificaciones
- Los tres roles del sistema son administrador, gerente y cajero — no inventar otros
- **No crear carpetas vacías (con `.gitkeep`) por adelantado** para capas que nadie va a usar todavía — crear cada carpeta de capa junto con el primer archivo real que le corresponda, para no generar estructura que luego haya que revertir
- Este archivo (`CLAUDE.md`) **no se borra nunca**: si la estructura real del repo cambia, se actualiza este documento para que siga reflejando la realidad
