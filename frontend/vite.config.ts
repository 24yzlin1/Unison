import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment: Record<string, string> = loadEnv(mode, process.cwd(), "");
  // The development proxy is the only place that needs to know where the
  // backend listens. Browsers always call /api on the page origin, so a single
  // instance works without any CORS setup.
  const backendUrl: string =
    environment["UNISON_BACKEND_URL"] ??
    process.env["UNISON_BACKEND_URL"] ??
    "http://127.0.0.1:3000";

  return {
    plugins: [tailwindcss(), svelte()],
    resolve: {
      // Resolve aliases from this file, not from the shell working directory,
      // so the same configuration works from any directory.
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Stream the server-sent events without buffering.
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
