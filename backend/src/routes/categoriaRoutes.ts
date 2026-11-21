import { Router } from 'express';
import { CategoriaController } from '../controllers/categoriaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PROTEGIDAS ---
// Cadastrar nova categoria
router.post('/cadastrar', authMiddleware, CategoriaController.criar);

// Listar todas as categorias
router.get('/', authMiddleware, CategoriaController.listar);

// Obter categoria por ID
router.get('/:id', authMiddleware, CategoriaController.obterPorId);

// Atualizar categoria
router.put('/:id', authMiddleware, CategoriaController.atualizar);

// Deletar categoria
router.delete('/excluir/:id', authMiddleware, CategoriaController.deletar);

export default router;
