import { Request, Response } from 'express';
import { CategoriaModel } from '../models/categoriaModel';

export class CategoriaController {
  // GET /categorias
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const categorias = await CategoriaModel.listAll();
      res.status(200).json(categorias);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar categorias', detalhe: error.message });
    }
  }

  // GET /categorias/:id
  static async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }
      const categoria = await CategoriaModel.findById(id);
      if (!categoria) {
        res.status(404).json({ erro: 'Categoria não encontrada' });
        return;
      }
      res.status(200).json(categoria);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao obter categoria', detalhe: error.message });
    }
  }

  // POST /categorias
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome } = req.body;

      if (!nome) {
        res.status(400).json({ erro: 'O campo nome é obrigatório' });
        return;
      }

      // Verifica se a categoria já está cadastrada
      const categoriaExistente = await CategoriaModel.findByNome(nome);
      if (categoriaExistente) {
        res.status(400).json({ erro: 'Categoria já cadastrada' });
        return;
      }

      const id = await CategoriaModel.create({ nome });
      res.status(201).json({ id, nome });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao cadastrar categoria', detalhe: error.message });
    }
  }

  // PUT /categorias/:id
  static async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const { nome } = req.body;
      const dadosAtualizacao: any = {};
      if (nome !== undefined) dadosAtualizacao.nome = nome;

      if (Object.keys(dadosAtualizacao).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo para atualizar foi informado' });
        return;
      }

      // Se for atualizar o nome, verifica se já não pertence a outra categoria
      if (nome) {
        const categoriaComNome = await CategoriaModel.findByNome(nome);
        if (categoriaComNome && categoriaComNome.id !== id) {
          res.status(400).json({ erro: 'Este nome de categoria já está sendo utilizado' });
          return;
        }
      }

      const atualizado = await CategoriaModel.update(id, dadosAtualizacao);
      if (!atualizado) {
        res.status(404).json({ erro: 'Categoria não encontrada ou nenhuma alteração foi realizada' });
        return;
      }

      res.status(200).json({ mensagem: 'Categoria atualizada com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar categoria', detalhe: error.message });
    }
  }

  // DELETE /categorias/excluir/:id
  static async deletar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const deletado = await CategoriaModel.delete(id);
      if (!deletado) {
        res.status(404).json({ erro: 'Categoria não encontrada' });
        return;
      }

      res.status(200).json({ mensagem: 'Categoria deletada com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar categoria', detalhe: error.message });
    }
  }
}
