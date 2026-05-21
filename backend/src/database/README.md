# Database setup

## Fresh database (Render, local, etc.)

Run **only** this file:

```bash
psql "$DATABASE_URL" -f backend/src/database/schema.sql
```

`schema.sql` is the single source of truth for a new empty database. It includes all tables and columns the app uses today.

## Other SQL files

| File | Purpose |
|------|---------|
| `migrations/` | Old incremental scripts from development — **do not run** on a new DB if you used `schema.sql` |
| `update_goggles_name.sql` | One-time data fix for existing product names — not for empty databases |

If you already ran `schema.sql` before it was updated, compare `migrations/` and older root `.sql` files only if you are missing tables or columns.
