import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";
import logoImg from "../logo.png";
import { DEMO_ACCOUNT, shortName, useStore, type Account } from "../store";
import { t, locale } from "../../shared/i18n";
import { AuthScene } from "./AuthScene";
import "../styles/auth.css";
import { liveResetPassword, liveSetNewPassword, liveSignIn, liveSignUp } from "../liveAuth";

export type AuthMode = "signup" | "login";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sign up / log in.
 * Demo mode: the account lives only in this browser and the password is checked for length but never stored or sent anywhere.
 * Live mode (bite.html?live): real accounts through Supabase (see liveAuth.ts). After sign-up the person confirms
 * their email; after "Forgot password?" they get a link and choose a new password here (store.recovering).
 */
export function AuthScreen({ initialMode, onBack, onDone, reason }: { initialMode: AuthMode; onBack?: () => void; onDone: (mode: AuthMode) => void; /** why we ask (a guest tried to book, message or host) */ reason?: string }) {
  const store = useStore();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [news, setNews] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // live mode: "check your inbox" after sign-up or a reset request
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const live = store.live;
  const minPw = live ? 8 : 6;

  const finish = (account: Account, m: AuthMode) => {
    setLoading(true);
    setTimeout(() => {
      store.signIn(account);
      if (m === "signup") store.updateProfile({ news });
      store.showToast(m === "signup" ? t("Welcome to Bite, {name}!", { name: account.name.split(" ")[0] }) : t("Welcome back, {name}", { name: account.name.split(" ")[0] }));
      onDone(m);
    }, 700);
  };

  const submitLive = async () => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const res = mode === "signup"
      ? await liveSignUp(shortName(name), cleanEmail, password, news)
      : await liveSignIn(cleanEmail, password);
    setLoading(false);
    if (!res.ok) { setErrors({ form: res.error ?? "" }); return; }
    if (mode === "signup" && res.needsConfirmation) { setSent("confirm"); return; }
    // signed in: the store receives the session from Supabase and loads the profile
    store.showToast(mode === "signup" ? t("Welcome to Bite, {name}!", { name: name.trim().split(" ")[0] }) : t("Welcome back"));
    onDone(mode);
  };

  const forgot = async () => {
    if (!live) { store.showToast(t("Password reset link sent (demo)")); return; }
    if (!EMAIL_RE.test(email.trim())) { setErrors({ email: t("Enter your email above, then tap “Forgot password?” again") }); return; }
    setLoading(true);
    const res = await liveResetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (!res.ok) { setErrors({ form: res.error ?? "" }); return; }
    setSent("reset");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (mode === "signup" && name.trim().length < 2) errs.name = t("Please enter your name");
    if (!EMAIL_RE.test(email.trim())) errs.email = t("Enter a valid email address");
    if (password.length < minPw) errs.password = minPw === 8 ? t("At least 8 characters") : t("At least 6 characters");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (live) { void submitLive(); return; }

    if (mode === "signup") {
      finish({ name: shortName(name), email: email.trim().toLowerCase() }, "signup");
    } else {
      // Log in: reuse the name of an account created in this browser, otherwise derive it from the email
      const known = store.account && store.account.email === email.trim().toLowerCase() ? store.account : null;
      const fromEmail = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      finish(known ?? { name: shortName(fromEmail) || fromEmail, email: email.trim().toLowerCase() }, "login");
    }
  };

  if (live && store.recovering) return <NewPassword onDone={() => { store.doneRecovering(); onDone("login"); }} />;
  if (sent) return (
    <Shell onBack={() => setSent(null)} name={name} mode="plain">
      <div className="au-sent">
        <svg className="au-envelope" viewBox="0 0 120 90" aria-hidden>
          <rect x="6" y="14" width="108" height="70" rx="6" fill="#fffdf7" stroke="rgba(107,33,217,0.35)" strokeWidth="2" />
          <path d="M8 18l52 38 52-38" fill="none" stroke="rgba(107,33,217,0.35)" strokeWidth="2" />
          <circle cx="60" cy="56" r="13" fill="#6b21d9" />
          <text x="60" y="61.5" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="15" fill="#fff">b</text>
        </svg>
        <h1 className="au-title">{t("Check your inbox")}</h1>
        <p className="au-lead">
          {sent === "confirm"
            ? t("We sent a link to {email}. Open it to confirm your email, then you are in.", { email: email.trim().toLowerCase() })
            : t("If there is an account for {email}, we sent a link to choose a new password.", { email: email.trim().toLowerCase() })}
        </p>
        <p className="au-small">{t("Nothing there? Check your spam folder.")}</p>
        <button onClick={() => { setSent(null); setMode("login"); }} className="au-ghost">{t("Back to log in")}</button>
      </div>
    </Shell>
  );

  const today = new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
  return (
    <Shell onBack={onBack} name={mode === "signup" ? name : ""} mode={mode}>
      {/* the reservation book: tabs like index dividers, then the page */}
      <div className="au-tabs" role="tablist">
        {(["signup", "login"] as AuthMode[]).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErrors({}); }} className={`au-tab ${mode === m ? "on" : ""}`}>
            {m === "signup" ? t("Sign up") : t("Log in")}
          </button>
        ))}
      </div>
      <div className="au-page">
        <div className="au-page-head"><span>{t("Reservations")}</span><span>{today}</span></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <h1 className="au-title">{mode === "signup" ? t("Create your account") : t("Welcome back")}</h1>
            <p className="au-lead">{reason ?? (mode === "signup" ? t("Write your name in the book. Your neighbours will see it at the table.") : t("Your table is where you left it."))}</p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={submit} noValidate className="au-form">
          <AnimatePresence initial={false}>
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Input Icon={User} label={t("Full name")} value={name} onChange={setName} error={errors.name} autoComplete="name" placeholder={t("Sebastiano Operti")} />
              </motion.div>
            )}
          </AnimatePresence>
          <Input Icon={Mail} label={t("Email")} type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" placeholder={t("you@example.com")} />
          <Input
            Icon={Lock}
            label={t("Password")}
            type={showPw ? "text" : "password"}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={minPw === 8 ? t("At least 8 characters") : t("At least 6 characters")}
            trailing={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t("Hide password") : t("Show password")} className="au-eye">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {mode === "signup" && (
            <label className="au-check">
              <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} />
              <span className="au-box" aria-hidden>{news && <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" /></svg>}</span>
              {t("Keep me updated on Bite's news")}
            </label>
          )}
          {mode === "login" && (
            <button type="button" onClick={() => void forgot()} className="au-link self-end">{t("Forgot password?")}</button>
          )}

          {errors.form && <p role="alert" className="au-error">{errors.form}</p>}
          <motion.button type="submit" disabled={loading} className="au-submit" whileTap={{ scale: 0.98 }}>
            {loading ? (
              <ThinkingOrb state="connecting" size={20} theme="dark" aria-label={t("Loading…")} />
            ) : (
              <><span>{mode === "signup" ? t("Create account") : t("Log in")}</span><i aria-hidden>→</i></>
            )}
          </motion.button>
        </form>

        {!live && <>
          <div className="au-or"><span />{t("or")}<span /></div>
          <motion.button onClick={() => finish(DEMO_ACCOUNT, "login")} disabled={loading} className="au-ghost" whileTap={{ scale: 0.98 }}>
            <Sparkles size={16} /> {t("Continue with the demo account")}
          </motion.button>
        </>}

        <p className="au-legal">{t("By continuing you agree to Bite's")}{" "}<a href="legal.html#terms" target="_blank" rel="noopener">{t("Terms")}</a>{" "}{t("and")}{" "}<a href="legal.html#privacy" target="_blank" rel="noopener">{t("Privacy Policy")}</a>.
          <br />{live ? t("Your account is stored securely on servers in Frankfurt, Germany.") : t("Demo: your details stay in this browser only.")}</p>
      </div>
    </Shell>
  );
}

function Input({ Icon, label, value, onChange, error, type = "text", placeholder, autoComplete, trailing }: {
  Icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className={`au-field ${error ? "bad" : ""}`}>
      <span className="au-label">{label}</span>
      <span className="au-line">
        <Icon size={16} aria-hidden />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} />
        {trailing}
      </span>
      {error && <span role="alert" className="au-field-error">{error}</span>}
    </label>
  );
}

/** The screen around the reservation book: the night, the table with your seat, the logo, a way back */
function Shell({ children, onBack, name = "", mode = "plain" }: { children: React.ReactNode; onBack?: () => void; name?: string; mode?: "signup" | "login" | "plain" }) {
  return (
    <div className="au">
      <div className="au-wrap">
        <aside className="au-side">
          <div className="au-top">
            {onBack ? (
              <motion.button onClick={onBack} aria-label={t("Back")} className="au-back" whileTap={{ scale: 0.9 }}><ChevronLeft size={18} /></motion.button>
            ) : <span style={{ width: 40 }} />}
            <img src={logoImg} alt="Bite" className="au-logo" />
            <span style={{ width: 40 }} />
          </div>
          <AuthScene name={name} mode={mode} />
          <div className="au-side-text">
            <p className="au-side-title">{t("There's a seat for you.")}</p>
            <ul>
              <li>{t("Real neighbours, with real names and photos")}</li>
              <li>{t("Free to join. You pay your share at the table")}</li>
              <li>{t("You choose who sits at your table")}</li>
            </ul>
          </div>
        </aside>
        <main className="au-main">{children}</main>
      </div>
    </div>
  );
}

/** Live mode: opened from the password-reset email */
function NewPassword({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError(t("At least 8 characters")); return; }
    setLoading(true);
    const res = await liveSetNewPassword(password);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? ""); return; }
    store.showToast(t("New password saved"));
    onDone();
  };
  return (
    <Shell>
      <div className="au-page">
        <h1 className="au-title">{t("Choose a new password")}</h1>
        <p className="au-lead">{t("You will stay logged in on this device.")}</p>
        <form onSubmit={save} noValidate className="au-form">
          <Input Icon={Lock} label={t("New password")} type={show ? "text" : "password"} value={password} onChange={setPassword} error={error} autoComplete="new-password" placeholder={t("At least 8 characters")}
            trailing={<button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t("Hide password") : t("Show password")} className="au-eye">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
          <motion.button type="submit" disabled={loading} className="au-submit" whileTap={{ scale: 0.98 }}>
            {loading ? <ThinkingOrb state="connecting" size={20} theme="dark" aria-label={t("Loading…")} /> : <><span>{t("Save new password")}</span><i aria-hidden>→</i></>}
          </motion.button>
        </form>
      </div>
    </Shell>
  );
}
