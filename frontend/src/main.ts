import { mount } from "svelte";

import "./app.css";
import App from "./App.svelte";
import { startRouter, stopRouter } from "@/common/router/router.svelte";

const mountTarget: HTMLElement | null = document.getElementById("app");
if (mountTarget === null) {
  throw new Error("The application mount point was not found.");
}

// The router must listen to hash changes and apply the initial location before
// the first render, otherwise the guard would run with an empty route.
startRouter();

const app = mount(App, {
  target: mountTarget,
});

// Drop the hash listener before a hot update replaces this module, otherwise
// every update would add one more listener.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopRouter();
  });
}

export default app;
