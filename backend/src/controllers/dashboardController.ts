import { Response } from 'express';
import { IAuthenticatedRequest } from '../middlewares/authMiddleware';
import { DashboardModel } from '../models/dashboardModel';

export class DashboardController {

  private static extrairIntervaloDatas(query: any): { dataInicio: string; dataFim: string } {
    const { mes, data_inicio, data_fim } = query;

    if (mes && typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes)) {
      const [ano, mesStr] = mes.split('-').map(Number);
      const primeiroDia = `${mes}-01`;
      const ultimoDiaNum = new Date(ano, mesStr, 0).getDate();
      const ultimoDia = `${mes}-${String(ultimoDiaNum).padStart(2, '0')}`;
      return { dataInicio: primeiroDia, dataFim: ultimoDia };
    }

    if (data_inicio && data_fim && typeof data_inicio === 'string' && typeof data_fim === 'string') {
      return { dataInicio: data_inicio, dataFim: data_fim };
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');
    const primeiroDia = `${ano}-${mesAtual}-01`;
    const ultimoDiaNum = new Date(ano, agora.getMonth() + 1, 0).getDate();
    const ultimoDia = `${ano}-${mesAtual}-${String(ultimoDiaNum).padStart(2, '0')}`;

    return { dataInicio: primeiroDia, dataFim: ultimoDia };
  }

  // GET /api/dashboard
  static async obterGeral(req: IAuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioLogado?.id;
      if (!usuarioId) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
      }

      const { dataInicio, dataFim } = DashboardController.extrairIntervaloDatas(req.query);

      const [
        cards,
        evolucaoVendas,
        vendasPorCategoria,
        ultimosVendidos,
        maisVendidos,
        menorEstoque
      ] = await Promise.all([
        DashboardModel.obterCardsTotais(usuarioId),
        DashboardModel.obterEvolucaoVendas(usuarioId, dataInicio, dataFim),
        DashboardModel.obterVendasPorCategoria(usuarioId, dataInicio, dataFim),
        DashboardModel.obterUltimosProdutosVendidos(usuarioId, dataInicio, dataFim, 6),
        DashboardModel.obterProdutosMaisVendidos(usuarioId, dataInicio, dataFim, 5),
        DashboardModel.obterProdutosMenorEstoque(usuarioId, 8)
      ]);

      return res.status(200).json({
        periodo: {
          dataInicio,
          dataFim
        },
        cards,
        graficos: {
          evolucaoVendas,
          vendasPorCategoria
        },
        ultimosVendidos,
        maisVendidos,
        menorEstoque
      });

    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      return res.status(500).json({ erro: 'Erro interno ao processar dados do dashboard.' });
    }
  }

  // GET /api/dashboard/cards
  static async obterCards(req: IAuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioLogado?.id;
      if (!usuarioId) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
      }

      const cards = await DashboardModel.obterCardsTotais(usuarioId);
      return res.status(200).json(cards);
    } catch (error) {
      console.error('Erro ao obter cards do dashboard:', error);
      return res.status(500).json({ erro: 'Erro ao buscar métricas globais.' });
    }
  }
}

