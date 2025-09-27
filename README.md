# MBDA Traffic Analytics Dashboard

Setup:

1. Add `.env` with DATABASE_URL for Neon
2. `npm install`
3. `npm run prisma:generate`
4. `npx prisma migrate dev --name init` (optional)
5. `npm run dev`

## Netlify Deployment

Set in Netlify UI:
- Build command: `npm run build`
- Publish directory: `.next`
- Environment variables: `DATABASE_URL` (Neon), optionally `NEXT_PUBLIC_APP_NAME`.

`netlify.toml` is included with `@netlify/plugin-nextjs` and Node 20.

Visit `/` then use PIN `10102020` to open `/dashboard`.
