# Rifa

Plataforma sencilla para organizar rifas de 100 números (00–99). Cualquiera crea una rifa, comparte el enlace público por WhatsApp y las personas escogen y separan su número. El organizador confirma pagos, libera números y cierra la rifa desde un panel privado.

- **Sin cuentas ni registro.** Cada rifa tiene un enlace público y un enlace secreto de administración.
- **Sin dobles reservas.** La base de datos garantiza que un número solo puede separarse una vez.
- **Privacidad.** Nombres y teléfonos solo se ven desde el enlace de administración.
- **Gratis.** Next.js en Vercel y Postgres en Supabase, ambos en su plan gratuito.

## Cómo funciona

| Página | Quién la usa | Qué hace |
|---|---|---|
| `/` | Organizador | Crea la rifa y recibe los dos enlaces. |
| `/r/<slug>` | Participantes | Ven premio y precio, escogen un número y dejan nombre y WhatsApp. |
| `/r/<slug>/admin/<token>` | Organizador | Ve quién separó qué, marca pagos, libera números, asigna números a mano, edita datos y cierra la rifa. |

**El enlace de administración no se puede recuperar.** Solo se guarda su huella (hash) en la base. Quien crea la rifa debe guardarlo al momento.

## Configurar Supabase (gratis)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (plan Free).
2. En el menú lateral abre **SQL Editor**, pega el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecútalo.
3. En **Project Settings → API** copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (sección *Project API keys*) → `SUPABASE_SERVICE_ROLE_KEY`

La clave `service_role` solo se usa en el servidor de Next.js y nunca llega al navegador. No la pongas en variables `NEXT_PUBLIC_*`.

> **Aviso del plan gratuito:** Supabase pausa los proyectos tras unos 7 días sin actividad. Si la rifa estuvo quieta una semana y la página falla, entra al dashboard de Supabase y pulsa **Restore project**. Tarda un par de minutos y los datos se conservan.

## Ejecutar localmente

```bash
pnpm install
```

Copia `.env.example` a `.env.local` y pon tus dos valores de Supabase. Luego:

```bash
pnpm dev
```

Abre http://localhost:3000 y crea una rifa de prueba.

## Desplegar en Vercel

1. Importa este repositorio en Vercel.
2. En **Settings → Environment Variables** agrega `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Despliega. Cada rifa queda en `https://tu-dominio.vercel.app/r/<slug>`.

## API

Todas las rutas viven bajo `/api/raffles`. Las de administración exigen el header `x-admin-token` con el token del enlace privado.

| Método y ruta | Acción |
|---|---|
| `POST /api/raffles` | Crea una rifa. Devuelve `{ slug, adminToken }` (única vez que el token viaja en claro). |
| `GET /api/raffles/:slug/tickets` | Lista pública `{ number, status }` de los números separados. |
| `POST /api/raffles/:slug/tickets` | Reserva `{ number, name, phone }`. `409` si ya está separado o la rifa cerró. |
| `PATCH /api/raffles/:slug/admin` | Edita datos de la rifa o cambia `status` (`active` / `closed`). |
| `POST /api/raffles/:slug/admin/tickets` | Asigna un número a mano, opcionalmente ya `paid`. |
| `PATCH /api/raffles/:slug/admin/tickets/:number` | Cambia el estado de una boleta (`reserved` / `paid`). |
| `DELETE /api/raffles/:slug/admin/tickets/:number` | Libera el número. |

## Estructura

```
app/                 páginas y route handlers (Next.js App Router)
components/          RaffleBoard (pública), CreateRaffleForm, AdminPanel
lib/                 acceso a datos (db.ts), cliente Supabase, token admin, validación, formato
supabase/migrations  esquema SQL para pegar en el SQL Editor
```

## Decisiones

- **Número de boletas fijo (100).** Es el formato habitual de las rifas familiares y mantiene la cuadrícula simple.
- **Sin login.** El enlace secreto es suficiente para el uso familiar y evita correos y contraseñas.
- **Sin límite de reservas por persona.** Si alguien separa números con datos falsos, el organizador los libera desde el panel.
- **Moneda.** Los precios se muestran en pesos colombianos (`COP`) con formato `es-CO`. La columna `currency` existe por si en el futuro se quiere cambiar.
