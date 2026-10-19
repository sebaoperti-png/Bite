import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";
import logoImg from "../logo.png";
import { DEMO_ACCOUNT, shortName, useStore, type Account } from "../store";
import { t } from "../../shared/i18n";

export type AuthMode = "signup" | "login";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sign up / log in. This is a demo: the account lives only in this browser and the password is
 * checked for length but never stored or sent anywhere.
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

  const finish = (account: Account, m: AuthMode) => {
    setLoading(true);
    setTimeout(() => {
      store.signIn(account);
      if (m === "signup") store.updateProfile({ news });
      store.showToast(m === "signup" ? t("Welcome to Bite, {name}!", { name: account.name.split(" ")[0] }) : t("Welcome back, {name}", { name: account.name.split(" ")[0] }));
      onDone(m);
    }, 700);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (mode === "signup" && name.trim().length < 2) errs.name = t("Please enter your name");
    if (!EMAIL_RE.test(email.trim())) errs.email = t("Enter a valid email address");
    if (password.length < 6) errs.password = t("At least 6 characters");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (mode === "signup") {
      finish({ name: shortName(name), email: email.trim().toLowerCase() }, "signup");
    } else {
      // Log in: reuse the name of an account created in this browser, otherwise derive it from the email
      const known = store.account && store.account.email === email.trim().toLowerCase() ? store.account : null;
      const fromEmail = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      finish(known ?? { name: shortName(fromEmail) || fromEmail, email: email.trim().toLowerCase() }, "login");
    }
  };

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
            placeholder={t("At least 6 characters")}
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
            <button type="button" onClick={() => store.showToast(t("Password reset link sent (demo)"))} className="self-end" style={{ fontSize: 12.5, color: "#b87fff", fontWeight: 700 }}>{t("Forgot password?")}</button>
          )}

          <motion.button type="submit" disabled={loading} className="mt-2 w-full py-4 rounded-2xl flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)", boxShadow: "0 12px 28px rgba(107,33,217,0.35)" }} whileTap={{ scale: 0.97 }}>
            {loading ? (
              <ThinkingOrb state="connecting" size={20} theme="dark" aria-label={t("Loading…")} />
            ) : (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{mode === "signup" ? t("Create account") : t("Log in")}</span>
            )}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t("or")}</span>
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        <motion.button onClick={() => finish(DEMO_ACCOUNT, "login")} disabled={loading} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }} whileTap={{ scale: 0.97 }}>
          <Sparkles size={16} color="#b87fff" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{t("Continue with the demo account")}</span>
        </motion.button>

        <p className="text-center mt-6" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{t("By continuing you agree to Bite's")}{" "}<a href="legal.html#terms" target="_blank" rel="noopener" style={{ color: "#b87fff" }}>{t("Terms")}</a>{" "}{t("and")}{" "}<a href="legal.html#privacy" target="_blank" rel="noopener" style={{ color: "#b87fff" }}>{t("Privacy Policy")}</a>.
          <br />{t("Demo: your details stay in this browser only.")}</p>
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
