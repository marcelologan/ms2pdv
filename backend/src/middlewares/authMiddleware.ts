import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface customizada que estende a Request do Express para incluir os dados do usuário autenticado
export interface IAuthenticatedRequest extends Request {
  usuarioLogado?: {
    id: number;
    nome: string;
    email: string;
  };
}

export const authMiddleware = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Acesso negado. Token de autenticação não fornecido.' });
    return;
  }

  // Extrai o token do cabeçalho "Bearer <TOKEN>"
  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ erro: 'Erro interno de configuração: JWT_SECRET não definido no servidor.' });
      return;
    }
    
    // Valida e decodifica o token
    const decoded = jwt.verify(token, secret) as {
      id: number;
      nome: string;
      email: string;
    };

    // Anexa as informações decodificadas do usuário logado na requisição
    req.usuarioLogado = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token de autenticação inválido ou expirado.' });
  }
};
