import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const config = {
    root: "src/",
    build: {
      outDir: "../dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "src/index.html"),
          musicExplorer: resolve(__dirname, "src/djr_music_explorer/index.html"),
          audioPlayground: resolve(__dirname, "src/djr_audio_playground/index.html"),
          contact: resolve(__dirname, "src/djr-contact-us/index.html"),
          contactSuccess: resolve(__dirname, "src/djr-contact-us/success.html"),
        },
      },
    },
  };

  // Only use HTTPS in development mode
  if (command === 'serve') {
    config.server = {
      https: true,
      port: 5173,
    };
    
    // Only import and use basicSsl in development
    return import('@vitejs/plugin-basic-ssl').then(({ default: basicSsl }) => {
      config.plugins = [basicSsl()];
      return config;
    }).catch(() => {
      // If plugin not installed, just use regular http
      console.warn('basicSsl plugin not found, using http instead');
      config.server.https = false;
      return config;
    });
  }

  return config;
});