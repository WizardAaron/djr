import { resolve } from "path";
import { defineConfig } from "vite";
//maybe comment out line beneath this one
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  root: "src/",
//Maybe Comment out from here
  plugins: [basicSsl()],

  server: {
    https: true,
    port: 5173,
  },
// to here

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        musicExplorer: resolve(__dirname, "src/djr_music_explorer/index.html"),
        audioPlayground: resolve(__dirname, "src/djr_audio_playground/index.html"),
        contact: resolve(__dirname, "src/djr-contact-us/index.html"),
      },
    },
  },
});