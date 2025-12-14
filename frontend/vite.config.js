import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
    test: {
    globals: true,
    environment: 'jsdom', // ✅ important for React Testing Library
    setupFiles: './src/setupTests', // ✅ this will load before every test
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
