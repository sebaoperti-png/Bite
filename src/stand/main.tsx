import { createRoot } from "react-dom/client";
import { Survey } from "./Survey";
import { Results } from "./Results";
import { FeedbackDesk } from "./FeedbackDesk";
import "../shared/fonts.css";
import "../shared/motion.css";
import "../shared/restaurant.css";
import "./stand.css";

// stand.html          → survey (phones, from the QR code)
// stand.html?kiosk    → survey on the stand tablet: resets itself for the next visitor
// stand.html?screen   → the feedback desk (team only, needs the desk key): the "Rate Bite" answers
// stand.html?screen&survey → live survey results for a screen behind the stand
const screen = new URLSearchParams(window.location.search).has("screen");
const survey = new URLSearchParams(window.location.search).has("survey");
createRoot(document.getElementById("root")!).render(screen ? (survey ? <Results /> : <FeedbackDesk />) : <Survey />);
