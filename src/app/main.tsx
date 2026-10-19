import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "../lib/ui-generation.css";

createRoot(document.getElementById("root")!).render(<App />);
