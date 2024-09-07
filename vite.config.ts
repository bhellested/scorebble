import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss";
import mkcert from "vite-plugin-mkcert";


// https://vitejs.dev/config/
export default defineConfig({
  server: { https: true }, // Not needed for Vite 5+
  plugins: [react(),mkcert()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
