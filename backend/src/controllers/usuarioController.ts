import { Request, Response } from 'express';
import { UsuarioModel } from '../models/usuarioModel';
import bcrypt from 'bcrypt';


export class UsuarioController {
  // GET /usuarios
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await UsuarioModel.listAll();
      res.status(200).json(usuarios);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar usuários', detalhe: error.message });
    }
  }

  // GET /usuarios/:id
  static async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }
      const usuario = await UsuarioModel.findById(id);
      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }
      res.status(200).json(usuario);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao obter usuário', detalhe: error.message });
    }
  }

  // POST /usuarios
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha } = req.body;
      
      // Validação simples
      if (!nome || !email || !senha) {
        res.status(400).json({ erro: 'Os campos nome, email e senha são obrigatórios' });
        return;
      }

      // Verifica se o email já está cadastrado
      const usuarioExistente = await UsuarioModel.findByEmail(email);
      if (usuarioExistente) {
        res.status(400).json({ erro: 'E-mail já cadastrado' });
        return;
      }

      // Criptografa a senha antes de salvar no banco de dados
      const senhaCriptografada = await bcrypt.hash(senha, 10);

      const id = await UsuarioModel.create({ nome, email, senha: senhaCriptografada });
      res.status(201).json({ id, nome, email });
    } catch (error: any) {
      console.error('❌ Erro ao cadastrar usuário:', error);
      res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhe: error.message });
    }
  }

  // PUT /usuarios/:id
  static async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const { nome, email, senha } = req.body;
      const dadosAtualizacao: any = {};
      if (nome !== undefined) dadosAtualizacao.nome = nome;
      if (email !== undefined) dadosAtualizacao.email = email;
      if (senha !== undefined) {
        dadosAtualizacao.senha = await bcrypt.hash(senha, 10);
      }

      if (Object.keys(dadosAtualizacao).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo para atualizar foi informado' });
        return;
      }

      // Se for atualizar o email, verifica se já não pertence a outro usuário
      if (email) {
        const usuarioComEmail = await UsuarioModel.findByEmail(email);
        if (usuarioComEmail && usuarioComEmail.id !== id) {
          res.status(400).json({ erro: 'Este e-mail já está sendo utilizado por outro usuário' });
          return;
        }
      }

      const atualizado = await UsuarioModel.update(id, dadosAtualizacao);
      if (!atualizado) {
        res.status(404).json({ erro: 'Usuário não encontrado ou nenhuma alteração foi realizada' });
        return;
      }

      res.status(200).json({ mensagem: 'Usuário atualizado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar usuário', detalhe: error.message });
    }
  }

  // DELETE /usuarios/:id
  static async deletar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const deletado = await UsuarioModel.delete(id);
      if (!deletado) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      res.status(200).json({ mensagem: 'Usuário deletado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar usuário', detalhe: error.message });
    }
  }
}
