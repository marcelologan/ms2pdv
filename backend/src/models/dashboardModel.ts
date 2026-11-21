import db from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface ICardsTotais {
  totalProdutos: number;
  totalCategorias: number;
  valorTotalEstoque: number;
  totalVendas: number;
  faturamentoTotal: number;
}

export interface IEvolucaoVenda {
  data: string;
  total_vendas: number;
  total_faturado: number;
}

export interface IVendaCategoria {
  categoria_id: number;
  categoria_nome: string;
  total_itens: number;
  total_faturado: number;
}

export interface IUltimoProdutoVendido {
  id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  data_venda: string;
  nome_cliente: string | null;
}

export interface IProdutoMaisVendido {
  id: number;
  produto_nome: string;
  total_vendido: number;
  total_faturado: number;
}

export interface IProdutoMenorEstoque {
  id: number;
  nome: string;
  estoque: number;
  preco: number;
  categoria_nome: string | null;
}

export class DashboardModel {
  // 1. Obter cards absolutos (Visão Global do Estoque e Operação)
  static async obterCardsTotais(usuarioId: number): Promise<ICardsTotais> {
    const [produtosRows] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total, COALESCE(SUM(COALESCE(estoque, 0) * preco), 0) as valor_total_estoque FROM produtos WHERE usuario_id = ?',
      [usuarioId]
    );

    const [categoriasRows] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM categorias'
    );

    const [vendasRows] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total_vendas, COALESCE(SUM(valor_total), 0) as faturamento_total FROM Vendas WHERE usuarios_id = ?',
      [usuarioId]
    );

    return {
      totalProdutos: Number(produtosRows[0]?.total || 0),
      totalCategorias: Number(categoriasRows[0]?.total || 0),
      valorTotalEstoque: Number(produtosRows[0]?.valor_total_estoque || 0),
      totalVendas: Number(vendasRows[0]?.total_vendas || 0),
      faturamentoTotal: Number(vendasRows[0]?.faturamento_total || 0)
    };
  }

  // 2. Evolução de vendas no período (para gráficos temporais)
  static async obterEvolucaoVendas(usuarioId: number, dataInicio: string, dataFim: string): Promise<IEvolucaoVenda[]> {
    const queryStr = `
      SELECT DATE_FORMAT(data_venda, '%Y-%m-%d') as data, 
             COUNT(id) as total_vendas, 
             COALESCE(SUM(valor_total), 0) as total_faturado 
      FROM Vendas 
      WHERE usuarios_id = ? 
        AND DATE(data_venda) >= ? 
        AND DATE(data_venda) <= ? 
      GROUP BY DATE_FORMAT(data_venda, '%Y-%m-%d') 
      ORDER BY data ASC
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, [usuarioId, dataInicio, dataFim]);
    return rows.map(r => ({
      data: r.data,
      total_vendas: Number(r.total_vendas || 0),
      total_faturado: Number(r.total_faturado || 0)
    }));
  }

  // 3. Vendas por Categoria no período
  static async obterVendasPorCategoria(usuarioId: number, dataInicio: string, dataFim: string): Promise<IVendaCategoria[]> {
    const queryStr = `
      SELECT c.id as categoria_id, 
             c.nome as categoria_nome, 
             COALESCE(SUM(iv.quantidade), 0) as total_itens, 
             COALESCE(SUM(iv.quantidade * iv.preco_unitario), 0) as total_faturado 
      FROM itens_venda iv 
      JOIN produtos p ON iv.produtos_id = p.id 
      JOIN categorias c ON p.categoria_id = c.id 
      JOIN Vendas v ON iv.vendas_id = v.id 
      WHERE v.usuarios_id = ? 
        AND DATE(v.data_venda) >= ? 
        AND DATE(v.data_venda) <= ? 
      GROUP BY c.id, c.nome 
      ORDER BY total_faturado DESC
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, [usuarioId, dataInicio, dataFim]);
    return rows.map(r => ({
      categoria_id: Number(r.categoria_id),
      categoria_nome: r.categoria_nome,
      total_itens: Number(r.total_itens || 0),
      total_faturado: Number(r.total_faturado || 0)
    }));
  }

  // 4. Últimos produtos vendidos no período
  static async obterUltimosProdutosVendidos(usuarioId: number, dataInicio: string, dataFim: string, limite = 5): Promise<IUltimoProdutoVendido[]> {
    const queryStr = `
      SELECT iv.id, 
             p.nome as produto_nome, 
             iv.quantidade, 
             iv.preco_unitario, 
             (iv.quantidade * iv.preco_unitario) as total, 
             DATE_FORMAT(v.data_venda, '%Y-%m-%d') as data_venda, 
             v.nome_cliente 
      FROM itens_venda iv 
      JOIN produtos p ON iv.produtos_id = p.id 
      JOIN Vendas v ON iv.vendas_id = v.id 
      WHERE v.usuarios_id = ? 
        AND DATE(v.data_venda) >= ? 
        AND DATE(v.data_venda) <= ? 
      ORDER BY v.data_venda DESC, iv.id DESC 
      LIMIT ?
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, [usuarioId, dataInicio, dataFim, limite]);
    return rows.map(r => ({
      id: Number(r.id),
      produto_nome: r.produto_nome,
      quantidade: Number(r.quantidade || 0),
      preco_unitario: Number(r.preco_unitario || 0),
      total: Number(r.total || 0),
      data_venda: r.data_venda,
      nome_cliente: r.nome_cliente
    }));
  }

  // 5. Produtos mais vendidos (ranking) no período
  static async obterProdutosMaisVendidos(usuarioId: number, dataInicio: string, dataFim: string, limite = 5): Promise<IProdutoMaisVendido[]> {
    const queryStr = `
      SELECT p.id, 
             p.nome as produto_nome, 
             COALESCE(SUM(iv.quantidade), 0) as total_vendido, 
             COALESCE(SUM(iv.quantidade * iv.preco_unitario), 0) as total_faturado 
      FROM itens_venda iv 
      JOIN produtos p ON iv.produtos_id = p.id 
      JOIN Vendas v ON iv.vendas_id = v.id 
      WHERE v.usuarios_id = ? 
        AND DATE(v.data_venda) >= ? 
        AND DATE(v.data_venda) <= ? 
      GROUP BY p.id, p.nome 
      ORDER BY total_vendido DESC, total_faturado DESC 
      LIMIT ?
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, [usuarioId, dataInicio, dataFim, limite]);
    return rows.map(r => ({
      id: Number(r.id),
      produto_nome: r.produto_nome,
      total_vendido: Number(r.total_vendido || 0),
      total_faturado: Number(r.total_faturado || 0)
    }));
  }

  // 6. Produtos com menor estoque
  static async obterProdutosMenorEstoque(usuarioId: number, limite = 8): Promise<IProdutoMenorEstoque[]> {
    const queryStr = `
      SELECT p.id, 
             p.nome, 
             COALESCE(p.estoque, 0) as estoque, 
             p.preco, 
             c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      WHERE p.usuario_id = ? 
      ORDER BY p.estoque ASC 
      LIMIT ?
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, [usuarioId, limite]);
    return rows.map(r => ({
      id: Number(r.id),
      nome: r.nome,
      estoque: Number(r.estoque || 0),
      preco: Number(r.preco || 0),
      categoria_nome: r.categoria_nome
    }));
  }
}

