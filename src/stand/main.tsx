import { createRoot } from "react-dom/client";
import { Survey } from "./Survey";
import { Results } from "./Results";
import "../shared/fonts.css";
import "./stand.css";

// stand.html          → survey (phones, from the QR code)
// stand.html?kiosk    → survey on the stand tablet: resets itself for the next visitor
// stand.html?screen   → live results for a screen behind the stand
const screen = new URLSearchParams(window.location.search).has("screen");
createRoot(document.getElementById("root")!).render(screen ? <Results /> : <Survey />);
