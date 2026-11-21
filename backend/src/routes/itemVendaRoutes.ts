import { Router } from 'express';
import { ItemVendaController } from '../controllers/itemVendaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PROTEGIDAS ---
// Adicionar um novo item a uma venda existente
router.post('/cadastrar', authMiddleware, ItemVendaController.criar);

// Listar todos os itens de uma venda específica
router.get('/venda/:vendas_id', authMiddleware, ItemVendaController.listarPorVenda);

// Atualizar um item específico (ex: alterar quantidade ou preço)
router.put('/:id', authMiddleware, ItemVendaController.atualizar);

// Deletar um item específico da venda
router.delete('/excluir/:id', authMiddleware, ItemVendaController.deletar);

export default router;