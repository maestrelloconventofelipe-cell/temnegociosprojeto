require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const tenantsRoutes   = require('./routes/tenants.routes');
const usuariosRoutes  = require('./routes/usuarios.routes');
const imoveisRoutes = require('./routes/imoveis.routes');
const clientesRoutes = require('./routes/clientes.routes');
const propostasRoutes = require('./routes/propostas.routes');
const corretoresRoutes = require('./routes/corretores.routes');
const contratosRoutes  = require('./routes/contratos.routes');
const financeiroRoutes = require('./routes/financeiro.routes');
const agendaRoutes     = require('./routes/agenda.routes');
const comissoesRoutes  = require('./routes/comissoes.routes');
const relatoriosRoutes    = require('./routes/relatorios.routes');
const configuracoesRoutes = require('./routes/configuracoes.routes');
const royaltiesRoutes     = require('./routes/royalties.routes');
const temporadasRoutes    = require('./routes/temporadas.routes');
const vistoriasRoutes     = require('./routes/vistorias.routes');
const tarefasRoutes       = require('./routes/tarefas.routes');
const arquivosRoutes      = require('./routes/arquivos.routes');
const documentosRoutes    = require('./routes/documentos.routes');
const ibgeRoutes           = require('./routes/ibge.routes')
const notificacoesRoutes   = require('./routes/notificacoes.routes');

const path = require('path')
const app = express();

// Segurança: cabeçalhos HTTP defensivos
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: false, // frontend separado (Vite), CSP gerenciado pelo próprio Vite
}));

// Segurança: limite de requisições para evitar brute force no login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // janela de 15 minutos
  max: 20,                   // máx. 20 tentativas por IP a cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

app.use('/api/v1/auth',      loginLimiter, authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/tenants',   tenantsRoutes);
app.use('/api/v1/usuarios',  usuariosRoutes);
app.use('/api/v1/imoveis', imoveisRoutes);
app.use('/api/v1/clientes', clientesRoutes);
app.use('/api/v1/propostas', propostasRoutes);
app.use('/api/v1/corretores', corretoresRoutes);
app.use('/api/v1/contratos',  contratosRoutes);
app.use('/api/v1/financeiro', financeiroRoutes);
app.use('/api/v1/agenda',     agendaRoutes);
app.use('/api/v1/comissoes',   comissoesRoutes);
app.use('/api/v1/relatorios',    relatoriosRoutes);
app.use('/api/v1/configuracoes', configuracoesRoutes);
app.use('/api/v1/royalties',    royaltiesRoutes);
app.use('/api/v1/temporadas',   temporadasRoutes);
app.use('/api/v1/vistorias',    vistoriasRoutes);
app.use('/api/v1/tarefas',      tarefasRoutes);
app.use('/api/v1/arquivos',     arquivosRoutes);
app.use('/api/v1/documentos',  documentosRoutes);
app.use('/api/v1/ibge',          ibgeRoutes);
app.use('/api/v1/notificacoes',  notificacoesRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
