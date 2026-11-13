# Browser tests

Run the built app first: `npm run build && npx vite preview --port 4173`.

| Test | What it proves | Backend |
| --- | --- | --- |
| `demo_smoke.test.cjs` | The demo still books a meal and sends nothing to a server | none |
| `live_auth.test.cjs` | Live sign-up, log-in, password reset, profile saving, log-out | Supabase mocked |
| `live_flow.test.cjs` | Two people: host publishes (photo upload, private street), guest asks for a seat, host accepts, address revealed, chat both ways, host cancels and the booking is cancelled | `fakebase.cjs`: real SQL with Bite's real security rules on a local PostgreSQL (`bite_e2e`), nothing leaves the machine |

Setting up `bite_e2e`: create the database, run `supabase/tests/supabase_shim.sql`, then every file in `supabase/migrations/` except `*_storage.sql`, then add two users to `auth.users` (anna@test.local, ben@test.local). `fakebase.cjs` needs `npm install pg`.

| `hosting_price.test.cjs` | The price step of Start hosting: estimate, a real receipt photo read in the browser, the sample receipt, typed totals (honest "Stated by the host" label), too high / too little, the cap on the stepper, the meal page | demo mode, needs internet once for the OCR language data |
| `geo_location.test.cjs` | "Use my location" in the Where? picker: real map with a you-are-here dot, pins, "Near you", refused location | `SITE=https://bitetable.de` to check the published site |
