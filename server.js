import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ES Modules (já que package.json usa "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta de build (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Roteamento SPA: Qualquer rota não reconhecida retorna o index.html
// Isso permite que o React Router gerencie a navegação no frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FUT-DOMINATION Web Service rodando na porta ${PORT}`);
});