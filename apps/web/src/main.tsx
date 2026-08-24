import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";

const raiz = document.getElementById("app");
if (!raiz) throw new Error("elemento #app não encontrado");

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
