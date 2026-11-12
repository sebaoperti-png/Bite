import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff, Sparkles, MailCheck } from "lucide-react";
import logoImg from "../logo.png";
import { DEMO_ACCOUNT, shortName, useStore, type Account } from "../store";
import { t } from "../../shared/i18n";
import { liveResetPassword, liveSetNewPassword, liveSignIn, liveSignUp } from "../liveAuth";

export type AuthMode = "signup" | "login";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sign up / log in.
 * Demo mode: the account lives only in this browser and the password is checked for length but never stored or sent anywhere.
 * Live mode (bite.html?live): real accounts through Supabase (see liveAuth.ts). After sign-up the person confirms
 * their email; after "Forgot password?" they get a link and choose a new password here (store.recovering).
 */
export function AuthScreen({ initialMode, onBack, onDone }: { initialMode: AuthMode; onBack?: () => void; onDone: (mode: AuthMode) => void }) {
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
    <Shell onBack={() => setSent(null)}>
      <div className="mt-10 text-center">
        <span className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(155,74,255,0.18)" }}><MailCheck size={28} color="#b87fff" /></span>
        <h1 className="mt-5" style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{t("Check your inbox")}</h1>
        <p className="mt-3" style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
          {sent === "confirm"
            ? t("We sent a link to {email}. Open it to confirm your email, then you are in.", { email: email.trim().toLowerCase() })
            : t("If there is an account for {email}, we sent a link to choose a new password.", { email: email.trim().toLowerCase() })}
        </p>
        <p className="mt-3" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>{t("Nothing there? Check your spam folder.")}</p>
        <button onClick={() => { setSent(null); setMode("login"); }} className="mt-7 w-full py-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{t("Back to log in")}</button>
      </div>
    </Shell>
  );

  return (
    <div className="relative h-full overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif", background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,33,217,0.55) 0%, transparent 70%), linear-gradient(180deg, #1c0e3a 0%, #0e0620 100%)" }}>
      <div style={{ height: "max(env(safe-area-inset-top), 14px)" }} />
      <div className="mx-auto w-full max-w-[440px] px-5 pb-10 md:pt-10">
        <div className="flex items-center justify-between pt-2">
          {onBack ? (
            <motion.button onClick={onBack} aria-label={t("Back")} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.9 }}>
              <ChevronLeft size={18} color="#fff" />
            </motion.button>
          ) : <div style={{ width: 40 }} />}
          <img src={logoImg} alt="Bite" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div style={{ width: 40 }} />
        </div>

        <div className="mt-8 text-center">
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{mode === "signup" ? t("Create your account") : t("Welcome back")}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>{mode === "signup" ? t("Join your neighbours around the table.") : t("Log in to see your bookings and messages.")}</p>
        </div>

        {/* Mode switch */}
        <div className="mt-7 grid grid-cols-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} role="tablist">
          {(["signup", "login"] as AuthMode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErrors({}); }} className="relative py-2.5 rounded-xl">
              {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl" style={{ background: "#6b21d9" }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative" style={{ fontSize: 14, fontWeight: 800, color: mode === m ? "#fff" : "rgba(255,255,255,0.55)" }}>{m === "signup" ? t("Sign up") : t("Log in")}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-3">
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
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t("Hide password") : t("Show password")} className="p-1">
                {showPw ? <EyeOff size={16} color="rgba(255,255,255,0.6)" /> : <Eye size={16} color="rgba(255,255,255,0.6)" />}
              </button>
            }
          />
          {mode === "signup" && (
            <label className="flex items-center gap-3 cursor-pointer" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>
              <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="w-4 h-4 accent-[#9b4aff]" />{t("Keep me updated on Bite's news")}</label>
          )}
          {mode === "login" && (
            <button type="button" onClick={() => void forgot()} className="self-end" style={{ fontSize: 12.5, color: "#b87fff", fontWeight: 700 }}>{t("Forgot password?")}</button>
          )}

          {errors.form && <p role="alert" className="px-1" style={{ fontSize: 13, color: "#ff8fa6", fontWeight: 600 }}>{errors.form}</p>}
          <motion.button type="submit" disabled={loading} className="mt-2 w-full py-4 rounded-2xl flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)", boxShadow: "0 12px 28px rgba(107,33,217,0.35)" }} whileTap={{ scale: 0.97 }}>
            {loading ? (
              <ThinkingOrb state="connecting" size={20} theme="dark" aria-label={t("Loading…")} />
            ) : (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{mode === "signup" ? t("Create account") : t("Log in")}</span>
            )}
          </motion.button>
        </form>

        {!live && <>
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t("or")}</span>
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        <motion.button onClick={() => finish(DEMO_ACCOUNT, "login")} disabled={loading} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }} whileTap={{ scale: 0.97 }}>
          <Sparkles size={16} color="#b87fff" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{t("Continue with the demo account")}</span>
        </motion.button>
        </>}

        <p className="text-center mt-6" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{t("By continuing you agree to Bite's")}{" "}<a href="legal.html#terms" target="_blank" rel="noopener" style={{ color: "#b87fff" }}>{t("Terms")}</a>{" "}{t("and")}{" "}<a href="legal.html#privacy" target="_blank" rel="noopener" style={{ color: "#b87fff" }}>{t("Privacy Policy")}</a>.
          <br />{live ? t("Your account is stored securely on servers in Frankfurt, Germany.") : t("Demo: your details stay in this browser only.")}</p>
      </div>
    </div>
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
    <label className="block">
      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.03em" }}>{label}</span>
      <span className="mt-1.5 flex items-center gap-2.5 px-4 rounded-2xl" style={{ height: 50, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${error ? "#ff6b8a" : "rgba(255,255,255,0.12)"}` }}>
        <Icon size={16} color="rgba(255,255,255,0.5)" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="flex-1 bg-transparent outline-none min-w-0 placeholder:text-white/30"
          style={{ fontSize: 15, color: "#fff" }}
        />
        {trailing}
      </span>
      {error && <span role="alert" className="block mt-1" style={{ fontSize: 12, color: "#ff8fa6", fontWeight: 600 }}>{error}</span>}
    </label>
  );
}

/** Same background and header as the log-in screen, for the smaller live-mode steps */
function Shell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="relative h-full overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif", background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,33,217,0.55) 0%, transparent 70%), linear-gradient(180deg, #1c0e3a 0%, #0e0620 100%)" }}>
      <div style={{ height: "max(env(safe-area-inset-top), 14px)" }} />
      <div className="mx-auto w-full max-w-[440px] px-5 pb-10 md:pt-10">
        <div className="flex items-center justify-between pt-2">
          {onBack ? (
            <motion.button onClick={onBack} aria-label={t("Back")} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.9 }}>
              <ChevronLeft size={18} color="#fff" />
            </motion.button>
          ) : <div style={{ width: 40 }} />}
          <img src={logoImg} alt="Bite" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div style={{ width: 40 }} />
        </div>
        {children}
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
      <div className="mt-8 text-center">
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{t("Choose a new password")}</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>{t("You will stay logged in on this device.")}</p>
      </div>
      <form onSubmit={save} noValidate className="mt-7 flex flex-col gap-3">
        <Input Icon={Lock} label={t("New password")} type={show ? "text" : "password"} value={password} onChange={setPassword} error={error} autoComplete="new-password" placeholder={t("At least 8 characters")}
          trailing={<button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t("Hide password") : t("Show password")} className="p-1">{show ? <EyeOff size={16} color="rgba(255,255,255,0.6)" /> : <Eye size={16} color="rgba(255,255,255,0.6)" />}</button>} />
        <motion.button type="submit" disabled={loading} className="mt-2 w-full py-4 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }} whileTap={{ scale: 0.97 }}>
          {loading ? <ThinkingOrb state="connecting" size={20} theme="dark" aria-label={t("Loading…")} /> : <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{t("Save new password")}</span>}
        </motion.button>
      </form>
    </Shell>
  );
}
