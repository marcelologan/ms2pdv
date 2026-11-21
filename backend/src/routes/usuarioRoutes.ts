import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PÚBLICAS ---
// Cadastro de novo usuário (Registro) - aceita tanto / como /cadastrar
router.post('/cadastrar', UsuarioController.criar);
router.post('/', UsuarioController.criar);

// --- ROTAS PROTEGIDAS ---
// Listar usuários (Necessita de token JWT)
router.get('/', UsuarioController.listar);

// Obter usuário por ID (Necessita de token JWT)
router.get('/:id', authMiddleware, UsuarioController.obterPorId);

// Atualizar usuário (Necessita de token JWT)
router.put('/:id', authMiddleware, UsuarioController.atualizar);

// Deletar usuário (Necessita de token JWT)
router.delete('/excluir/:id', authMiddleware, UsuarioController.deletar);

export default router;
