import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "./styles/dark.css";
import "../lib/ui-generation.css";
import { startAnalytics } from "../shared/analytics";

createRoot(document.getElementById("root")!).render(<App />);
startAnalytics();
