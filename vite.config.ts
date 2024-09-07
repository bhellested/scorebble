import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
//import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    //https: true,
    host: true,
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  plugins: [react() ],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
