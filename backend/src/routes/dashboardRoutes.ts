import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PROTEGIDAS DO DASHBOARD ---
router.get('/', authMiddleware, DashboardController.obterGeral);
router.get('/cards', authMiddleware, DashboardController.obterCards);

export default router;

