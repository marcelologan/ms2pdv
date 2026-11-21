import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Configuração dinâmica de CORS para produção e desenvolvimento
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : [])
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (mobile apps, curl, postman, monitoramento interno)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pela política de CORS'));
    }
  },
  credentials: true
}));

app.use(express.json()); // Ensina o servidor a entender dados em formato JSON

// Rota de Health Check para monitoramento e orquestradores (Docker, Kubernetes)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Rota de Teste de Vida legada
app.get('/api/status', (_req, res) => {
  res.status(200).json({ mensagem: "Motor Back-end Kamikase operando com sucesso!" });
});

// Rotas da Aplicação
app.use(routes);

// Ignição do Motor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escutando na porta ${PORT}...`);
});
