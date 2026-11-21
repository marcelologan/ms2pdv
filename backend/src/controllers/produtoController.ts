import { Response } from 'express';
import { IAuthenticatedRequest } from '../middlewares/authMiddleware';
import { ProdutoModel } from '../models/produtoModel';
import { CategoriaModel } from '../models/categoriaModel';

export class ProdutoController {
  // GET /produtos
  static async listar(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const categoria_id = req.query.categoria_id ? parseInt(req.query.categoria_id as string) : undefined;
      const usuario_id = req.query.usuario_id ? parseInt(req.query.usuario_id as string) : undefined;

      const filters: { categoria_id?: number; usuario_id?: number } = {};
      if (categoria_id !== undefined && !isNaN(categoria_id)) {
        filters.categoria_id = categoria_id;
      }
      if (usuario_id !== undefined && !isNaN(usuario_id)) {
        filters.usuario_id = usuario_id;
      }

      const produtos = await ProdutoModel.listAll(filters);
      res.status(200).json(produtos);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar produtos', detalhe: error.message });
    }
  }

  // GET /produtos/categoria/:categoria_id
  static async listarPorCategoria(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const categoria_id = parseInt(req.params.categoria_id as string);
      if (isNaN(categoria_id)) {
        res.status(400).json({ erro: 'ID da categoria inválido' });
        return;
      }
      const produtos = await ProdutoModel.listAll({ categoria_id });
      res.status(200).json(produtos);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar produtos por categoria', detalhe: error.message });
    }
  }

  // GET /produtos/usuario/:usuario_id
  static async listarPorUsuario(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuario_id = parseInt(req.params.usuario_id as string);
      if (isNaN(usuario_id)) {
        res.status(400).json({ erro: 'ID do usuário inválido' });
        return;
      }
      const produtos = await ProdutoModel.listAll({ usuario_id });
      res.status(200).json(produtos);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar produtos por usuário', detalhe: error.message });
    }
  }

  // GET /produtos/usuario/:usuario_id/categoria/:categoria_id
  static async listarPorUsuarioECategoria(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuario_id = parseInt(req.params.usuario_id as string);
      const categoria_id = parseInt(req.params.categoria_id as string);
      if (isNaN(usuario_id) || isNaN(categoria_id)) {
        res.status(400).json({ erro: 'ID do usuário ou da categoria inválido' });
        return;
      }
      const produtos = await ProdutoModel.listAll({ usuario_id, categoria_id });
      res.status(200).json(produtos);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar produtos por usuário e categoria', detalhe: error.message });
    }
  }

  // GET /produtos/:id
  static async obterPorId(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }
      const produto = await ProdutoModel.findById(id);
      if (!produto) {
        res.status(404).json({ erro: 'Produto não encontrado' });
        return;
      }
      res.status(200).json(produto);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao obter produto', detalhe: error.message });
    }
  }

  // POST /produtos
  static async criar(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { nome, preco, estoque, categoria_id } = req.body;
      const usuarioLogado = req.usuarioLogado;

      if (!usuarioLogado) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      // Validação de campos obrigatórios
      if (!nome || preco === undefined || categoria_id === undefined) {
        res.status(400).json({ erro: 'Os campos nome, preco e categoria_id são obrigatórios' });
        return;
      }

      // Verifica se o produto já está cadastrado com o mesmo nome
      const produtoExistente = await ProdutoModel.findByNome(nome);
      if (produtoExistente) {
        res.status(400).json({ erro: 'Produto com este nome já cadastrado' });
        return;
      }

      // Verifica se a categoria informada existe
      const categoria = await CategoriaModel.findById(categoria_id);
      if (!categoria) {
        res.status(400).json({ erro: 'Categoria informada não existe' });
        return;
      }

      const id = await ProdutoModel.create({
        nome,
        preco: Number(preco),
        estoque: estoque !== undefined ? Number(estoque) : null,
        categoria_id: Number(categoria_id),
        usuario_id: usuarioLogado.id
      });

      res.status(201).json({
        id,
        nome,
        preco,
        estoque,
        categoria_id,
        usuario_id: usuarioLogado.id
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao cadastrar produto', detalhe: error.message });
    }
  }

  // POST /produtos/cadastrar-lote
  static async criarLote(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const produtos = req.body;
      const usuarioLogado = req.usuarioLogado;

      if (!usuarioLogado) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      // Valida se o body é um array
      if (!Array.isArray(produtos)) {
        res.status(400).json({ erro: 'O corpo da requisição deve ser um array de produtos' });
        return;
      }

      // Valida se o array não está vazio
      if (produtos.length === 0) {
        res.status(400).json({ erro: 'O lote de produtos não pode estar vazio' });
        return;
      }

      // Arrays para controle de duplicidades locais (no próprio lote)
      const nomesNoLote = new Set<string>();

      // Validar cada produto antes de iniciar qualquer transação
      for (let i = 0; i < produtos.length; i++) {
        const prod = produtos[i];
        const indexMsg = `no produto de índice ${i}`;

        // 1. Validação de campos obrigatórios
        if (!prod.nome || prod.preco === undefined || prod.categoria_id === undefined) {
          res.status(400).json({
            erro: `Campos obrigatórios ausentes (nome, preco e categoria_id são obrigatórios) ${indexMsg}`
          });
          return;
        }

        // 2. Validação de duplicidade de nome dentro do próprio lote
        const nomeLower = prod.nome.toLowerCase().trim();
        if (nomesNoLote.has(nomeLower)) {
          res.status(400).json({
            erro: `O nome "${prod.nome}" está duplicado dentro do próprio lote enviado`
          });
          return;
        }
        nomesNoLote.add(nomeLower);

        // 3. Validação de existência da categoria no banco
        const categoriaExistente = await CategoriaModel.findById(prod.categoria_id);
        if (!categoriaExistente) {
          res.status(400).json({
            erro: `A categoria com ID ${prod.categoria_id} informada ${indexMsg} não existe no banco de dados`
          });
          return;
        }

        // 4. Validação se o nome do produto já existe no banco de dados
        const produtoExistenteNoBanco = await ProdutoModel.findByNome(prod.nome);
        if (produtoExistenteNoBanco) {
          res.status(400).json({
            erro: `O produto com o nome "${prod.nome}" já está cadastrado no sistema ${indexMsg}`
          });
          return;
        }

        // Preenche/sobrescreve o usuario_id com o do usuário autenticado por segurança
        prod.usuario_id = usuarioLogado.id;
        // Assegura tipos corretos
        prod.preco = Number(prod.preco);
        if (prod.estoque !== undefined && prod.estoque !== null) {
          prod.estoque = Number(prod.estoque);
        } else {
          prod.estoque = null;
        }
      }

      // Executa a criação em lote usando transação
      const ids = await ProdutoModel.createMany(produtos);

      // Associa os IDs gerados de volta aos objetos correspondentes
      const produtosCadastrados = produtos.map((prod, i) => ({
        id: ids[i],
        nome: prod.nome,
        preco: prod.preco,
        estoque: prod.estoque,
        categoria_id: prod.categoria_id,
        usuario_id: prod.usuario_id
      }));

      res.status(201).json({
        mensagem: 'Produtos cadastrados em lote com sucesso',
        quantidade: produtosCadastrados.length,
        produtos: produtosCadastrados
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao cadastrar produtos em lote', detalhe: error.message });
    }
  }

  // PUT /produtos/:id
  static async atualizar(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const { nome, preco, estoque, categoria_id } = req.body;
      const dadosAtualizacao: any = {};

      if (nome !== undefined) dadosAtualizacao.nome = nome;
      if (preco !== undefined) dadosAtualizacao.preco = Number(preco);
      if (estoque !== undefined) dadosAtualizacao.estoque = estoque !== null ? Number(estoque) : null;

      if (categoria_id !== undefined) {
        // Se informou categoria, valida se ela existe
        const categoria = await CategoriaModel.findById(categoria_id);
        if (!categoria) {
          res.status(400).json({ erro: 'Categoria informada não existe' });
          return;
        }
        dadosAtualizacao.categoria_id = Number(categoria_id);
      }

      if (Object.keys(dadosAtualizacao).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo para atualizar foi informado' });
        return;
      }

      // Se for atualizar o nome, verifica se já não pertence a outro produto
      if (nome) {
        const produtoComNome = await ProdutoModel.findByNome(nome);
        if (produtoComNome && produtoComNome.id !== id) {
          res.status(400).json({ erro: 'Este nome de produto já está sendo utilizado' });
          return;
        }
      }

      const atualizado = await ProdutoModel.update(id, dadosAtualizacao);
      if (!atualizado) {
        res.status(404).json({ erro: 'Produto não encontrado ou nenhuma alteração foi realizada' });
        return;
      }

      res.status(200).json({ mensagem: 'Produto atualizado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar produto', detalhe: error.message });
    }
  }

  // DELETE /produtos/excluir/:id
  static async deletar(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ erro: 'ID inválido' });
        return;
      }

      const deletado = await ProdutoModel.delete(id);
      if (!deletado) {
        res.status(404).json({ erro: 'Produto não encontrado' });
        return;
      }

      res.status(200).json({ mensagem: 'Produto deletado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar produto', detalhe: error.message });
    }
  }
}
