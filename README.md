# CampusFoodLink

Mobile-friendly web prototype for Scenario Packet 1a. Plain HTML/CSS/JS front end
talking directly to a Neon Postgres database through the Neon Data API
(PostgREST-compatible REST). No build step, no framework.

## Project structure

```
campusfoodlink/
  .env               runtime config (API URL + key), NOT committed
  .env.example       safe template
  index.html         splash / welcome
  signup.html        student sign up
  login.html         role select + credentials
  sdash.html         student dashboard
  vendors.html       browse vendors
  menu.html          vendor menu (Menu / Info / Hours tabs)
  cart.html          cart + checkout
  confirm.html       order confirmation
  status.html        order tracking + "order ready" notification
  orders.html        my orders (Active / History)
  mealplan.html      meal plan balance + activity
  vdash.html         vendor dashboard
  vorders.html       vendor order management
  vmenu.html         vendor menu editor
  vhours.html        vendor business hours
  vreports.html      vendor reports
  adash.html         admin meal plan management
  css/styles.css
  js/                env loader, API client, shared app code, page logic
  sql/schema_additions.sql
```

## Setup

1. **Enable the Data API** on your Neon branch (Neon Console > Data API).
   The base URL it gives you should match `API_BASE_URL` in `.env`.
2. **Run `sql/schema_additions.sql`** in the Neon SQL Editor. It adds the
   `vendor_hours` table, optional `menus.category` and `orders.notes` columns,
   demo vendor/admin logins, and the table grants the Data API requires.
   It is idempotent, so re-running is safe.
3. **Check `.env`.** It already contains the API URL and key for this project.
4. **Serve the site** from the project root. Opening files directly with
   `file://` will not work because the app fetches `.env` over HTTP.
   - VS Code: right click `index.html` > Open with Live Server, or
   - Terminal: `python -m http.server 5500` then visit `http://localhost:5500`
5. **Smoke test the API** (optional but recommended):

   ```
   curl "https://ep-divine-darkness-atiewbbt.apirest.c-9.us-east-1.aws.neon.tech/neondb/rest/v1/vendors?select=id,name"
   ```

   If that returns JSON, anonymous access is working. If it returns 401,
   confirm the grants from step 2 ran, or configure an auth provider on the
   Data API settings tab.

## Demo accounts

| Role    | Email                        | Password  | Notes |
|---------|------------------------------|-----------|-------|
| Student | alice.smith@example.com      | anything  | Seed students store bcrypt-style stubs, so any password is accepted (simulated auth per packet). Any of the 15 seed students works. |
| Vendor  | vendor@campusfoodlink.demo   | vendor123 | Created by schema_additions.sql. Pick a vendor location at login. |
| Admin   | admin@campusfoodlink.demo    | admin123  | Created by schema_additions.sql. |

Accounts created through Sign Up store their password as typed and require it
to match at login.

## Packet 1a required features

| Requirement | Where |
|---|---|
| User login (student/vendor/admin, simulated) | login.html, role cards + credential check against `users` |
| Vendor menus (items, pricing, descriptions) | vendors.html, menu.html, vmenu.html |
| Meal plan balance display | sdash.html, mealplan.html, adash.html |
| Order creation (front-end logic) | menu.html + cart.html, writes `orders` + `order_items`, deducts balance |
| Order status (pending/ready/complete) | status.html tracker, vorders.html status updates |
| Mobile-friendly layout | responsive, mobile-first, full-width bottom nav |
| Stretch: "Your order is ready!" notification | status.html polls every 5s and shows the overlay |
| Stretch: data visualizations | vreports.html metrics + top items bars |

## Design decisions worth knowing

- **Vendor account to vendor location.** The schema has no link between a
  `users` row and a `vendors` row, so a vendor picks their location from a
  dropdown at login. Adding a `vendor_id` column to `users` would make this
  automatic.
- **Order statuses.** The app uses Pending, Preparing, Ready, Complete,
  Cancelled. Seed values Processing and Delivered are normalized to Preparing
  and Complete when displayed.
- **Table names** live in the `TABLES` constant at the top of `js/api.js` if
  the live schema ever differs.
- **Auth header.** The client sends `Authorization: Bearer <API_KEY>`. Neon
  `napi_` keys are management keys, not Data API JWTs, so if the server
  rejects it the client automatically retries anonymously and continues.

## Security notes (important for the write-up)

- Everything served to the browser, including `.env`, is visible to users.
  That is acceptable for this simulated prototype and should be called out in
  the project's security considerations.
- Passwords are compared in the browser and stored in plain text or as stubs.
  Real systems hash server-side (bcrypt) and never ship credentials to clients.
- The `napi_` key grants Neon account management access. Since it has been
  shared during development, rotate it in Neon Console > Account settings >
  API keys before the repo goes public, and keep `.env` out of git
  (already in `.gitignore`).
- For anything beyond the demo, enable Row Level Security on the tables
  instead of the blanket grants in schema_additions.sql.
