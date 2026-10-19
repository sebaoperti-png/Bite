import { ChefHat, Home, MessageCircle, Search, User } from "lucide-react";
import { Avatar } from "./Avatar";
import { motion } from "motion/react";
import logoImg from "../logo.png";
import { t } from "../../shared/i18n";
import { LangSwitch } from "../../shared/LangSwitch";

export type NavTab = "home" | "browse" | "messages" | "profile";

const ITEMS: { id: NavTab; label: string; Icon: React.ElementType }[] = [
  { id: "home",     label: "Home",     Icon: Home },
  { id: "browse",   label: "Browse",   Icon: Search },
  { id: "messages", label: "Messages", Icon: MessageCircle },
  { id: "profile",  label: "Profile",  Icon: User },
];

/** Desktop-only navigation bar: replaces the phone's bottom tab bar on wide screens. */
export function DesktopTopBar({ active, unread, name, onNavigate, onStartHosting }: {
  active: NavTab | null;
  unread: number;
  name: string;
  onNavigate: (tab: NavTab) => void;
  onStartHosting: () => void;
}) {
  return (
    <header className="flex-shrink-0" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(107,33,217,0.08)", fontFamily: "'Inter', sans-serif", position: "relative", zIndex: 30 }}>
      <div className="mx-auto flex items-center gap-8 px-8" style={{ maxWidth: 1240, height: 68 }}>
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5" aria-label={t("Bite home")}>
          <img src={logoImg} alt="" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.04em", color: "#160a2e" }}>Bite</span>
        </button>

        <nav className="flex items-center gap-1" aria-label={t("Main")}>
          {ITEMS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={isActive ? "page" : undefined}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors hover:bg-[#f5f0ff]"
              >
                {/* one pill that slides to the active tab (transitions.dev "sliding tabs") */}
                {isActive && <motion.span layoutId="top-pill" className="absolute inset-0 rounded-xl" style={{ background: "#ede8fb" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
                <Icon size={16} color={isActive ? "#6b21d9" : "#7c6fa0"} strokeWidth={isActive ? 2.4 : 1.9} style={{ position: "relative" }} />
                <span style={{ position: "relative", fontSize: 14, fontWeight: 700, color: isActive ? "#6b21d9" : "#4b3a6b", transition: "color .25s" }}>{t(label)}</span>
                {id === "messages" && unread > 0 && (
                  <motion.span key={unread} initial={{ scale: 0.2 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 14 }} className="relative px-1.5 rounded-full" style={{ background: "#e9345a", fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: "18px", minWidth: 18, textAlign: "center" }}>{unread}</motion.span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LangSwitch size="sm" />
          <button
            onClick={onStartHosting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-transform hover:-translate-y-px"
            style={{ background: "#160a2e" }}
          >
            <ChefHat size={15} color="#b87fff" strokeWidth={2.3} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>{t("Start hosting")}</span>
          </button>
          <button onClick={() => onNavigate("profile")} className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full" style={{ background: "#ede8fb" }} aria-label={t("Your profile")}>
            <Avatar size={28} fontSize={11} />
            <span style={{ fontSize: 13.5, color: "#6b21d9", fontWeight: 700 }}>{name.split(" ")[0]}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
