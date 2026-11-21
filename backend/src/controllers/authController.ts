import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuarioModel';

export class AuthController {
  // POST /login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        res.status(400).json({ erro: 'Os campos email e senha são obrigatórios' });
        return;
      }

      // Buscar usuário pelo email (inclui a senha hashed)
      const usuario = await UsuarioModel.findByEmail(email);
      if (!usuario) {
        res.status(401).json({ erro: 'Credenciais inválidas' });
        return;
      }

      // Comparar a senha informada com a senha criptografada do banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha || '');
      if (!senhaValida) {
        res.status(401).json({ erro: 'Credenciais inválidas' });
        return;
      }

      // Gerar o token JWT
      const payload = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      };

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
      }

      const token = jwt.sign(payload, secret, {
        expiresIn: '1d' // Expiração de 1 dia
      });

      // Retorna o token e os dados básicos do usuário
      res.status(200).json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao realizar login', detalhe: error.message });
    }
  }

  // POST /logout (ou /logoff)
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ mensagem: 'Logoff realizado com sucesso. Remova o token no lado do cliente.' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao realizar logoff', detalhe: error.message });
    }
  }
}
