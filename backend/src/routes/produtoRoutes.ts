import { Router } from 'express';
import { ProdutoController } from '../controllers/produtoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PROTEGIDAS ---
// Cadastrar novo produto
router.post('/cadastrar', authMiddleware, ProdutoController.criar);

// Cadastrar múltiplos produtos em lote
router.post('/cadastrar-lote', authMiddleware, ProdutoController.criarLote);

// Listar todos os produtos
router.get('/', authMiddleware, ProdutoController.listar);

// Listar produtos por categoria
router.get('/categoria/:categoria_id', authMiddleware, ProdutoController.listarPorCategoria);

// Listar produtos por usuário
router.get('/usuario/:usuario_id', authMiddleware, ProdutoController.listarPorUsuario);

// Listar produtos por usuário e categoria
router.get('/usuario/:usuario_id/categoria/:categoria_id', authMiddleware, ProdutoController.listarPorUsuarioECategoria);

// Obter produto por ID
router.get('/:id', authMiddleware, ProdutoController.obterPorId);

// Atualizar produto
router.put('/:id', authMiddleware, ProdutoController.atualizar);

// Deletar produto
router.delete('/excluir/:id', authMiddleware, ProdutoController.deletar);

export default router;
