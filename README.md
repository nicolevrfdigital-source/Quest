# Quest HQ ✦

A cozy personal dashboard, styled like a digital bullet journal: daily habits (Nourish · Move · Water · a daily movement challenge), a sticker book, gentle habit counters, countdowns, a sticky note, an encouraging message, a focus timer and one favorite photo.

Built with React + Vite + TypeScript + Tailwind CSS, with Supabase for sign-in, data and private photo storage. It runs as a static site on GitHub Pages and installs to the iPad home screen.

---

## What's inside

| | |
|---|---|
| **Daily habits** | Four daily check-ins — the fourth is a small movement challenge that changes every day (see `src/lib/challenges.ts`). Use the arrows or the date picker to move between days, including past and future days. Each tap saves automatically. |
| **Sticker book** | Check off all four habits on a day to earn a sticker (with a little pop-up). The book holds 32 hand-drawn stickers, earned in order; after that they repeat with a ×2 badge. Stickers are derived from habit history, nothing extra is stored. |
| **Little wins** | Completed-day totals per habit, for all time and for the current quest. Future days are excluded. There are no streaks and nothing resets. |
| **Countdowns** | Add, edit and remove countdowns. A countdown *linked to the quest* follows the active quest's end date, so it updates when you extend the quest. |
| **Quests** | Optional date ranges (Settings → Quests). You can extend a quest, finish it, start a new one or look back at old ones. Habit records are stored separately from quests, so changing a quest never touches them. |
| **Sticky note** | Tap the note to write. It saves as you type and syncs between devices. |
| **Message** | 30 built-in encouraging messages. Tap **Another one** to see a different one. |
| **Timer** | Presets of 2, 5, 10, 15 and 25 minutes, with start, pause, resume and reset. It counts from the clock time, so it stays accurate when the app is in the background. When it ends you get a soft chime, plus a notification where the device supports it. |
| **Photo** | One private photo. Large images are shrunk to 1600px before upload. |
| **Sign-in** | Email and password. Create the account once with **First time here? Create an account**, then confirm it with the link Supabase emails you. **Forgot your password?** emails you a reset link. |
| **Backup** | Settings → Data & account → export or import a JSON file. Imports are checked first and need your confirmation before replacing anything. |

### How saving works
- Supabase is the source of truth. Data loads when you sign in, and Supabase Realtime pushes changes to your other devices. The app also refreshes whenever it comes back to the foreground.
- Habit check-ins and the sticky note go through a small **outbox**. Every edit is kept in the device's local storage until Supabase confirms it, and failed saves retry automatically with backoff. If the network drops you see an "unsaved · retrying" pill, and nothing is silently lost, even if you close the app.
- Saves for quests, countdowns, the photo and imports happen when you press their buttons. If one fails, the error shows right on that form.

---

## Setup

You need: a free [Supabase](https://supabase.com) account, a GitHub account, and Node.js 20+ for local development.

### 1. Create the Supabase project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**. Pick a name, a database password and a region near you.
2. When it's ready, open **Project Settings → API Keys** (or **Connect**) and copy:
   - the **Project URL**, e.g. `https://abcd1234.supabase.co`
   - the **Publishable key** (`sb_publishable_…`). On older projects, the legacy **anon** key works too.

   ⚠️ Never use the **secret** / **service_role** key in this app.

### 2. Run the database migration and configure sign-in
1. In the dashboard, open **SQL Editor → New query**. Paste in all of [`supabase/migrations/20261009000000_init.sql`](supabase/migrations/20261009000000_init.sql) and click **Run**.
   This creates the tables, the Row Level Security policies, Realtime, the import function and the private `photos` bucket with its access policies.
   *(If you use the Supabase CLI instead, run `supabase link` and then `supabase db push`.)*
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://<your-github-username>.github.io/<repo-name>/`
   - **Redirect URLs**: add that same URL, plus `http://localhost:5173/` for local development.
3. Sign-in uses **email + password**, so the default email templates work as they are and you don't need custom SMTP. Supabase only emails you to confirm the account once, or to reset a forgotten password.
   > Why a password rather than a magic link? An app added to the iPad home screen has its own storage, separate from Safari. A magic link opens in Safari and signs *Safari* in, not the installed app. A password signs in the installed app directly. (The "email me a sign-in link" option is still there for regular browsers.)
4. After you've signed in for the first time, turn off new sign-ups in **Authentication → Sign In / Providers** by switching off **Allow new users to sign up**. Then nobody else can create an account on your copy.

> The built-in Supabase email service only sends a few emails per hour. That's plenty for one person. If you ever hit the limit, wait a bit or add your own SMTP server under **Authentication → Emails → SMTP Settings**.

### 3. Check the private photo bucket
The migration already created it. To confirm, open **Storage** and check that a bucket called **`photos`** exists and is **not public**. Its policies only let each signed-in user read and write files in their own folder (`<user-id>/…`). The app displays the photo through signed URLs that expire after one hour.

### 4. Run locally (optional)
```bash
npm install
```
```bash
cp .env.example .env.local
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, then start the dev server:
```bash
npm run dev
```
Open <http://localhost:5173/>.

**Demo preview:** in development you can open <http://localhost:5173/?demo> to see the dashboard with in-memory sample data. It doesn't need Supabase and nothing is saved. Demo mode isn't included in production builds.

Other commands:
```bash
npm test
```
```bash
npm run build
```

### 5. Connect the GitHub repository
```bash
git init && git add -A && git commit -m "Quest HQ"
```
Create an empty repository on GitHub (it can be private if your plan supports Pages for private repos, otherwise public). Then:
```bash
git remote add origin https://github.com/<you>/<repo-name>.git && git branch -M main && git push -u origin main
```
In the repository, go to **Settings → Secrets and variables → Actions → Variables** and add two **repository variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

(These two values are public by design and get built into the site. Your data is protected by RLS, not by hiding them.)

### 6. Publish with GitHub Pages
1. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main`, or run the **Deploy to GitHub Pages** workflow by hand from the **Actions** tab. It installs dependencies, runs the tests, builds the site and deploys it.
3. Your site will be at `https://<you>.github.io/<repo-name>/`. Check that this exact URL is in the Supabase Redirect URLs from step 2.

The build uses relative paths (`base: './'`) and the app has a single page with no client-side routes, so it works in any GitHub Pages subfolder without 404 tricks.

### 7. Add Quest HQ to the iPad home screen
1. Open your site in **Safari** on the iPad.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Quest HQ from the home screen. It runs full-screen, without Safari's toolbars.
4. Sign in **inside the installed app** with your email and password.
5. To get timer notifications, allow them when the app asks the first time you start a timer. On iPadOS this works for home-screen apps from version 16.4. If the app was in the background when the timer ended, you'll see it finished as soon as you come back.

Do the same on your phone. Both devices stay in sync.

---

## Project structure

```
src/
  App.tsx                 auth gate (sign-in screen ↔ dashboard)
  data/DataProvider.tsx   loading, realtime sync, outbox, all Supabase writes
  data/context.ts         the data API used by widgets
  lib/                    pure logic: dates, stats, countdowns, outbox, backup, messages…
  components/             one file per widget + settings panel
  hooks/                  useToday (midnight rollover), useTimer
  dev/Demo.tsx            dev-only demo data
supabase/migrations/      schema, RLS, storage policies, import function
public/                   manifest, service worker, icons
scripts/generate-icons.mjs  regenerates the app icons (npm run icons)
```

### Data model
- `habit_logs (user_id, day, nourish, move, water, challenge)`: one row per calendar day. It isn't linked to quests at all.
- `quests (id, name, start_date, end_date, status)`: each user can have at most one `active` quest.
- `countdowns (id, title, target_date, linked_to_quest, sort_order)`
- `user_settings (user_id, sticky_note, photo_path)`

Dates are plain local calendar dates (`YYYY-MM-DD`). A check-in at 11pm stays on that day, and countdowns aren't thrown off by daylight-saving changes.

### First-run data
The first time a new account signs in, the app creates the **Pre-Trip Quest** (Oct 12 to Nov 1, 2026) and the countdowns **Week 1** (Oct 18), **Pre-Trip Quest** (linked to the active quest) and **My Trip** (Dec 12, 2026). These are ordinary records and you can edit any of them. To change the defaults for a fresh account, edit `src/lib/initial.ts`.

### Privacy & security
- Every table has RLS policies that limit access to `auth.uid() = user_id`, and anonymous visitors are granted nothing.
- Photos live in a private bucket, inside a folder named after your user ID.
- The frontend only ever contains the public project URL and the publishable key.
- The service worker caches only the app's own static files. It never caches Supabase requests or your data.
