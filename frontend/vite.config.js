import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // O front chama /api/... e o Vite encaminha para o Spring Boot (porta 8080).
    proxy: { '/api': 'http://localhost:8080' },
  },
});