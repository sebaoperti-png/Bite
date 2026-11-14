import { useEffect, useState } from "react";

/** true on phones (≤640px wide); follows rotation and window resizes */
export function usePhone() {
  const q = "(max-width: 640px)";
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setPhone(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return phone;
}
