// A tiny local stand-in for Supabase, for browser tests only.
// REST and RPC calls run as real SQL against a local PostgreSQL that has Bite's real schema and
// security rules, as role "authenticated" (or "anon") with the caller's user id, exactly like Supabase.
// Only what the app uses is implemented. Auth hands out unsigned test tokens for local test users.
const { Pool } = require("pg");

const pool = new Pool({ host: "/tmp/pg", port: 5499, user: "postgres", database: process.env.FAKEBASE_DB || "bite_e2e" });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (user) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, exp, aud: "authenticated", role: "authenticated", email: user.email })}.test`;
};
const subOf = (auth) => {
  const tok = (auth || "").replace(/^Bearer /, "");
  const parts = tok.split(".");
  if (parts.length !== 3) return null;
  try { return JSON.parse(Buffer.from(parts[1], "base64url").toString()).sub || null; } catch { return null; }
};

async function asUser(sub, sql, params = []) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(sub ? "set local role authenticated" : "set local role anon");
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [sub || ""]);
    const r = await c.query(sql, params);
    await c.query("commit");
    return r;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

const IDENT = /^[a-z_][a-z0-9_]*$/;
function filters(search, startIdx = 1) {
  const where = []; const params = []; let order = "";
  for (const [k, v] of search) {
    if (k === "select" || k === "columns") continue;
    if (k === "order") { const [col, dir] = v.split("."); if (IDENT.test(col)) order = ` order by ${col} ${dir === "desc" ? "desc" : "asc"}`; continue; }
    if (!IDENT.test(k)) continue;
    const m = /^(eq|gte|lte|gt|lt|neq)\.(.*)$/.exec(v);
    if (!m) continue;
    const op = { eq: "=", gte: ">=", lte: "<=", gt: ">", lt: "<", neq: "<>" }[m[1]];
    params.push(m[2]);
    where.push(`${k} ${op} $${startIdx + params.length - 1}`);
  }
  return { where: where.length ? " where " + where.join(" and ") : "", params, order };
}

// The embedded selects the app makes, written as SQL
const SELECTS = {
  bookings: `select b.*, case when p.id is null then null else json_build_object('name', p.name, 'photo_url', p.photo_url) end as guest,
               (select json_build_object('rating', r.rating, 'comment', r.comment) from reviews r where r.booking_id = b.id) as review,
               (select json_build_object('rating', g.rating, 'comment', g.comment) from guest_reviews g where g.booking_id = b.id) as guest_review
             from bookings b left join profiles p on p.id = b.guest_id`,
  conversations: `select c.*, json_build_object('name', h.name, 'photo_url', h.photo_url) as host,
                    json_build_object('name', g.name, 'photo_url', g.photo_url) as guest,
                    coalesce((select json_agg(json_build_object('id', m.id, 'sender_id', m.sender_id, 'body', m.body, 'created_at', m.created_at, 'read_at', m.read_at))
                              from messages m where m.conversation_id = c.id), '[]'::json) as messages
                  from conversations c join profiles h on h.id = c.host_id join profiles g on g.id = c.guest_id`,
};

async function handle({ method, url, headers, body }) {
  const u = new URL(url);
  const sub = subOf(headers["authorization"]);
  const json = (status, data) => ({ status, body: data === undefined ? "" : JSON.stringify(data) });
  try {
    // ---- auth
    if (u.pathname === "/auth/v1/token") {
      const r = await pool.query("select id, email, raw_user_meta_data from auth.users where email = $1", [body.email]);
      const user = r.rows[0];
      if (!user || body.password !== "local-test-only") return json(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" });
      const full = { id: user.id, email: user.email, aud: "authenticated", role: "authenticated", user_metadata: user.raw_user_meta_data, app_metadata: {}, created_at: new Date().toISOString() };
      const exp = Math.floor(Date.now() / 1000) + 3600;
      return json(200, { access_token: tokenFor(user), token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r-" + user.id, user: full });
    }
    if (u.pathname === "/auth/v1/user") {
      const r = await pool.query("select id, email, raw_user_meta_data from auth.users where id = $1", [sub]);
      const user = r.rows[0];
      return user ? json(200, { id: user.id, email: user.email, aud: "authenticated", user_metadata: user.raw_user_meta_data, app_metadata: {} }) : json(401, { msg: "no user" });
    }
    if (u.pathname === "/auth/v1/logout") return { status: 204, body: "" };

    // ---- storage (photos): accept the upload; public reads get a tiny placeholder image
    if (u.pathname.startsWith("/storage/v1/object/public/")) {
      return { status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64") };
    }
    if (u.pathname.startsWith("/storage/v1/object/meal-photos/")) {
      const path = decodeURIComponent(u.pathname.replace("/storage/v1/object/meal-photos/", ""));
      if (!sub || !path.startsWith(sub + "/")) return json(403, { message: "new row violates row-level security policy" });
      return json(200, { Key: "meal-photos/" + path });
    }

    // ---- rpc
    const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(u.pathname);
    if (rpc) {
      const fn = rpc[1];
      const keys = Object.keys(body || {}).filter((k) => IDENT.test(k));
      const args = keys.map((k, i) => `${k} => $${i + 1}`).join(", ");
      // functions that return a table come back as a JSON array, like PostgREST does
      const TABLE_FNS = ["host_review_list", "guest_rating"];
      const sql = TABLE_FNS.includes(fn) ? `select coalesce(json_agg(t), '[]'::json) as v from public.${fn}(${args}) t` : `select public.${fn}(${args}) as v`;
      const r = await asUser(sub, sql, keys.map((k) => body[k]));
      return json(200, r.rows[0].v);
    }

    // ---- tables
    const tm = /^\/rest\/v1\/(\w+)$/.exec(u.pathname);
    if (!tm) return json(404, { message: "not implemented: " + u.pathname });
    const table = tm[1];
    if (!IDENT.test(table)) return json(400, { message: "bad table" });

    if (method === "GET") {
      const f = filters(u.searchParams);
      const base = SELECTS[table] ? `select * from (${SELECTS[table]}) t` : `select * from public.${table}`;
      const sel = u.searchParams.get("select");
      const cols = sel && sel !== "*" && !SELECTS[table] ? sel.split(",").filter((c) => IDENT.test(c)).join(", ") : "*";
      const r = await asUser(sub, `select ${cols} from (${base}) q${f.where}${f.order}`, f.params);
      const single = (headers["accept"] || "").includes("vnd.pgrst.object");
      if (single) return r.rows.length ? json(200, r.rows[0]) : json(406, { message: "no rows" });
      return json(200, r.rows);
    }
    if (method === "POST") {
      const rows = Array.isArray(body) ? body : [body];
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => IDENT.test(k));
        await asUser(sub, `insert into public.${table} (${keys.join(", ")}) select ${keys.join(", ")} from json_populate_record(null::public.${table}, $1::json)`, [JSON.stringify(row)]);
      }
      return { status: 201, body: "" };
    }
    if (method === "PATCH") {
      const keys = Object.keys(body).filter((k) => IDENT.test(k));
      const f = filters(u.searchParams, 2);
      const set = keys.map((k) => `${k} = (json_populate_record(null::public.${table}, $1::json)).${k}`).join(", ");
      await asUser(sub, `update public.${table} set ${set}${f.where}`, [JSON.stringify(body), ...f.params]);
      return { status: 204, body: "" };
    }
    if (method === "DELETE") {
      const f = filters(u.searchParams);
      await asUser(sub, `delete from public.${table}${f.where}`, f.params);
      return { status: 204, body: "" };
    }
    return json(405, { message: "method" });
  } catch (e) {
    return json(400, { message: e.message, code: e.code });
  }
}

module.exports = { handle, pool };
