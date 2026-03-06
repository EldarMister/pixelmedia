# Pixel Media CRM

Single-page CRM for a photo/video/design studio. The frontend is `index.html`, the backend is Express, and all persistent data is stored in PostgreSQL.

## Stack

- Node.js + Express
- PostgreSQL
- Vanilla HTML/CSS/JS

## Local run

1. Install dependencies:

```bash
npm install
```

2. Copy envs:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env`.

4. Start the app:

```bash
npm start
```

The server starts on `PORT` and serves both the API and `index.html`.

## Database

On startup the server runs `schema.sql` automatically:

- creates tables for `orders`, `services`, `equipment`, and `off_days`
- creates indexes and `updated_at` triggers
- seeds demo `services` and `equipment` only if they do not already exist

## Railway deploy

1. Create a PostgreSQL service in Railway.
2. Add the generated `DATABASE_URL` to the app variables.
3. Optionally set:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-app-domain.up.railway.app
```

4. Deploy the repo. Railway will run:

```bash
npm install
npm start
```

## API

- `GET /api/health`
- `GET /api/orders`
- `GET /api/orders/stats`
- `GET /api/orders/calendar`
- `GET /api/orders/calendar/off-days`
- `POST /api/orders/calendar/off-days`
- `DELETE /api/orders/calendar/off-days/:offDate`
- `DELETE /api/orders/calendar/off-days?month=...&year=...`
- `GET /api/services`
- `POST /api/services`
- `GET /api/equipment`
- `POST /api/equipment`

## Notes

- Order photos are stored in PostgreSQL as JSON/base64 strings in `orders.photos`.
- Calendar non-working days are stored in PostgreSQL in `off_days`.
- No persistent filesystem storage is required for Railway deployment.
