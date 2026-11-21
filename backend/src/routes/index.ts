import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import usuarioRoutes from './usuarioRoutes';
import categoriaRoutes from './categoriaRoutes';
import produtoRoutes from './produtoRoutes';
import vendaRoutes from './vendaRoutes';
import itemVendaRoutes from './itemVendaRoutes';
import dashboardRoutes from './dashboardRoutes';

const routes = Router();

// --- ROTAS PÚBLICAS ---
// Login de usuário (Autenticação)
routes.post('/api/login', AuthController.login);

// --- ROTAS DE AUTENTICAÇÃO PROTEGIDAS ---
routes.post('/api/logout', authMiddleware, AuthController.logout);
routes.post('/api/logoff', authMiddleware, AuthController.logout);

// --- ROTAS DE ENTIDADES ---
routes.use('/api/usuarios', usuarioRoutes);
routes.use('/api/categorias', categoriaRoutes);
routes.use('/api/produtos', produtoRoutes);
routes.use('/api/vendas', vendaRoutes);
routes.use('/api/itens-venda', itemVendaRoutes);
routes.use('/api/dashboard', dashboardRoutes);

export default routes;
