import { Request, Response } from 'express';
import { ItemVendaModel } from '../models/itemVendaModel';
import { IItemVenda } from '../types';

export class ItemVendaController {
  
  // POST /itens-venda
  static async criar(req: Request, res: Response): Promise<Response> {
    try {
      const payload: IItemVenda = req.body;

      if (!payload.vendas_id || !payload.produtos_id) {
        return res.status(400).json({ error: "IDs da venda e do produto são obrigatórios." });
      }

      const novoItemId = await ItemVendaModel.criar(payload);

      return res.status(201).json({ 
        message: "Item adicionado à venda com sucesso!", 
        itemId: novoItemId 
      });

    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      return res.status(500).json({ error: "Erro interno ao processar o item da venda." });
    }
  }

  // GET /vendas/:vendas_id/itens (Nota: a rota pode ser configurada assim no Express)
  static async listarPorVenda(req: Request, res: Response): Promise<Response> {
    try {
      const vendas_id = parseInt(req.params.vendas_id as string);
      
      if (isNaN(vendas_id)) {
        return res.status(400).json({ error: "ID da venda inválido." });
      }

      const itens = await ItemVendaModel.listarPorVenda(vendas_id);
      return res.status(200).json(itens);

    } catch (error) {
      console.error("Erro ao listar itens da venda:", error);
      return res.status(500).json({ error: "Erro interno ao buscar os itens." });
    }
  }

  // PUT ou PATCH /itens-venda/:id
  static async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);
      const { quantidade, preco_unitario } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "ID do item inválido." });
      }

      const atualizado = await ItemVendaModel.atualizar(id, quantidade, preco_unitario);

      if (!atualizado) {
        return res.status(404).json({ error: "Item não encontrado ou não modificado." });
      }

      return res.status(200).json({ message: "Item atualizado com sucesso!" });

    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o item." });
    }
  }

  // DELETE /itens-venda/:id
  static async deletar(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({ error: "ID do item inválido." });
      }

      const deletado = await ItemVendaModel.deletar(id);

      if (!deletado) {
        return res.status(404).json({ error: "Item não encontrado." });
      }

      return res.status(200).json({ message: "Item removido da venda com sucesso!" });

    } catch (error) {
      console.error("Erro ao deletar item:", error);
      return res.status(500).json({ error: "Erro interno ao remover o item." });
    }
  }
}