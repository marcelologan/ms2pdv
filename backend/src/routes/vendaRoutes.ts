import { Router } from 'express';
import { VendaController } from '../controllers/vendaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PROTEGIDAS ---
// Cadastrar nova venda (e seus itens na mesma transação)
router.post('/cadastrar', authMiddleware, VendaController.criar);

// Listar todas as vendas
router.get('/', authMiddleware, VendaController.listar);

// Obter detalhes de uma venda por ID (incluindo os itens vinculados a ela)
router.get('/:id', authMiddleware, VendaController.detalhar);

export default router;