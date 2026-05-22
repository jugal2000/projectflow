import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Test configuration — tells Vite how to run our tests
  test: {
    globals: true,          // Can use describe/it/expect without importing them
    environment: 'jsdom',   // Simulates a browser environment for tests
    setupFiles: ['./src/test/setup.ts'], // Runs this file before every test
  },

  // Server configuration for development
  server: {
    port: 5173,   // The port our React app runs on
    host: true,   // Allow connections from other devices on the network
  },
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   test: {
//     globals: true,
//     environment: 'jsdom',
//     setupFiles: ['./src/test/setup.ts'],
//   },
// })