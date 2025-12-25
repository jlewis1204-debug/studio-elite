import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No se encontró #root en index.html");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
