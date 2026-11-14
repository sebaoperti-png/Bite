import { createRoot } from "react-dom/client";
import { Feedback } from "./Feedback";
import "../shared/fonts.css";
import "./feedback.css";
import { startAnalytics } from "../shared/analytics";

createRoot(document.getElementById("root")!).render(<Feedback />);
startAnalytics();
