import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  // Default to the provided connection string if not in .env
  const dbConnectionString = env.SQLITE_CONNECTION_STRING || "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/FUT_DOM.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    define: {
      // Vital for using process.env in the client-side code (Gemini/SQLite)
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.SQLITE_CONNECTION_STRING': JSON.stringify(dbConnectionString),
    },
    server: {
      host: true, // Needed for Docker/Render preview
      port: 5173
    }
  }
})