import { Request, Response } from 'express';
import { VendaModel } from '../models/vendaModel';
import { ICriarVendaPayload } from '../types';

export class VendaController {
  
  // POST /vendas
  static async criar(req: Request, res: Response): Promise<Response> {
    try {
      const payload: ICriarVendaPayload = req.body;

      // Validação básica de regra de negócio
      if (!payload.usuarios_id) {
        return res.status(400).json({ error: "O ID do usuário é obrigatório." });
      }

      if (!payload.itens || payload.itens.length === 0) {
        return res.status(400).json({ error: "A venda precisa ter pelo menos um item." });
      }

      // Calcula o valor total caso não tenha sido enviado pelo front-end (Boas Práticas de Segurança)
      let valorTotalCalculado = 0;
      payload.itens.forEach(item => {
        valorTotalCalculado += (item.quantidade || 0) * (item.preco_unitario || 0);
      });

      payload.valor_total = payload.valor_total || valorTotalCalculado;
      payload.data_venda = payload.data_venda || new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

      const novaVendaId = await VendaModel.criarVendaComItens(payload);

      return res.status(201).json({ 
        message: "Venda registrada com sucesso!", 
        vendaId: novaVendaId 
      });

    } catch (error) {
      console.error("Erro ao criar venda:", error);
      return res.status(500).json({ error: "Erro interno ao processar a venda." });
    }
  }

  // GET /vendas
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const vendas = await VendaModel.listarTodas();
      return res.status(200).json(vendas);
    } catch (error) {
      console.error("Erro ao listar vendas:", error);
      return res.status(500).json({ error: "Erro interno ao buscar as vendas." });
    }
  }

  // GET /vendas/:id
  static async detalhar(req: Request, res: Response): Promise<Response> {
    try {
      const vendaId = parseInt(req.params.id as string);
      
      if (isNaN(vendaId)) {
        return res.status(400).json({ error: "ID de venda inválido." });
      }

      const detalhes = await VendaModel.buscarPorId(vendaId);

      if (!detalhes) {
        return res.status(404).json({ error: "Venda não encontrada." });
      }

      return res.status(200).json(detalhes);
    } catch (error) {
      console.error("Erro ao detalhar venda:", error);
      return res.status(500).json({ error: "Erro interno ao buscar os detalhes da venda." });
    }
  }
}