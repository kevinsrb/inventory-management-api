# MercadoExpress - Sistema de Gestión de Inventario

API REST para controlar productos, movimientos de inventario, alertas de stock bajo y órdenes de compra. La solución prioriza reglas de negocio explícitas, transacciones atómicas y un dominio que no depende de NestJS, Prisma, PostgreSQL ni HTTP.

## Descripción

MercadoExpress necesita reemplazar el control manual de inventario por una API capaz de:

- registrar productos con SKU único;
- impedir stock negativo y conservar un historial inmutable;
- abrir y resolver alertas de stock bajo automáticamente;
- gestionar órdenes desde `PENDIENTE` hasta `APROBADA`, `RECHAZADA` o `RECIBIDA`;
- actualizar el stock al recibir una orden;
- consultar inventario por categoría, proveedor, alerta activa y rango de stock.

## Arquitectura

Se usa una Clean Architecture / Hexagonal ligera, organizada por capacidad de negocio:

```mermaid
flowchart LR
    HTTP["Controller + DTO"] --> UC["Use Case"]
    UC --> PORT["Repository Port"]
    PORT --> ADAPTER["Prisma Adapter"]
    ADAPTER --> DB[(PostgreSQL)]
    UC --> DOMAIN["Entities + Value Objects + Policies"]
```

Las dependencias apuntan hacia el dominio. `domain` y `application` son TypeScript puro; NestJS solamente ensambla dependencias y expone HTTP. Los casos de uso que modifican varios agregados se ejecutan en una unidad de trabajo Prisma con aislamiento `Serializable`.

### ¿Por qué NestJS y no Express?

Express también era una elección válida y habría resuelto correctamente la exposición HTTP. NestJS se eligió porque aporta una estructura modular, inyección de dependencias, validación, interceptores, filtros y Swagger integrados. Para un dominio con reglas relacionadas entre inventario, alertas y órdenes, esa organización mejora la mantenibilidad y la testabilidad sin trasladar el framework al núcleo del negocio.

### Principios y patrones

- **Clean Architecture:** el dominio desconoce transporte y persistencia.
- **SOLID:** casos de uso con una responsabilidad, puertos pequeños e inversión de dependencias.
- **Repository Pattern:** contratos definidos hacia adentro y adaptadores Prisma hacia afuera.
- **Use Cases:** cada intención de negocio tiene una clase independiente.
- **Domain Services:** `InventoryPolicy`, `StockAlertPolicy` y `PurchaseOrderPolicy` concentran reglas que no pertenecen al controller.
- **Value Objects:** `Sku`, `Money`, `Quantity` y `Stock` validan conceptos, no valores primitivos sueltos.
- **UUID v7:** todos los identificadores se generan en la aplicación con la librería oficial `uuid`; conservan unicidad y orden temporal aproximado.

### Consistencia e invariantes

- SKU único mediante restricción de PostgreSQL.
- Una sola alerta `ACTIVA` por producto mediante índice único parcial.
- Movimientos inmutables mediante ausencia de endpoints de escritura y triggers que impiden `UPDATE`/`DELETE`.
- Check constraints para precio, cantidades, stock y estados válidos.
- Bloqueo optimista por versión del producto para detectar ajustes concurrentes.
- Ajustes, movimientos, alertas y recepción de órdenes se confirman o revierten juntos.

## Tecnologías

- Node.js 20.19 o superior
- TypeScript 5
- NestJS 11
- pnpm
- PostgreSQL 17
- Prisma ORM 6
- Jest
- Swagger / OpenAPI
- Pino
- Zod
- Docker y Docker Compose

Prisma 6 se mantiene deliberadamente para un runtime CommonJS estable con NestJS y el comando de seed solicitado. El acceso a datos está encapsulado, por lo que una actualización futura de Prisma no modifica el dominio.

## Variables de entorno

Copie `.env.example` como `.env` y ajuste los valores cuando sea necesario:

```powershell
Copy-Item .env.example .env
```

| Variable       | Descripción          | Valor local                                                                   |
| -------------- | -------------------- | ----------------------------------------------------------------------------- |
| `NODE_ENV`     | Entorno de ejecución | `development`                                                                 |
| `PORT`         | Puerto HTTP          | `3000`                                                                        |
| `DATABASE_URL` | Conexión PostgreSQL  | `postgresql://postgres:postgres@localhost:5432/mercado_express?schema=public` |
| `LOG_LEVEL`    | Nivel de Pino        | `info`                                                                        |

La configuración se carga con `ConfigModule` y se valida al inicio con Zod. El código de aplicación no consulta `process.env` directamente.

## Instalación

Requisitos: Node.js, pnpm y Docker Desktop activos. Después de crear `.env`, ejecute exactamente:

```bash
pnpm install
docker compose up -d
pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev
```

La seed es idempotente: crea las seis categorías y los seis productos de referencia sin duplicarlos. Si se ejecuta de nuevo, actualiza datos descriptivos pero conserva el stock operativo existente. Los productos cuyo stock sea menor o igual al mínimo quedan con una única alerta `STOCK_BAJO` activa.

## Ejecución

- API: `http://localhost:3000/api`
- Adminer: `http://localhost:8080`
- Servidor de Adminer: `postgres`
- Usuario/contraseña: `postgres` / `postgres`
- Base de datos: `mercado_express`

Para una compilación de producción:

```bash
pnpm build
pnpm start
```

## Tests

Los tests ejercitan casos de uso con repositorios en memoria; no prueban controllers ni Prisma.

```bash
pnpm test
pnpm test:cov
```

La batería cubre producto, SKU duplicado, entradas, salidas, stock negativo y faltante, creación/no duplicación/cierre de alertas, cantidad mínima, aprobación, rechazo, recepción, actualización de stock y cierre automático de alerta.

## Swagger

La documentación interactiva está disponible en:

`http://localhost:3000/docs`

Todos los endpoints incluyen operación, cuerpo cuando corresponde, respuestas y ejemplos. Los grupos disponibles son Productos, Inventario, Alertas y Órdenes de compra.

## Endpoints principales

| Método  | Ruta                                    | Propósito                         |
| ------- | --------------------------------------- | --------------------------------- |
| `POST`  | `/api/products`                         | Crear producto con stock inicial  |
| `GET`   | `/api/products`                         | Consultar todos los productos     |
| `GET`   | `/api/inventory`                        | Consultar inventario con filtros  |
| `POST`  | `/api/inventory/:productId/adjustments` | Registrar entrada o salida        |
| `GET`   | `/api/inventory/:productId/movements`   | Consultar historial               |
| `GET`   | `/api/alerts`                           | Consultar alertas por estado      |
| `PATCH` | `/api/alerts/:id/close`                 | Resolver alerta manualmente       |
| `POST`  | `/api/purchase-orders`                  | Crear orden manual o desde alerta |
| `GET`   | `/api/purchase-orders`                  | Consultar órdenes por estado      |
| `PATCH` | `/api/purchase-orders/:id/approve`      | Aprobar orden pendiente           |
| `PATCH` | `/api/purchase-orders/:id/reject`       | Rechazar con motivo               |
| `PATCH` | `/api/purchase-orders/:id/receive`      | Recibir orden y actualizar stock  |

## Estructura del proyecto

```text
src/
├── modules/
│   ├── products/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interfaces/
│   ├── inventory/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interfaces/
│   ├── alerts/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interfaces/
│   └── purchase-orders/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── interfaces/
├── shared/
│   ├── application/
│   ├── config/
│   ├── database/
│   ├── domain/
│   ├── exceptions/
│   ├── filters/
│   ├── interceptors/
│   ├── interfaces/
│   └── validation/
├── app.module.ts
└── main.ts
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
test/
├── application/
└── helpers/
```

## Decisiones técnicas

1. **Stock inicial:** `currentStock` es opcional y acepta enteros mayores o iguales a cero; cuando se omite inicia en `0`. Si queda igual o por debajo del mínimo, se crea automáticamente una alerta activa.
2. **Dinero:** `Money` normaliza a dos decimales y PostgreSQL persiste `DECIMAL(12,2)`, evitando `float` en base de datos.
3. **Categorías normalizadas:** son registros propios; el producto recibe el nombre y el caso de uso resuelve su ID.
4. **Proveedor como snapshot:** cada orden copia el proveedor vigente del producto para conservar el contexto histórico.
5. **Alertas:** se crean al quedar el stock igual o por debajo del mínimo y se resuelven solo cuando queda por encima. El mismo criterio se aplica a ajustes y recepción.
6. **Errores:** el dominio emite errores semánticos; el filtro global los traduce a `400`, `404`, `409` o `422` con una respuesta uniforme.
7. **Observabilidad:** Pino registra solicitudes y duración; datos sensibles de headers se redactan.
8. **Enums de dominio:** los estados son constantes TypeScript del dominio y se almacenan como texto validado por constraints; no se usan enums Prisma.
9. **Seed segura:** usa `upsert` para categorías, SKU para productos y consulta la alerta activa antes de crearla.

## Posibles mejoras

- Autenticación JWT y rotación de tokens.
- Roles y autorización por operación.
- Paginación y ordenamiento en consultas.
- Eventos de dominio para desacoplar efectos secundarios.
- Outbox Pattern para publicación confiable.
- CQRS si las lecturas y escrituras divergen de forma real.
- Cache de consultas frecuentes.
- Redis para cache distribuido y locks cuando la escala lo justifique.
- Auditoría de cambios de producto y órdenes.
- Pruebas de integración con Testcontainers y pruebas end-to-end del contrato HTTP.
- Despliegue automatizado, health checks y métricas OpenTelemetry.
