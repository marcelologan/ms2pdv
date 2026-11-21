import { useState } from 'react';
import { API_URL } from '../config/api';

// 1. Tipamos o que esse formulário precisa receber do Componente Pai (Dashboard)
interface Categoria {
    id: number;
    nome: string;
}

interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
    categoria_id: number;
}

interface ProdutoFormProps {
    categorias: Categoria[]; // Recebe a lista para montar o menu suspenso <select>
    aoSalvar: (novoProduto: Produto) => void; // Uma função que o Pai passa para avisar que deu certo
    aoCancelar: () => void; // Função para fechar o formulário
    produtoEditando?: Produto | null; 
}

export function ProdutoForm({ categorias, aoSalvar, aoCancelar, produtoEditando }: ProdutoFormProps) {
    // 2. Os Estados (Memória RAM do formulário)
    const [nome, setNome] = useState(produtoEditando?.nome ?? '');
    const [preco, setPreco] = useState(produtoEditando?.preco?.toString() ?? '');
    const [estoque, setEstoque] = useState(produtoEditando?.estoque?.toString() ?? '');
    const [categoriaId, setCategoriaId] = useState(produtoEditando?.categoria_id?.toString() ?? '');

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // 3. A Função de Disparo (POST)
    const lidarComSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        if (!categoriaId) {
            setErro("Selecione uma categoria para o produto.");
            return;
        }

        setCarregando(true);
        const token = localStorage.getItem('ms2pdv_token');

        try {
            const isEdicao = !!produtoEditando;
            const url = isEdicao
                ? `${API_URL}/api/produtos/${produtoEditando.id}`
                : `${API_URL}/api/produtos/cadastrar`;

            const metodoHTTP = isEdicao ? 'PUT' : 'POST';

            const resposta = await fetch(url, {
                method: metodoHTTP,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome, preco: parseFloat(preco), estoque: parseInt(estoque), categoria_id: parseInt(categoriaId)
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                // Devolvemos o produto montado para o Dashboard atualizar a tela
                aoSalvar({
                    id: isEdicao ? produtoEditando.id : dados.id,
                    nome, preco: parseFloat(preco), estoque: parseInt(estoque), categoria_id: parseInt(categoriaId)
                });
            } else {
                setErro(dados.erro || "Erro ao cadastrar produto.");
            }
        } catch {
            setErro("Falha de comunicação com o servidor.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <form onSubmit={lidarComSubmit} className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8 animate-fade-in">
            {/* O Título muda automaticamente */}
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
                {produtoEditando ? `Editando: ${produtoEditando.nome}` : 'Cadastrar Novo Produto'}
            </h3>

            {erro && <div className="mb-4 text-red-400 bg-red-400/10 p-3 rounded text-sm">{erro}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1">Nome do Produto</label>
                    <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-cyan-500" />
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1">Categoria</label>
                    <select required value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-cyan-500">
                        <option value="" disabled>Selecione...</option>
                        {/* Mapeia as categorias reais que vieram do banco para construir as opções */}
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" required value={preco} onChange={e => setPreco(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-cyan-500" />
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1">Estoque Inicial</label>
                    <input type="number" required value={estoque} onChange={e => setEstoque(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-cyan-500" />
                </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={aoCancelar} disabled={carregando}
                    className="px-4 py-2 rounded text-slate-400 hover:text-white transition">Cancelar</button>
                <button type="submit" disabled={carregando}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold transition">
                    {carregando ? 'Processando...' : (produtoEditando ? 'Salvar Alterações' : 'Confirmar Cadastro')}
                </button>
            </div>
        </form>
    );
}