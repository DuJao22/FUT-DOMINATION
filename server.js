import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from '@sqlitecloud/drivers';

// Configuração para ES Modules (já que package.json usa "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta de build (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// --- KEEPALIVE MECHANISM (PING) ---
// Mantém o banco de dados acordado fazendo uma query leve a cada 5 minutos
const connectionString = process.env.SQLITE_CONNECTION_STRING;

if (connectionString) {
    console.log("⏰ Iniciando sistema de Keep-Alive (Ping) no Banco de Dados...");
    
    // Create a dedicated connection for the server-side ping
    const db = new Database(connectionString);

    const runPing = async () => {
        try {
            // Simple query that consumes minimal resources but counts as activity
            await db.sql('SELECT 1');
            console.log(`[${new Date().toISOString()}] 💓 DB Ping: Sucesso (Keep-Alive)`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ⚠️ DB Ping Falhou:`, error.message);
        }
    };

    // Execute immediately on startup
    runPing();

    // Schedule for every 5 minutes (300,000 ms)
    setInterval(runPing, 5 * 60 * 1000);
} else {
    console.warn("⚠️ SQLITE_CONNECTION_STRING não encontrada. O sistema de Ping não foi iniciado.");
}

// Roteamento SPA: Qualquer rota não reconhecida retorna o index.html
// Isso permite que o React Router gerencie a navegação no frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FUT-DOMINATION Web Service rodando na porta ${PORT}`);
});