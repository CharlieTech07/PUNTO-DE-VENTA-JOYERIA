# Contexto del proyecto — Punto de Venta Joyería Olimpo

## Qué es este proyecto

Sistema de Punto de Venta (POS) para una joyería ficticia, desarrollado como proyecto académico de Ingeniería en Software (UCOL) por el Equipo 5, usando metodología Scrum/Kanban.

**Repositorio:** github.com/CharlieTech07/PUNTO-DE-VENTA-JOYERIA

**Equipo:**
- Carlos Arturo Argüellez Ruiz — líder de equipo
- Alan Yakxel Juárez Cano
- Jesús Enrique Ibarra Figueroa
- Juan Amador Benítez
- Cristian — (yo, quien te está dando este contexto)

Cada miembro trabaja en su propia rama de GitHub y se integra vía pull requests.

## Estructura de carpetas definida (ya decidida, no cambiar sin acuerdo del equipo)

```
PUNTO-DE-VENTA-JOYERIA/
├── backend/
│   ├── src/
│   │   ├── controllers/     # reciben la petición HTTP, llaman a services, responden
│   │   ├── services/        # lógica de negocio real (cálculo de precios, validación de stock, reglas de apartado)
│   │   ├── models/          # entidades / esquemas de base de datos
│   │   ├── routes/          # definición de endpoints, mapean URL -> controller
│   │   ├── middlewares/     # autenticación, validación de datos, manejo de errores
│   │   ├── config/          # conexión a base de datos, configuración general
│   │   └── utils/           # funciones auxiliares reutilizables
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # piezas de UI reutilizables
│   │   ├── pages/           # pantallas completas (Ventas, Inventario, Login, etc.)
│   │   ├── services/        # funciones que llaman a la API del backend
│   │   ├── hooks/           # lógica reutilizable (si se usa React)
│   │   ├── context/         # estado global (sesión de usuario, carrito activo)
│   │   ├── assets/          # imágenes/íconos de la app
│   │   └── styles/
│   ├── public/
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
- `controllers` NO deben tener lógica de negocio, solo reciben, delegan a `services` y responden
- `services` es donde vive el cálculo y las reglas de negocio
- `models` solo define estructura de datos, no lógica
- Cualquier acción crítica (cancelar venta, editar precio, dar descuento) debe poder auditarse — ver sección de seguridad

## Reglas de negocio específicas de la joyería (importante, no es un POS genérico)

1. **Inventario serializado, no genérico**: cada pieza física es única, no "10 anillos talla 7". Cada pieza tiene: SKU único, peso en gramos, quilataje, tipo de metal, piedras engastadas (si aplica), certificado de autenticidad, costo de adquisición/fabricación.

2. **Precio dinámico por peso**: el precio de piezas vendidas por peso se calcula como:
   ```
   precio = (peso_gramos × precio_metal_del_día) + costo_mano_de_obra + valor_piedras + margen
   ```
   El precio del metal del día debe poder actualizarse fácilmente (manual o vía API externa) — no debe quedar hardcodeado por pieza.

3. **Apartados / layaway**: el cliente da un anticipo, la pieza queda bloqueada del inventario disponible (no se puede vender a nadie más), y hay un calendario de abonos con fecha límite. Si se cumple el plazo sin liquidar, el sistema debe permitir marcar la pieza como disponible de nuevo.

4. **Roles de usuario mínimos**:
   - `cajero`: vende, cobra, NO puede editar precios ni cancelar ventas sin autorización
   - `supervisor`: autoriza descuentos y cancelaciones, ve reportes de su turno
   - `administrador`: edita inventario, precios, usuarios, ve todos los reportes

5. **Bitácora de auditoría obligatoria**: toda acción sensible (cancelación de venta, edición de precio, descuento aplicado, baja de inventario) debe registrarse con: usuario, fecha/hora, acción, detalle, y quién autorizó (si aplica). Esto es requisito de diseño, no opcional — es la defensa principal contra fraude interno.

## Seguridad — requisitos no negociables

- Contraseñas SIEMPRE con hash (bcrypt o Argon2), nunca texto plano ni MD5/SHA1 solo
- Ninguna consulta a base de datos debe concatenar strings del usuario directamente — usar queries parametrizadas u ORM (prevención de SQL injection)
- Nunca almacenar número completo de tarjeta, CVV o pista magnética (si se simula pago con tarjeta, usar datos claramente ficticios con formato de prueba, nunca datos reales)
- Toda comunicación backend-frontend debe validarse en el backend, nunca confiar solo en validación del frontend
- Variables sensibles (credenciales de BD, claves) van en `.env`, nunca se suben al repo — usar `.env.example` como plantilla sin datos reales
- RBAC (control de acceso por rol) aplicado en el backend, no solo ocultando botones en el frontend

## Stack tecnológico

<!-- COMPLETAR: aún no definido con el equipo. Ejemplo si usan Node/Express + React:
Backend: Node.js + Express + [ORM: Sequelize/Prisma] + [BD: MySQL/PostgreSQL]
Frontend: React + [manejo de estado: Context API / Redux]
-->

## Estado actual del proyecto

- Estructura de carpetas ya decidida y en proceso de aplicarse en el repo
- Documentación de protocolo y minutas semanales ya iniciada en `docs/`
- Módulos de código aún no desarrollados — próximo paso es repartir módulos del backend entre el equipo por sprint

## Cómo debe trabajar Claude Code en este proyecto

- Respetar la separación de capas en el backend (controllers/services/models) — no meter lógica de negocio en controllers
- Al crear cualquier módulo nuevo (ventas, inventario, usuarios, apartados), seguir el mismo patrón de carpetas ya establecido
- Al tocar autenticación, contraseñas o datos de pago, aplicar siempre las reglas de seguridad de este documento sin que se le tengan que repetir
- Si genera datos de prueba, nunca usar formatos que parezcan datos reales de tarjetas o documentos de identidad
- Explicar en español los cambios que haga, ya que el equipo y la documentación del proyecto son en español
