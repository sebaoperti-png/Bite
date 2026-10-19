// The user's avatar (their photo if they added one, otherwise their initial) and the photo picker behind it.
import { useRef } from "react";
import { useStore } from "../store";
import { squareAvatar } from "../image";
import { t } from "../../shared/i18n";

export function Avatar({ size = 32, fontSize, className = "", style }: { size?: number; fontSize?: number; className?: string; style?: React.CSSProperties }) {
  const { profile } = useStore();
  const base: React.CSSProperties = { width: size, height: size, borderRadius: "50%", flexShrink: 0, ...style };
  return profile.photo ? (
    <img src={profile.photo} alt="" className={className} style={{ ...base, objectFit: "cover", display: "block" }} />
  ) : (
    <span className={className} style={{ ...base, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6b21d9, #9b4aff)", color: "#fff", fontWeight: 800, fontSize: fontSize ?? Math.round(size * 0.4) }}>
      {profile.name.charAt(0).toUpperCase()}
    </span>
  );
}

/** A hidden file input + `open()` to choose a profile photo; the photo is cropped square and saved in the profile */
export function usePhotoPicker() {
  const store = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
          store.updateProfile({ photo: await squareAvatar(file) });
          store.showToast(t("Profile photo updated"));
        } catch {
          store.showToast(t("That photo couldn't be read — try another one"));
        }
      }}
    />
  );
  return { open: () => ref.current?.click(), input };
}
