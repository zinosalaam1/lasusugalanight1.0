# 1st LASU Epe Gala Night — Setup & Deployment

This app shows a live, cinematic reveal of the LASUSU (LASU Epe Social
Committee) Gala Night award results — theme "Faculty Fusion Forge." Results
live in Supabase (Postgres) and update in real time everywhere the reveal
page is open. The `/admin` dashboard is gated behind Supabase Auth — only
accounts you create manually can sign in and edit data.

## 1. Database setup

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/schema.sql` and run it.
   This creates the `categories` and `nominees` tables, Row Level Security
   policies (public read, authenticated-only write), a trigger that keeps
   `total_votes` in sync with nominee tallies when "auto-total" is on, and
   enables Realtime on both tables.
3. No seed/dummy data is inserted. Add your real categories and nominees
   from `/admin` after deploying, or via SQL — see the bottom of the file
   for an example `insert` statement.

## 2. Admin account

There is no public sign-up. Create the admin login yourself:

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
2. Enter the admin's email and a password you choose.
3. Toggle **Auto Confirm User** ON (no email step needed for a single admin).
4. That email + password is what's used to sign in at `/admin`.

You can repeat this for additional admins if more than one person needs
access.

## 3. Environment variables

Copy `.env.example` to `.env` and fill in your project's URL and anon key
(Supabase dashboard → **Project Settings → API**):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is safe to expose in the browser bundle — it only grants what
the RLS policies in `schema.sql` allow (public read, authenticated write).
Never use the `service_role` key in this app.

When deploying (Vercel, Netlify, Cloudflare, etc.), set these same two
variables in your hosting provider's environment variable settings.

## 4. Install & run

```bash
npm install   # or: bun install
npm run dev   # local development
npm run build # production build
```

## 5. Using it

- **Public reveal** — `/` — designed to be projected live. Press Space,
  Enter, or → to advance through each stage (category intro → nominees →
  suspenseful reveal → winner → breakdown → next category). Updates from
  the admin dashboard sync to this screen instantly via Supabase Realtime.
- **Admin dashboard** — `/admin` — sign in with the account you created in
  step 2. Add/reorder/delete categories, add/edit/delete nominees, toggle
  per-category auto-totaling, export the current dataset as JSON, or import
  a JSON file (this **replaces all existing data** — you'll be asked to
  confirm).

## Notes on data integrity

- A category needs at least one nominee to appear in the live reveal flow
  (you can't crown a winner with no nominees). Categories with zero
  nominees still show up in `/admin` so you can fill them in.
- If "Auto-calculate total votes" is on for a category (the default), its
  total is always the sum of its nominees' vote counts — you can't get it
  out of sync. Turn it off only if you need to report a total that differs
  from the nominee breakdown (e.g. votes for write-in candidates not
  individually tracked).
- Renaming a category's identifier (slug) updates all of its nominees
  automatically (the database cascades nominee rows by `category_id`).
