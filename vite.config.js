import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // permite acesso externo
    port: 5173, // pode ajustar se quiser
    strictPort: true,
    cors: true,
    hmr: {
      protocol: "wss", // usa WebSocket seguro para HMR via ngrok
      host: "5f49f21df0ed.ngrok-free.app", // seu domínio ngrok
    },
  },
});
