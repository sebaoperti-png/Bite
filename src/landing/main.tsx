import { createRoot } from "react-dom/client";
import { Landing } from "./Landing";
import "../shared/fonts.css";
import "../shared/motion.css";
import "../shared/restaurant.css";
import "../lib/ui-generation.css";
import "./landing.css";
import { startAnalytics } from "../shared/analytics";

createRoot(document.getElementById("root")!).render(<Landing />);
startAnalytics();
