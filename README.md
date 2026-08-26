# Rifa · Todos por Mafe

Aplicación efímera para gestionar las boletas 00–99 de la rifa.

## Ejecutar localmente

```bash
pnpm install
pnpm dev
```

Sin variables de entorno, la app funciona en modo demo usando `localStorage` en el navegador. Para que todas las personas vean los mismos números y las reservas sobrevivan a los despliegues, configura Redis.

## Desplegar en Vercel

1. Importa este repositorio en Vercel.
2. En Vercel Storage crea una base Redis/Upstash y conéctala al proyecto.
3. Verifica que existan `KV_REST_API_URL` y `KV_REST_API_TOKEN` en las variables de entorno.
4. Despliega.

El endpoint `/api/tickets` valida que el número esté entre 00 y 99 y evita que dos personas separen el mismo número. El modo de memoria incluido es útil para pruebas, pero no debe usarse como almacenamiento compartido en producción.
