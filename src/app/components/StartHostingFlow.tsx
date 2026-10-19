import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { generate } from "../../lib/ui-generation.js";
import { useStore } from "../store";
import { labelForISO, euro, type Meal, type ServiceType } from "../data";
import { writeDescription, TONES, type Tone } from "../descriptionWriter";
import { estimateGroceries, fairShare as shareOf, priceCap, readReceipt, type CostSource } from "../costing";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, ChefHat, MapPin, Clock, Users, Star,
  Utensils, Leaf, Wheat, Apple, Fish, Egg, CheckCircle, BadgeCheck,
  Cigarette, Wine, PawPrint, Footprints, Camera, ImageIcon, Plus, Minus,
  Home, Sun, Lock, Unlock, Bean,
  DollarSign, AlertCircle, Flame, Globe, Save, Eye, ShieldCheck, Sparkles, Receipt,
} from "lucide-react";
import { t, dateLabel, dec } from "../../shared/i18n";
import { localPlace } from "../location";
import { resizeImage } from "../image";
import { Avatar, usePhotoPicker } from "./Avatar";

interface StartHostingFlowProps {
  onBack: () => void;
  onPublished: (meal: Meal) => void;
}

const CUISINES = ["Italian","Mexican","Japanese","Thai","Indian","French","Mediterranean","American","Korean","Lebanese","Moroccan","Greek","Spanish","Chinese","Turkish","Vietnamese"];
const TOTAL_STEPS = 8;

const STEP_LABELS = [
  "Basic Info","Menu","Guests","Location","Split the cost","House Rules","Photos","Review",
];
const STEP_ICONS = [ChefHat, Utensils, Users, MapPin, DollarSign, Home, Camera, Eye];

/* ── Form state shape ── */
interface FormData {
  // Step 1
  serviceType: ServiceType;
  eventTitle: string;
  mealName: string;
  cuisineType: string;
  description: string;
  // Step 2
  mainDishes: string;
  appetizers: string;
  desserts: string;
  drinksIncluded: boolean;
  dietary: Set<string>;
  allergens: Set<string>;
  allergyNotes: string;
  // Step 3
  maxGuests: number;
  minGuests: number;
  adultsOnly: boolean;
  familyFriendly: boolean;
  guestsBringFriends: boolean;
  privateEvent: boolean;
  genderPreference: string;
  // Step 4
  address: string;
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: "indoor" | "outdoor" | "both";
  parkingAvailable: boolean;
  publicTransport: boolean;
  // Step 5
  groceryCost: number;
  costSource: CostSource | null;
  receiptPreview: string;
  receiptItems: number;
  pricePerGuest: number;
  freeEvent: boolean;
  discountEnabled: boolean;
  discountPercent: number;
  // Step 6
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  petsPresent: boolean;
  shoesOff: boolean;
  houseRules: string;
  // Step 7
  photos: string[];
  coverIdx: number;
}

// Suggested photos (shipped with the app so the demo works offline): a shared table first, then dishes
const MOCK_PHOTOS = [
  "app/img/1504754524776-800x533.jpg",
  "app/img/1476124369491-800x533.jpg",
  "app/img/1551183053-800x533.jpg",
  "app/img/1513104890138-800x533.jpg",
  "app/img/1565299624946-800x533.jpg",
  "app/img/1414235077428-800x533.jpg",
];

const INITIAL: FormData = {
  serviceType: "eat-together",
  eventTitle: "", mealName: "", cuisineType: "", description: "",
  mainDishes: "", appetizers: "", desserts: "", drinksIncluded: true,
  dietary: new Set(), allergens: new Set(), allergyNotes: "",
  maxGuests: 6, minGuests: 2,
  adultsOnly: false, familyFriendly: true, guestsBringFriends: false, privateEvent: false, genderPreference: "no-preference",
  address: "", city: "", date: "", startTime: "19:00", endTime: "22:00",
  venue: "indoor", parkingAvailable: false, publicTransport: true,
  groceryCost: 42, costSource: null, receiptPreview: "", receiptItems: 0, pricePerGuest: 6, freeEvent: false, discountEnabled: false, discountPercent: 10,
  smokingAllowed: false, alcoholAllowed: true, petsPresent: false, shoesOff: false, houseRules: "",
  photos: [MOCK_PHOTOS[0]], coverIdx: 0,
};

const DRAFT_KEY = "bite_hosting_draft";
const DIET_TO_TAG: Record<string, string> = { vegetarian: "Vegetarian", vegan: "Vegan", "gluten-free": "Gluten-free", halal: "Halal", "lactose-free": "Dairy-free" };

const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

/** What's still missing on a step, if anything */
function stepError(step: number, f: FormData): string {
  if (step === 0) {
    if (!f.eventTitle.trim()) return t("Give your event a title");
    if (!f.mealName.trim()) return t("Add the name of the meal");
    if (!f.cuisineType) return t("Pick a cuisine");
  }
  if (step === 1 && !f.mainDishes.trim()) return t("Tell guests what the main dish is");
  if (step === 2 && f.minGuests > f.maxGuests) return t("Minimum guests can't be more than the maximum");
  if (step === 3) {
    if (!f.address.trim()) return t("Add your street address (shared only with booked guests)");
    if (!f.city.trim()) return t("Add your city");
    if (!f.date) return t("Pick a date");
    if (f.date < todayISO()) return t("The date must be today or later");
    if (f.endTime <= f.startTime) return t("End time must be after the start time");
  }
  if (step === 4 && !f.freeEvent) {
    if (!f.costSource) return t("Scan your receipt or let Bite estimate the grocery cost");
    if (f.groceryCost <= 0) return t("Enter what the groceries cost");
    const cap = priceCap(f.groceryCost, f.maxGuests + 1, f.costSource);
    if (f.pricePerGuest > cap) return t("The price cap is {price} per guest — you can't charge more than the real cost", { price: euro(cap) });
  }
  if (step === 6 && f.photos.length === 0) return t("Add at least one photo");
  return "";
}

/** A round avatar with the host's initial, as an inline SVG */
function initialAvatar(name: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b21d9"/><stop offset="1" stop-color="#9b4aff"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><text x="80" y="104" font-family="Inter,Arial,sans-serif" font-size="72" font-weight="800" fill="#fff" text-anchor="middle">${(name.charAt(0) || "B").toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Shrinks an uploaded photo so it fits comfortably in localStorage */

/* ── Shared primitives ── */

const purple = "#6b21d9";
const lightPurple = "#ede8fb";
const inputStyle: React.CSSProperties = {
  background: "#f5f4f9", border: "1.5px solid rgba(107,33,217,0.13)",
  borderRadius: 14, padding: "12px 16px", fontSize: 14, color: "#160a2e",
  width: "100%", outline: "none", fontFamily: "inherit", fontWeight: 500,
};

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: "#7c6fa0", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{children}</p>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "18px 16px", boxShadow: "0 2px 12px rgba(107,33,217,0.07)", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 17, fontWeight: 800, color: "#160a2e", marginBottom: 16 }}>{children}</p>;
}

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: "10px 0", borderBottom: "1px solid rgba(107,33,217,0.06)" }}>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#160a2e" }}>{t(label)}</p>
        {desc && <p style={{ fontSize: 11.5, color: "#7c6fa0", marginTop: 1 }}>{t(desc)}</p>}
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0"
        style={{ width: 46, height: 26, borderRadius: 13, background: value ? purple : "#d1c9e8" }}
        animate={{ background: value ? purple : "#d1c9e8" }}
        whileTap={{ scale: 0.93 }}
      >
        <motion.div
          className="absolute top-1 rounded-full"
          style={{ width: 18, height: 18, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          animate={{ left: value ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </motion.button>
    </div>
  );
}

function ChipGrid({ options, selected, onToggle, color = purple, bg = lightPurple }: {
  options: { id: string; label: string; icon?: React.ElementType }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  color?: string; bg?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, label, icon: Icon }) => {
        const active = selected.has(id);
        return (
          <motion.button
            key={id}
            onClick={() => onToggle(id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ background: active ? color : "#f5f4f9", border: `1.5px solid ${active ? color : "rgba(107,33,217,0.1)"}` }}
            whileTap={{ scale: 0.9 }}
          >
            {Icon && <Icon size={12} color={active ? "#fff" : color} strokeWidth={2} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#fff" : color }}>{t(label)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Counter({ value, min, max, onChange, label, sublabel }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: "1px solid rgba(107,33,217,0.06)" }}>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#160a2e" }}>{t(label)}</p>
        {sublabel && <p style={{ fontSize: 11.5, color: "#7c6fa0" }}>{t(sublabel)}</p>}
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: value <= min ? "#f0ecfa" : lightPurple, border: `1.5px solid ${value <= min ? "rgba(107,33,217,0.1)" : purple}` }}
          whileTap={{ scale: 0.85 }}
        >
          <Minus size={14} color={value <= min ? "#c4b8de" : purple} strokeWidth={2.5} />
        </motion.button>
        <motion.span
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontSize: 17, fontWeight: 800, color: "#160a2e", minWidth: 28, textAlign: "center" }}
        >{value}</motion.span>
        <motion.button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: value >= max ? "#f0ecfa" : purple, border: `1.5px solid ${value >= max ? "rgba(107,33,217,0.1)" : purple}` }}
          whileTap={{ scale: 0.85 }}
        >
          <Plus size={14} color={value >= max ? "#c4b8de" : "#fff"} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}

/* ── Step components ── */

/** Description with an assistant that drafts it from the title, dish and cuisine */
function DescriptionField({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const { profile } = useStore();
  const [tone, setTone] = useState<Tone | null>(null);
  const [writing, setWriting] = useState(false);
  // Before the words arrive the assistant "thinks" for a moment (0 reading the dish, 1 choosing words)
  const [thinking, setThinking] = useState<0 | 1 | null>(null);
  const timer = useRef<number>();
  const pause = useRef<number[]>([]);
  const canWrite = !!(form.mealName.trim() || form.eventTitle.trim() || form.cuisineType);

  useEffect(() => () => { window.clearInterval(timer.current); pause.current.forEach((id) => window.clearTimeout(id)); }, []);

  const write = (t: Tone) => {
    window.clearInterval(timer.current);
    pause.current.forEach((id) => window.clearTimeout(id));
    setTone(t);
    setWriting(true);
    setThinking(0);
    const text = writeDescription({ mealName: form.mealName, eventTitle: form.eventTitle, cuisine: form.cuisineType, serviceType: form.serviceType, firstName: profile.name.split(" ")[0] }, t);
    const words = text.split(" ");
    pause.current = [
      window.setTimeout(() => setThinking(1), 650),
      window.setTimeout(() => {
        setThinking(null);
        set("description", "");
        let i = 0;
        timer.current = window.setInterval(() => {
          i += 1;
          set("description", words.slice(0, i).join(" ").slice(0, 400));
          if (i >= words.length) { window.clearInterval(timer.current); setWriting(false); }
        }, 38);
      }, 1350),
    ];
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Label>{t("Description")}</Label>
        <motion.button
          type="button"
          onClick={() => write(tone ? TONES[(TONES.findIndex((x) => x.id === tone) + 1) % TONES.length].id : "cosy")}
          disabled={!canWrite || writing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: canWrite ? "linear-gradient(135deg, #6b21d9, #9b4aff)" : "#ede8fb", marginBottom: 6 }}
          whileTap={{ scale: 0.94 }}
          title={canWrite ? t("Draft a description from your title, dish and cuisine") : t("Add a title, meal name or cuisine first")}
        >
          {writing ? <ThinkingOrb state="composing" size={20} theme="dark" aria-label={t("Writing…")} /> : <Sparkles size={13} color={canWrite ? "#fff" : "#a99cc8"} strokeWidth={2.4} />}
          <span style={{ fontSize: 12, fontWeight: 800, color: canWrite ? "#fff" : "#a99cc8" }}>{writing ? t("Writing…") : tone ? t("Try another") : t("Write it for me")}</span>
        </motion.button>
      </div>
      {tone && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {TONES.map((tn) => (
            <button key={tn.id} type="button" onClick={() => write(tn.id)} disabled={writing} className="px-2.5 py-1 rounded-full" style={{ fontSize: 11.5, fontWeight: 700, background: tone === tn.id ? purple : lightPurple, color: tone === tn.id ? "#fff" : purple }}>
              {t(tn.label)}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
      {thinking !== null && (
        <div className="hf-thinking" aria-live="polite">
          <ThinkingOrb state={thinking === 0 ? "searching" : "composing"} size={64} theme="light" />
          <span key={thinking}>{thinking === 0 ? t("Tasting your idea…") : t("Finding the right words…")}</span>
        </div>
      )}
      <textarea
        style={{ ...inputStyle, resize: "none", lineHeight: 1.6, borderColor: writing ? "#9b4aff" : undefined, boxShadow: writing ? "0 0 0 4px rgba(155,74,255,0.12)" : undefined, transition: "box-shadow .3s, border-color .3s" }}
        rows={5}
        placeholder={t("Describe the experience — the atmosphere, the story behind the dish, what guests can expect…")}
        value={form.description}
        maxLength={400}
        onChange={e => { window.clearInterval(timer.current); pause.current.forEach((id) => window.clearTimeout(id)); setThinking(null); setWriting(false); set("description", e.target.value); }}
      />
      </div>
      <p style={{ fontSize: 11, color: "#c4b8de", textAlign: "right", marginTop: 4 }}>
        {tone && !writing && <span style={{ float: "left", color: "#7c6fa0" }}>{t("Drafted by the Bite assistant — edit it as you like")}</span>}
        {form.description.length}/400
      </p>
    </>
  );
}

function Step1({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const { profile } = useStore();
  const picker = usePhotoPicker();
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Tell guests about your event")}</SectionTitle>

      {/* Host mini-profile */}
      <Card>
        <Label>{t("Your hosting profile")}</Label>
        <div className="flex items-center gap-3">
          <button type="button" className="relative" onClick={picker.open} aria-label={profile.photo ? t("Change profile photo") : t("Add a profile photo")}>
            <Avatar size={56} fontSize={22} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: purple, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={10} color="#fff" strokeWidth={2.5} />
            </div>
          </button>
          {picker.input}
          <div>
            <div className="flex items-center gap-1.5">
              <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{profile.name}</p>
              <BadgeCheck size={14} color="#0a7c4e" strokeWidth={2} />
            </div>
            <p style={{ fontSize: 12, color: "#7c6fa0" }}>{t("{place} · Verified host", { place: localPlace(profile.neighbourhood) })}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#160a2e" }}>{dec(4.9)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <Label>{t("Type of event")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "pickup", label: "Pick-up", Icon: Utensils },
            { id: "eat-together", label: "Eat together", Icon: Users },
            { id: "cook-together", label: "Cook together", Icon: ChefHat },
          ] as const).map(({ id, label, Icon }) => {
            const on = form.serviceType === id;
            return (
              <motion.button key={id} onClick={() => set("serviceType", id)} aria-pressed={on} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl" style={{ background: on ? lightPurple : "#f5f4f9", border: `1.5px solid ${on ? purple : "rgba(107,33,217,0.1)"}` }} whileTap={{ scale: 0.95 }}>
                <Icon size={18} color={on ? purple : "#7c6fa0"} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? purple : "#4a3a6e" }}>{t(label)}</span>
              </motion.button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <Label>{t("Event title")}</Label>
            <input
              style={inputStyle}
              placeholder={t("e.g. An Authentic Italian Sunday Dinner")}
              value={form.eventTitle}
              onChange={e => set("eventTitle", e.target.value)}
            />
          </div>
          <div>
            <Label>{t("Meal name")}</Label>
            <input
              style={inputStyle}
              placeholder={t("e.g. Homemade Tagliatelle al Ragù")}
              value={form.mealName}
              onChange={e => set("mealName", e.target.value)}
            />
          </div>
          <div>
            <Label>{t("Cuisine type")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CUISINES.map(c => {
                const active = form.cuisineType === c;
                return (
                  <motion.button
                    key={c}
                    onClick={() => set("cuisineType", active ? "" : c)}
                    className="px-3 py-1.5 rounded-full"
                    style={{ background: active ? purple : "#f5f4f9", border: `1.5px solid ${active ? purple : "rgba(107,33,217,0.1)"}` }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#fff" : purple }}>{t(c)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div>
            <DescriptionField form={form} set={set} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Step2({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const toggle = (key: "dietary" | "allergens", val: string) => {
    const s = new Set(form[key]);
    s.has(val) ? s.delete(val) : s.add(val);
    set(key, s);
  };

  const DIETARY_OPTS = [
    { id: "vegetarian", label: "Vegetarian", icon: Leaf },
    { id: "vegan", label: "Vegan", icon: Apple },
    { id: "gluten-free", label: "Gluten-Free", icon: Wheat },
    { id: "halal", label: "Halal", icon: CheckCircle },
    { id: "lactose-free", label: "Lactose-Free", icon: CheckCircle },
  ];
  const ALLERGEN_OPTS = [
    { id: "nuts", label: "Nuts", icon: Flame },
    { id: "milk", label: "Milk" },
    { id: "eggs", label: "Eggs", icon: Egg },
    { id: "fish", label: "Fish", icon: Fish },
    { id: "shellfish", label: "Shellfish", icon: Utensils },
    { id: "soy", label: "Soy", icon: Bean },
    { id: "gluten", label: "Gluten", icon: Wheat },
    { id: "sesame", label: "Sesame" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("What's on the menu?")}</SectionTitle>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <Label>{t("Main dishes")}</Label>
            <textarea style={{ ...inputStyle, resize: "none" }} rows={2}
              placeholder={t("e.g. Tagliatelle al Ragù, Risotto ai Funghi")}
              value={form.mainDishes} onChange={e => set("mainDishes", e.target.value)} />
          </div>
          <div>
            <Label>{t("Appetizers")}</Label>
            <input style={inputStyle} placeholder={t("e.g. Bruschetta, Antipasto board")}
              value={form.appetizers} onChange={e => set("appetizers", e.target.value)} />
          </div>
          <div>
            <Label>{t("Desserts")}</Label>
            <input style={inputStyle} placeholder={t("e.g. Tiramisu, Panna cotta")}
              value={form.desserts} onChange={e => set("desserts", e.target.value)} />
          </div>
          <Toggle value={form.drinksIncluded} onChange={v => set("drinksIncluded", v)}
            label={t("Drinks included")} desc="Water, juice or wine included in price" />
        </div>
      </Card>

      <Card>
        <Label>{t("Dietary options available")}</Label>
        <ChipGrid
          options={DIETARY_OPTS as any}
          selected={form.dietary}
          onToggle={id => toggle("dietary", id)}
          color="#0a7c4e"
          bg="#e5f7f0"
        />
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={15} color="#c05e00" strokeWidth={2} />
          <Label>{t("Allergens present")}</Label>
        </div>
        <ChipGrid
          options={ALLERGEN_OPTS as any}
          selected={form.allergens}
          onToggle={id => toggle("allergens", id)}
          color="#c05e00"
          bg="#fff4e5"
        />
        <div style={{ marginTop: 14 }}>
          <Label>{t("Additional allergy notes")}</Label>
          <textarea style={{ ...inputStyle, resize: "none" }} rows={2}
            placeholder={t("Any cross-contamination risks or other notes…")}
            value={form.allergyNotes} onChange={e => set("allergyNotes", e.target.value)} />
        </div>
      </Card>
    </div>
  );
}

function Step3({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const GENDER_OPTS = [
    { id: "no-preference", label: "No preference" },
    { id: "women-only", label: "Women only" },
    { id: "men-only", label: "Men only" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Who can join?")}</SectionTitle>

      <Card>
        <Counter value={form.maxGuests} min={1} max={20} onChange={v => set("maxGuests", v)}
          label={t("Maximum guests")} sublabel="How many people can attend" />
        <Counter value={form.minGuests} min={1} max={form.maxGuests} onChange={v => set("minGuests", v)}
          label={t("Minimum guests")} sublabel="Event won't run below this" />
      </Card>

      <Card>
        <Toggle value={form.adultsOnly} onChange={v => set("adultsOnly", v)}
          label={t("Adults only (18+)")} desc="Guests must be 18 or older" />
        <Toggle value={form.familyFriendly} onChange={v => set("familyFriendly", v)}
          label={t("Family friendly")} desc="Children are welcome" />
        <Toggle value={form.guestsBringFriends} onChange={v => set("guestsBringFriends", v)}
          label={t("Guests can bring a +1")} desc="Unregistered companions allowed" />
        <Toggle value={form.privateEvent} onChange={v => set("privateEvent", v)}
          label={t("Private event")} desc="Only invited guests can see this" />
      </Card>

      <Card>
        <Label>{t("Gender preference (optional)")}</Label>
        <div className="flex flex-col gap-2">
          {GENDER_OPTS.map(({ id, label }) => (
            <motion.button
              key={id}
              onClick={() => set("genderPreference", id)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: form.genderPreference === id ? lightPurple : "#f5f4f9", border: `1.5px solid ${form.genderPreference === id ? purple : "transparent"}` }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                animate={{ borderColor: form.genderPreference === id ? purple : "#c4b8de", background: form.genderPreference === id ? purple : "#fff" }}
              >
                {form.genderPreference === id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </motion.div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#160a2e" }}>{t(label)}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Visibility card */}
      <div className="px-1">
        <div className="flex gap-3">
          {[
            { id: false, Icon: Unlock, label: "Open Event", desc: "Anyone can discover & join" },
            { id: true, Icon: Lock, label: "Private", desc: "Invite-only, not listed" },
          ].map(({ id, Icon, label, desc }) => (
            <motion.button
              key={String(id)}
              onClick={() => set("privateEvent", id)}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
              style={{ background: form.privateEvent === id ? lightPurple : "#fff", border: `1.5px solid ${form.privateEvent === id ? purple : "rgba(107,33,217,0.1)"}`, boxShadow: "0 2px 8px rgba(107,33,217,0.06)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={22} color={form.privateEvent === id ? purple : "#7c6fa0"} strokeWidth={1.8} />
              <p style={{ fontSize: 13, fontWeight: 700, color: form.privateEvent === id ? purple : "#160a2e" }}>{t(label)}</p>
              <p style={{ fontSize: 11, color: "#7c6fa0", textAlign: "center", lineHeight: 1.4 }}>{t(desc)}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Where & when?")}</SectionTitle>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <Label>{t("Street address")}</Label>
            <div className="relative">
              <MapPin size={14} color={purple} strokeWidth={2} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input style={{ ...inputStyle, paddingLeft: 38 }} placeholder={t("Berger Str. 12")}
                value={form.address} onChange={e => set("address", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("City")}</Label>
            <input style={inputStyle} placeholder={t("e.g. Berlin")}
              value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <Label>{t("Date")}</Label>
            <input type="date" min={todayISO()} style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>{t("Start time")}</Label>
              <div className="relative">
                <Clock size={13} color={purple} strokeWidth={2} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="time" style={{ ...inputStyle, paddingLeft: 34 }} value={form.startTime} onChange={e => set("startTime", e.target.value)} />
              </div>
            </div>
            <div className="flex-1">
              <Label>{t("End time")}</Label>
              <div className="relative">
                <Clock size={13} color={purple} strokeWidth={2} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="time" style={{ ...inputStyle, paddingLeft: 34 }} value={form.endTime} onChange={e => set("endTime", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#160a2e", marginBottom: 10 }}>{t("Venue type")}</p>
        <div className="flex gap-3">
          {([
            { id: "indoor", Icon: Home, label: "Indoor" },
            { id: "outdoor", Icon: Sun, label: "Outdoor" },
            { id: "both", Icon: Globe, label: "Both" },
          ] as const).map(({ id, Icon, label }) => (
            <motion.button
              key={id}
              onClick={() => set("venue", id)}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
              style={{ background: form.venue === id ? lightPurple : "#fff", border: `1.5px solid ${form.venue === id ? purple : "rgba(107,33,217,0.1)"}`, boxShadow: "0 2px 8px rgba(107,33,217,0.06)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={20} color={form.venue === id ? purple : "#7c6fa0"} strokeWidth={1.8} />
              <p style={{ fontSize: 12.5, fontWeight: 700, color: form.venue === id ? purple : "#4a3a6e" }}>{t(label)}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <Card>
        <Toggle value={form.parkingAvailable} onChange={v => set("parkingAvailable", v)}
          label={t("Parking available")} desc="Street or private parking nearby" />
        <Toggle value={form.publicTransport} onChange={v => set("publicTransport", v)}
          label={t("Public transport access")} desc="Easy to reach by bus/tram/metro" />
      </Card>
    </div>
  );
}

const people = (f: FormData) => f.maxGuests + 1;

function Step5({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const [reading, setReading] = useState<number | null>(null);
  const [readError, setReadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const n = people(form);
  const estimate = estimateGroceries({ cuisine: form.cuisineType, people: n, appetizers: !!form.appetizers.trim(), dessert: !!form.desserts.trim(), drinks: form.drinksIncluded });
  const share = shareOf(form.groceryCost, n);
  const cap = form.costSource ? priceCap(form.groceryCost, n, form.costSource) : 0;
  const covered = form.pricePerGuest * form.maxGuests;
  const yourShare = Math.max(0, Math.round((form.groceryCost - covered) * 100) / 100);

  // Whenever the cost changes, start from the fair share and never above the cap
  const applyCost = (total: number, source: CostSource) => {
    set("groceryCost", total);
    set("costSource", source);
    set("pricePerGuest", Math.min(shareOf(total, n), priceCap(total, n, source)));
  };
  useEffect(() => {
    if (form.costSource === "estimate" && estimate.total !== form.groceryCost) applyCost(estimate.total, "estimate");
    if (form.costSource && form.pricePerGuest > cap) set("pricePerGuest", cap);
  }, [estimate.total, form.maxGuests]); // eslint-disable-line react-hooks/exhaustive-deps

  const scan = async (image: File | string) => {
    setReadError(""); setReading(0);
    try {
      const preview = typeof image === "string" ? image : await resizeImage(image, 500);
      set("receiptPreview", preview);
      const input = typeof image === "string" ? image : await resizeImage(image, 1600);
      const res = await readReceipt(input, (p) => setReading(p));
      if (res.total) { applyCost(Math.round(res.total * 100) / 100, "receipt"); set("receiptItems", res.items); }
      else { set("costSource", "receipt"); setReadError(t("We couldn't find the total — type it in below.")); }
    } catch {
      set("costSource", "receipt");
      setReadError(t("Couldn't read the receipt (no connection?). Type the total in below."));
    } finally {
      setReading(null);
    }
  };

  const Stepper = ({ value, onChange, min, max, big }: { value: number; onChange: (v: number) => void; min: number; max: number; big?: boolean }) => (
    <div className="flex items-center gap-2">
      <motion.button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t("Less")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: lightPurple, opacity: value <= min ? 0.4 : 1 }} whileTap={{ scale: 0.85 }}>
        <Minus size={16} color={purple} strokeWidth={2.5} />
      </motion.button>
      <motion.span key={value} initial={{ scale: 1.15, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: big ? 40 : 30, fontWeight: 900, color: "#160a2e", minWidth: 80, textAlign: "center" }}>
        €{value}
      </motion.span>
      <motion.button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t("More")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: purple, opacity: value >= max ? 0.4 : 1 }} whileTap={{ scale: 0.85 }}>
        <Plus size={16} color="#fff" strokeWidth={2.5} />
      </motion.button>
    </div>
  );

  const Option = ({ id, Icon, title, sub }: { id: CostSource; Icon: React.ElementType; title: string; sub: string }) => {
    const on = form.costSource === id;
    return (
      <motion.button
        onClick={() => (id === "estimate" ? applyCost(estimate.total, "estimate") : (set("costSource", "receipt"), !form.receiptPreview && fileRef.current?.click()))}
        className="flex-1 text-left p-4 rounded-2xl"
        style={{ background: on ? lightPurple : "#fff", border: `2px solid ${on ? purple : "rgba(107,33,217,0.12)"}` }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: on ? "#fff" : lightPurple, color: purple }}><Icon size={20} strokeWidth={2} /></span>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: "#160a2e", marginTop: 6 }}>{t(title)}</p>
        <p style={{ fontSize: 12, color: "#7c6fa0", marginTop: 2, lineHeight: 1.4 }}>{t(sub)}</p>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Split the cost")}</SectionTitle>
      <p style={{ fontSize: 13.5, color: "#4a3a6e", lineHeight: 1.55, marginTop: -6 }}>{t("On Bite you don't sell food — you share it. Guests chip in for the real cost of the ingredients, like BlaBlaCar for dinner.")}</p>

      <Card>
        <Toggle value={form.freeEvent} onChange={v => set("freeEvent", v)}
          label={t("It's on me")} desc="Free meal — guests don't contribute" />
      </Card>

      {!form.freeEvent && (
        <>
          <div>
            <Label>{t("How should guests see the cost?")}</Label>
            <div className="flex gap-3">
              <Option id="receipt" Icon={Receipt} title={t("Scan your receipt")} sub="Most transparent — guests see “receipt-backed”" />
              <Option id="estimate" Icon={Sparkles} title={t("Let Bite estimate")} sub="From your menu and the number of people" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) scan(f); e.target.value = ""; }} />

          {form.costSource === "receipt" && (
            <Card>
              <div className="flex items-start gap-3">
                {form.receiptPreview ? (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={form.receiptPreview} alt={t("Your receipt")} style={{ width: 74, height: 96, objectFit: "cover", objectPosition: "top", borderRadius: 10, border: "1px solid rgba(107,33,217,0.15)", display: "block" }} />
                    {reading !== null && (
                      <div className="hf-scan"><ThinkingOrb state="searching" size={64} theme="dark" /></div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{ width: 74, height: 96, borderRadius: 10, background: "#f5f4f9", border: `2px dashed ${purple}`, flexShrink: 0, color: purple }}><Receipt size={28} strokeWidth={1.8} /></div>
                )}
                <div className="flex-1 min-w-0">
                  {reading !== null ? (
                    <>
                      <p className="hf-shimmer" style={{ fontSize: 14, fontWeight: 800 }}>{t("Reading your receipt…")}</p>
                      <div style={{ height: 6, background: lightPurple, borderRadius: 6, marginTop: 10, overflow: "hidden" }}>
                        <motion.div style={{ height: "100%", background: `linear-gradient(90deg, ${purple}, #9b4aff)` }} animate={{ width: `${Math.max(8, reading * 100)}%` }} />
                      </div>
                      <p style={{ fontSize: 12, color: "#7c6fa0", marginTop: 6 }}>{t("Looking for “SUMME” on the Kassenbon")}</p>
                    </>
                  ) : (
                    <>
                      {form.receiptPreview && !readError && form.groceryCost > 0 && (
                        <p style={{ fontSize: 13.5, color: "#0a7c4e", fontWeight: 800 }}>{t("✓ Found {price} on your receipt", { price: euro(form.groceryCost) })}</p>
                      )}
                      {readError && <p style={{ fontSize: 13, color: "#c05e00", fontWeight: 700 }}>{readError}</p>}
                      <label className="block mt-2">
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#7c6fa0" }}>{t("Total paid (check it matches)")}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ fontSize: 18, fontWeight: 900, color: purple }}>€</span>
                          <input type="number" inputMode="decimal" min={1} max={500} step="0.01" value={form.groceryCost || ""} onChange={e => { const v = Number(e.target.value); if (v >= 0) applyCost(v, "receipt"); }} style={{ ...inputStyle, width: 120, padding: "8px 12px", fontSize: 16, fontWeight: 800 }} />
                        </div>
                      </label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        <button onClick={() => fileRef.current?.click()} style={{ fontSize: 12.5, fontWeight: 800, color: purple }}>{form.receiptPreview ? t("Scan another") : t("Take a photo")}</button>
                        <button onClick={() => scan("app/sample-receipt.jpg")} style={{ fontSize: 12.5, fontWeight: 700, color: "#7c6fa0" }}>{t("Try a sample receipt")}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#7c6fa0", marginTop: 12, lineHeight: 1.5 }}>{t("Only the total is shared with guests. The photo stays on your device.")}</p>
            </Card>
          )}

          {form.costSource === "estimate" && (
            <Card>
              <Label>{t("Bite's estimate for")}{" "}{n}{" "}{t("people")}</Label>
              <div className="flex flex-col gap-1.5">
                {estimate.lines.map(l => (
                  <div key={l.label} className="flex justify-between" style={{ fontSize: 13, color: "#4a3a6e" }}>
                    <span>{l.label} · {euro(l.perPortion)} × {n}</span><b>{euro(l.amount)}</b>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-1" style={{ borderTop: "1px dashed rgba(107,33,217,0.2)", fontSize: 14.5, fontWeight: 900, color: "#160a2e" }}>
                  <span>{t("Estimated groceries")}</span><span>€{estimate.total}</span>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#7c6fa0", marginTop: 10, lineHeight: 1.5 }}>{t("Based on typical German supermarket prices. Got the receipt? Scan it for the exact amount.")}</p>
            </Card>
          )}

          {form.costSource && form.groceryCost > 0 && (
            <>
              <Card>
                <Label>{t("Contribution per guest")}</Label>
                <Stepper value={form.pricePerGuest} onChange={v => set("pricePerGuest", v)} min={1} max={cap} big />
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full" style={{ background: "#e5f7f0", fontSize: 12, fontWeight: 800, color: "#0a7c4e" }}>{t("Fair share {price}", { price: euro(share) })}</span>
                  <span className="px-2.5 py-1 rounded-full" style={{ background: "#fff0f3", fontSize: 12, fontWeight: 800, color: "#e9345a" }}>{t("Price cap {price}", { price: euro(cap) })}</span>
                </div>
                <p style={{ fontSize: 12, color: "#7c6fa0", marginTop: 8, lineHeight: 1.5 }}>{form.costSource === "receipt" ? t("Like BlaBlaCar, Bite caps the price so nobody makes a profit: at most the real cost per person (+5% for rounding).") : t("Like BlaBlaCar, Bite caps the price so nobody makes a profit: at most the real cost per person (+15% because it's an estimate).")}</p>
              </Card>

              <div style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)", borderRadius: 20, padding: "18px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{t("Cost-sharing preview")}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 4 }}>{yourShare === 0 ? t("Your dinner is covered") : t("You pay {price}", { price: euro(Math.round(yourShare * 100) / 100) })}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{t("instead of {price} for the whole table, with a full table of {n}", { price: euro(form.groceryCost), n: form.maxGuests })}</p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 14, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: form.costSource === "receipt" ? t("Groceries (receipt)") : t("Groceries (estimate)"), val: euro(form.groceryCost) },
                    { label: t("Guests chip in ({n} × {price})", { n: form.maxGuests, price: euro(form.pricePerGuest) }), val: `−${euro(covered)}` },
                    { label: t("Each guest pays"), val: t("{price} + 12% service fee", { price: euro(form.pricePerGuest) }), bold: true },
                  ].map(({ label, val, bold }) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span style={{ fontSize: 12.5, color: bold ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: bold ? 700 : 400 }}>{label}</span>
                      <span style={{ fontSize: 12.5, color: "#fff", fontWeight: bold ? 800 : 500, whiteSpace: "nowrap" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Step6({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("House rules")}</SectionTitle>
      <p style={{ fontSize: 13, color: "#7c6fa0", marginTop: -8 }}>{t("Let guests know what to expect in your home")}</p>

      <Card>
        <Toggle value={form.smokingAllowed} onChange={v => set("smokingAllowed", v)}
          label={t("Smoking allowed")} desc="Inside or on the balcony" />
        <Toggle value={form.alcoholAllowed} onChange={v => set("alcoholAllowed", v)}
          label={t("Alcohol allowed")} desc="Guests can bring or consume alcohol" />
        <Toggle value={form.petsPresent} onChange={v => set("petsPresent", v)}
          label={t("Pets in the home")} desc="Dogs, cats, or other animals" />
        <Toggle value={form.shoesOff} onChange={v => set("shoesOff", v)}
          label={t("Shoes-off policy")} desc="Please remove shoes at the entrance" />
      </Card>

      {/* Visual rule icons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { Icon: Cigarette, label: "Smoking", active: form.smokingAllowed, color: "#7c6fa0" },
          { Icon: Wine, label: "Alcohol", active: form.alcoholAllowed, color: "#7c3fa0" },
          { Icon: PawPrint, label: "Pets", active: form.petsPresent, color: "#c05e00" },
          { Icon: Footprints, label: "Shoes off", active: form.shoesOff, color: "#0a5fa0" },
        ].map(({ Icon, label, active, color }) => (
          <div key={label} className="flex flex-col items-center py-3 rounded-2xl gap-1.5"
            style={{ background: active ? lightPurple : "#f5f4f9" }}>
            <Icon size={18} color={active ? purple : "#c4b8de"} strokeWidth={1.8} />
            <span style={{ fontSize: 10, fontWeight: 700, color: active ? purple : "#c4b8de", textAlign: "center", lineHeight: 1.3 }}>{t(label)}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: active ? "#0a7c4e" : "#e9345a" }}>{active ? t("✓ Yes") : "✗ No"}</span>
          </div>
        ))}
      </div>

      <Card>
        <Label>{t("Additional house rules")}</Label>
        <textarea
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
          rows={4}
          placeholder={t("e.g. Please be respectful of noise levels after 22:00. No food waste in the recycling bin…")}
          value={form.houseRules}
          onChange={e => set("houseRules", e.target.value)}
        />
      </Card>
    </div>
  );
}

function Step7({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  const { photos, coverIdx } = form;
  const setPhotos = (fn: (p: string[]) => string[]) => set("photos", fn(photos));
  const setCoverIdx = (i: number) => set("coverIdx", i);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhoto = (url: string) => {
    if (photos.includes(url)) { setPhotos(p => p.filter(x => x !== url)); if (coverIdx >= photos.length - 1) setCoverIdx(0); return; }
    setPhotos(p => [...p, url]);
  };
  const removePhoto = (i: number) => { setPhotos(p => p.filter((_, j) => j !== i)); if (coverIdx >= photos.length - 1) setCoverIdx(0); };
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all([...files].filter(f => f.type.startsWith("image/")).slice(0, 6).map(f => resizeImage(f)));
      set("photos", [...photos, ...urls]);
    } finally { setUploading(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Add photos")}</SectionTitle>

      {/* Cover photo */}
      <div>
        <Label>{t("Cover image")}</Label>
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
          {photos[coverIdx] ? (
            <img src={photos[coverIdx]} alt={t("cover")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: "#f0ecfa", border: `2px dashed ${purple}` }}>
              <ImageIcon size={28} color={purple} strokeWidth={1.5} />
              <p style={{ fontSize: 13, color: purple, fontWeight: 600 }}>{t("No cover photo yet")}</p>
            </div>
          )}
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(22,10,46,0.6)", borderRadius: 8, padding: "4px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{t("Cover")}</span>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ""; }} />
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 cursor-pointer"
        style={{ background: dragging ? lightPurple : "#f5f4f9", border: `2px dashed ${dragging ? purple : "rgba(107,33,217,0.2)"}` }}
        animate={{ scale: dragging ? 1.02 : 1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      >
        <div style={{ width: 44, height: 44, background: lightPurple, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={20} color={purple} strokeWidth={1.8} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#160a2e" }}>{uploading ? t("Adding photos…") : t("Drag & drop photos here")}</p>
          <p style={{ fontSize: 12, color: "#7c6fa0", marginTop: 2 }}>{t("or click to upload from your device")}</p>
        </div>
        <div className="flex gap-2">
          <span style={{ fontSize: 11, color: "#c4b8de" }}>{t("JPG · PNG · WEBP · Max 10MB")}</span>
        </div>
      </motion.div>

      {/* Sample photos to add */}
      <div>
        <Label>{t("Add from suggestions")}</Label>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {MOCK_PHOTOS.map((url, i) => {
            const added = photos.includes(url);
            return (
              <motion.button
                key={url}
                onClick={() => addPhoto(url)}
                className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: 72, height: 72 }}
                whileTap={{ scale: 0.92 }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <AnimatePresence>
                  {added && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ position: "absolute", inset: 0, background: "rgba(107,33,217,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <CheckCircle size={22} color="#fff" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t("Your gallery (")}{photos.length})</Label>
            <span style={{ fontSize: 11, color: "#7c6fa0" }}>{t("Tap star to set cover")}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <motion.div
                key={url}
                className="relative rounded-xl overflow-hidden"
                style={{ height: 80 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {i === coverIdx && (
                  <div style={{ position: "absolute", top: 4, left: 4, background: purple, borderRadius: 6, padding: "2px 6px" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{t("COVER")}</span>
                  </div>
                )}
                <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3 }}>
                  <motion.button
                    onClick={() => setCoverIdx(i)}
                    style={{ width: 22, height: 22, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    whileTap={{ scale: 0.8 }}
                  >
                    <Star size={11} fill={i === coverIdx ? "#f59e0b" : "none"} color={i === coverIdx ? "#f59e0b" : "#7c6fa0"} strokeWidth={2} />
                  </motion.button>
                  <motion.button
                    onClick={() => removePhoto(i)}
                    style={{ width: 22, height: 22, background: "rgba(233,52,90,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    whileTap={{ scale: 0.8 }}
                  >
                    <span style={{ fontSize: 14, color: "#fff", lineHeight: 1, marginTop: -1 }}>×</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step8({ form, onPublish, publishing }: { form: FormData; onPublish: () => void; publishing: boolean }) {
  const { profile } = useStore();
  const covered = form.pricePerGuest * form.maxGuests;
  // The preview card draws itself like the assistant is assembling the listing, once, when the step opens
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let run: { cancel: () => void } | null = null;
    let gone = false;
    const img = el.querySelector("img");
    Promise.all([document.fonts.ready, img && !img.complete ? img.decode().catch(() => {}) : null]).then(() => {
      if (gone) return;
      run = generate(el, {
        mode: "skeleton-texts",
        duration: 2200,
        delay: 380, // let the step finish sliding in first
        steps: [t("Reading your answers"), t("Laying out the card"), t("Adding the photo"), t("Setting the price")],
        done: t("Your listing is ready"),
      });
    });
    return () => { gone = true; run?.cancel(); };
  }, []);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(107,33,217,0.06)" }}>
      <span style={{ fontSize: 12.5, color: "#7c6fa0" }}>{t(label)}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#160a2e", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{t("Review your event")}</SectionTitle>

      {/* Event preview card */}
      <div ref={cardRef} style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(107,33,217,0.12)" }}>
        <img
          src={form.photos[form.coverIdx] ?? MOCK_PHOTOS[0]}
          alt={t("cover")}
          style={{ width: "100%", height: 130, objectFit: "cover" }}
        />
        <div style={{ background: "#fff", padding: "16px" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#160a2e" }}>{form.eventTitle || t("Your Event")}</p>
              <p style={{ fontSize: 13, color: "#7c6fa0", marginTop: 2 }}>{form.mealName || t("Your meal")} · {form.cuisineType ? t(form.cuisineType) : t("Cuisine TBD")}</p>
            </div>
            <div style={{ background: purple, borderRadius: 10, padding: "4px 10px", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{euro(form.freeEvent ? 0 : form.pricePerGuest)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <MapPin size={11} color="#7c6fa0" strokeWidth={2} />
              <span style={{ fontSize: 11, color: "#7c6fa0" }}>{form.city || t("City")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} color="#7c6fa0" strokeWidth={2} />
              <span style={{ fontSize: 11, color: "#7c6fa0" }}>{form.date ? dateLabel(labelForISO(form.date)) : t("Date TBD")} · {form.startTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Host profile summary */}
      <Card>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", marginBottom: 12 }}>{t("Your hosting profile")}</p>
        <div className="flex items-center gap-3">
          <Avatar size={44} fontSize={18} />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{profile.name}</span>
              <BadgeCheck size={13} color="#0a7c4e" strokeWidth={2} />
            </div>
            <span style={{ fontSize: 11.5, color: "#7c6fa0" }}>{t("Verified · {place}", { place: localPlace(profile.neighbourhood) })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#160a2e" }}>{dec(4.9)}</span>
          </div>
        </div>
      </Card>

      {/* Details summary */}
      <Card>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", marginBottom: 4 }}>{t("Event details")}</p>
        <Row label={t("Guests")} value={t("{min}–{max} people", { min: form.minGuests, max: form.maxGuests })} />
        <Row label={t("Location")} value={`${form.address ? form.address + ", " : ""}${form.city}`} />
        <Row label={t("Schedule")} value={`${form.startTime} – ${form.endTime}`} />
        <Row label={t("Venue")} value={t(form.venue.charAt(0).toUpperCase() + form.venue.slice(1))} />
        <Row label={t("Type")} value={form.privateEvent ? t("Private event") : t("Open event")} />
      </Card>

      {/* Pricing summary */}
      {!form.freeEvent && (
        <Card>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", marginBottom: 4 }}>{t("Cost sharing")}</p>
          <Row label={t("Groceries")} value={`${euro(form.groceryCost)} · ${form.costSource === "receipt" ? t("receipt") : t("estimate")}`} />
          <Row label={t("Contribution per guest")} value={euro(form.pricePerGuest)} />
          <Row label={t("Price cap per guest")} value={form.costSource ? euro(priceCap(form.groceryCost, form.maxGuests + 1, form.costSource)) : "—"} />
          <Row label={t("Your share")} value={euro(Math.round(Math.max(0, form.groceryCost - covered) * 100) / 100)} />
        </Card>
      )}

      {/* Safety trust */}
      <div className="px-1 pb-1">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={14} color="#0a7c4e" strokeWidth={2} />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0a7c4e" }}>{t("Your listing is protected by Bite's Host Guarantee")}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {[t("Identity verified"), t("Secure payments"), t("24/7 support")].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle size={12} color="#0a7c4e" strokeWidth={2.5} />
              <span style={{ fontSize: 12, color: "#4a3a6e" }}>{t(item)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Publish button (inline duplicate for review step) */}
      <motion.button
        onClick={onPublish}
        disabled={publishing}
        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", pointerEvents: "none" }}
          animate={{ x: [-400, 400] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        <Flame size={18} color="#fff" strokeWidth={2} />
        {publishing && <ThinkingOrb state="shaping" size={20} theme="dark" />}
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{publishing ? t("Publishing…") : t("Publish event")}</span>
      </motion.button>
      <p style={{ textAlign: "center", fontSize: 11, color: "#7c6fa0" }}>{t("You can edit or unpublish at any time after going live")}</p>
    </div>
  );
}

/* ── Main export ── */

export function StartHostingFlow({ onBack, onPublished }: StartHostingFlowProps) {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>(() => {
    // the "+" menu on Home can pre-pick the type of event
    try {
      const preset = sessionStorage.getItem("bite_host_service");
      sessionStorage.removeItem("bite_host_service");
      if (preset === "pickup" || preset === "eat-together" || preset === "cook-together") return { ...INITIAL, serviceType: preset };
    } catch { /* ignore */ }
    return INITIAL;
  });
  const [savedDraft, setSavedDraft] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore a saved draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      setForm({ ...INITIAL, ...d.form, dietary: new Set(d.form.dietary ?? []), allergens: new Set(d.form.allergens ?? []) });
      setStep(Math.min(d.step ?? 0, TOTAL_STEPS - 1));
      store.showToast(t("Draft restored — pick up where you left off"));
    } catch { /* ignore broken drafts */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [step]);

  const set = (k: keyof FormData, v: any) => { setError(""); setForm(f => ({ ...f, [k]: v })); };

  const goNext = () => {
    const err = stepError(step, form);
    if (err) { setError(err); return; }
    if (step < TOTAL_STEPS - 1) { setDirection(1); setStep(s => s + 1); }
  };
  const goPrev = () => {
    setError("");
    if (step === 0) { onBack(); return; }
    setDirection(-1); setStep(s => s - 1);
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form: { ...form, dietary: [...form.dietary], allergens: [...form.allergens] } }));
      setSavedDraft(true);
      store.showToast(t("Draft saved"));
    } catch {
      store.showToast(t("Couldn't save the draft — try fewer photos"));
    }
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const publish = () => {
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const err = stepError(i, form);
      if (err) { setDirection(-1); setStep(i); setError(err); return; }
    }
    setPublishing(true);
    const name = store.profile.name;
    const meal: Omit<Meal, "id"> = {
      title: form.mealName.trim() || form.eventTitle.trim(),
      host: name,
      hostAvatar: store.profile.photo || initialAvatar(name),
      rating: 5,
      reviews: 0,
      price: form.freeEvent ? 0 : form.pricePerGuest,
      seats: form.maxGuests,
      serviceType: form.serviceType,
      image: form.photos[form.coverIdx] ?? form.photos[0],
      gallery: form.photos.filter((_, i) => i !== form.coverIdx),
      costProof: form.freeEvent || !form.costSource ? undefined : { kind: form.costSource, total: form.groceryCost, people: form.maxGuests + 1 },
      tags: [form.cuisineType, ...[...form.dietary].map(d => DIET_TO_TAG[d]).filter(Boolean)],
      location: `${form.address.trim()}, ${form.city.trim()}`,
      time: form.startTime,
      date: labelForISO(form.date),
      description: form.description.trim() || t("{title}. On the menu: {menu}.", { title: form.eventTitle.trim(), menu: [form.appetizers, form.mainDishes, form.desserts].filter(x => x.trim()).join(" · ") }),
      hostBio: store.profile.bio,
      ingredients: form.serviceType === "cook-together" ? form.mainDishes.split(/[,\n]/).map(x => x.trim()).filter(Boolean) : undefined,
      ownedByMe: true,
    };
    setTimeout(() => {
      const created = store.publish(meal);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      store.showToast(t("Your meal is live — neighbours can book it now"));
      onPublished(created);
    }, 900);
  };

  const StepIcon = STEP_ICONS[step];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      <div className="md:hidden" style={{ height: "max(env(safe-area-inset-top), 14px)", background: "#fff", flexShrink: 0 }} />

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(107,33,217,0.08)", flexShrink: 0 }}>
        <div className="flex items-center justify-between px-4 pt-2 pb-3">
          <motion.button
            onClick={goPrev}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: "#f0ecfa" }}
            whileTap={{ scale: 0.88 }}
          >
            <ChevronLeft size={18} color={purple} strokeWidth={2.5} />
          </motion.button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <StepIcon size={13} color={purple} strokeWidth={2.5} />
              <p style={{ fontSize: 14, fontWeight: 800, color: "#160a2e" }}>{t(STEP_LABELS[step])}</p>
            </div>
            <p style={{ fontSize: 11, color: "#7c6fa0", fontWeight: 500 }}>{t("Step {n} of {total}", { n: step + 1, total: TOTAL_STEPS })}</p>
          </div>

          <motion.button
            onClick={saveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: savedDraft ? "#e5f7f0" : "#f0ecfa" }}
            whileTap={{ scale: 0.88 }}
            animate={{ background: savedDraft ? "#e5f7f0" : "#f0ecfa" }}
          >
            <Save size={13} color={savedDraft ? "#0a7c4e" : purple} strokeWidth={2} />
            <span style={{ fontSize: 11, fontWeight: 700, color: savedDraft ? "#0a7c4e" : purple }}>{savedDraft ? t("Saved!") : t("Draft")}</span>
          </motion.button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#f0ecfa", position: "relative" }}>
          <motion.div
            style={{ position: "absolute", top: 0, left: 0, height: "100%", background: `linear-gradient(90deg, ${purple}, #9b4aff)`, borderRadius: "0 2px 2px 0" }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-2.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === step ? 20 : 6,
                background: i < step ? purple : i === step ? purple : "#e0d8f5",
                opacity: i > step ? 0.4 : 1,
              }}
              style={{ height: 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          ))}
        </div>
      </div>

      {/* Scrollable step content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            style={{ padding: "20px 16px", paddingBottom: 40 }}
          >
            {step === 0 && <Step1 form={form} set={set} />}
            {step === 1 && <Step2 form={form} set={set} />}
            {step === 2 && <Step3 form={form} set={set} />}
            {step === 3 && <Step4 form={form} set={set} />}
            {step === 4 && <Step5 form={form} set={set} />}
            {step === 5 && <Step6 form={form} set={set} />}
            {step === 6 && <Step7 form={form} set={set} />}
            {step === 7 && <Step8 form={form} onPublish={publish} publishing={publishing} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {error && (
          <motion.div role="alert" className="mx-4 mb-2 px-4 py-3 rounded-2xl flex items-center gap-2 flex-shrink-0" style={{ background: "#fff0f3", border: "1px solid rgba(233,52,90,0.25)" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertCircle size={16} color="#e9345a" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#c0234a" }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA bar */}
      {step < TOTAL_STEPS - 1 && (
        <div
          className="px-4 pt-3 flex-shrink-0"
          style={{ background: "#fff", borderTop: "1px solid rgba(107,33,217,0.07)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
        >
          <motion.button
            onClick={goNext}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${purple}, #9b4aff)` }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", pointerEvents: "none" }}
              animate={{ x: [-400, 400] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
              {step === TOTAL_STEPS - 2 ? t("Review event →") : t("Continue")}
            </span>
            <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
