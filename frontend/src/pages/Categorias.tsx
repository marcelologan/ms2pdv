import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProdutoForm } from '../components/ProdutoForm';
import { decodificarToken } from '../utils/auth';
import { API_URL } from '../config/api';

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

export function Categorias() {
    const navegar = useNavigate();

    // Estados de dados
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroGeral, setErroGeral] = useState<string | null>(null);

    // Estados do Modal de Formulário (Cadastro / Edição)
    const [modalFormAberto, setModalFormAberto] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);
    const [erroModalForm, setErroModalForm] = useState<string | null>(null);

    // Estados do Modal de Visualização de Produtos
    const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);

    // Estados do Modal de Confirmação de Exclusão
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
    const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
    const [excluindoCategoria, setExcluindoCategoria] = useState(false);
    const [erroModalExcluir, setErroModalExcluir] = useState<string | null>(null);

    // Estados do modal de produto (Adicionar / Editar)
    const [modalProdutoFormAberto, setModalProdutoFormAberto] = useState(false);
    const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);

    // Carregar dados iniciais
    useEffect(() => {
        let isMounted = true;
        const carregarDados = async () => {
            const token = localStorage.getItem('ms2pdv_token');
            if (!token) {
                navegar('/');
                return;
            }

            const payload = decodificarToken(token);
            if (!payload || !payload.id) {
                localStorage.removeItem('ms2pdv_token');
                localStorage.removeItem('ms2pdv_usuario');
                navegar('/');
                return;
            }

            try {
                const respostaCategorias = await fetch(`${API_URL}/api/categorias`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const respostaProdutos = await fetch(`${API_URL}/api/produtos/usuario/${payload.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Ejeção em caso de token inválido ou expirado
                if (respostaCategorias.status === 401 || respostaCategorias.status === 403 ||
                    respostaProdutos.status === 401 || respostaProdutos.status === 403) {
                    localStorage.removeItem('ms2pdv_token');
                    localStorage.removeItem('ms2pdv_usuario');
                    navegar('/');
                    return;
                }

                if (respostaCategorias.ok && respostaProdutos.ok) {
                    const dadosCats = await respostaCategorias.json();
                    const dadosProds = await respostaProdutos.json();
                    if (isMounted) {
                        setCategorias(dadosCats);
                        setProdutos(dadosProds);
                    }
                } else {
                    setErroGeral("Falha ao buscar categorias e produtos do estoque.");
                }
            } catch {
                setErroGeral("Falha na comunicação com o servidor.");
            } finally {
                if (isMounted) {
                    setCarregando(false);
                }
            }
        };

        carregarDados();

        return () => {
            isMounted = false;
        };
    }, [navegar]);

    // Contagem de produtos por categoria
    const contarProdutos = (categoriaId: number) => {
        return produtos.filter(p => p.categoria_id === categoriaId).length;
    };

    // Obter produtos vinculados a uma categoria
    const obterProdutosDaCategoria = (categoriaId: number) => {
        return produtos.filter(p => p.categoria_id === categoriaId);
    };

    // Abertura do modal para Cadastro
    const abrirModalCadastro = () => {
        setCategoriaEditando(null);
        setNomeCategoria('');
        setErroModalForm(null);
        setModalFormAberto(true);
    };

    // Abertura do modal para Edição
    const abrirModalEdicao = (categoria: Categoria) => {
        setCategoriaEditando(categoria);
        setNomeCategoria(categoria.nome);
        setErroModalForm(null);
        setModalFormAberto(true);
    };

    // Submit de Cadastro / Edição
    const lidarComSalvarCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        setErroModalForm(null);

        if (!nomeCategoria.trim()) {
            setErroModalForm("O nome da categoria é obrigatório.");
            return;
        }

        setSalvandoCategoria(true);
        const token = localStorage.getItem('ms2pdv_token');

        try {
            const isEdicao = !!categoriaEditando;
            const url = isEdicao 
                ? `${API_URL}/api/categorias/${categoriaEditando.id}`
                : `${API_URL}/api/categorias/cadastrar`;
            
            const metodo = isEdicao ? 'PUT' : 'POST';

            const resposta = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome: nomeCategoria })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                if (isEdicao) {
                    // Atualiza a categoria na lista
                    setCategorias(categorias.map(c => c.id === categoriaEditando.id ? { ...c, nome: nomeCategoria } : c));
                } else {
                    // Adiciona a nova categoria na lista
                    setCategorias([...categorias, { id: dados.id, nome: nomeCategoria }]);
                }
                setModalFormAberto(false);
            } else {
                setErroModalForm(dados.erro || "Erro ao processar requisição.");
            }
        } catch {
            setErroModalForm("Erro de comunicação com o servidor.");
        } finally {
            setSalvandoCategoria(false);
        }
    };

    // Abertura do modal de Ver Produtos
    const abrirModalProdutos = (categoria: Categoria) => {
        setCategoriaSelecionada(categoria);
        setModalProdutosAberto(true);
    };

    // Abertura do modal de confirmação de exclusão
    const abrirModalExcluir = (categoria: Categoria) => {
        setCategoriaParaExcluir(categoria);
        setErroModalExcluir(null);
        setModalExcluirAberto(true);
    };

    // Exclusão efetiva de categoria
    const lidarComExcluirCategoria = async () => {
        if (!categoriaParaExcluir) return;

        setExcluindoCategoria(true);
        setErroModalExcluir(null);
        const token = localStorage.getItem('ms2pdv_token');

        try {
            const resposta = await fetch(`${API_URL}/api/categorias/excluir/${categoriaParaExcluir.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                // Remove a categoria da lista
                setCategorias(categorias.filter(c => c.id !== categoriaParaExcluir.id));
                setModalExcluirAberto(false);
            } else {
                setErroModalExcluir(dados.erro || "Não foi possível excluir a categoria.");
            }
        } catch {
            setErroModalExcluir("Erro ao comunicar exclusão com o servidor.");
        } finally {
            setExcluindoCategoria(false);
        }
    };

    // Excluir produto diretamente do modal
    const lidarComExcluirProduto = async (produto: Produto) => {
        const confirmacao = window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`);
        if (!confirmacao) return;

        const token = localStorage.getItem('ms2pdv_token');
        try {
            const resposta = await fetch(`${API_URL}/api/produtos/excluir/${produto.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resposta.ok) {
                setProdutos(produtos.filter(p => p.id !== produto.id));
            } else {
                alert("Erro ao excluir o produto.");
            }
        } catch {
            alert("Erro de comunicação com o servidor.");
        }
    };

    if (carregando) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <p className="text-cyan-400 font-bold animate-pulse text-xl">Buscando categorias do estoque...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in relative z-10 my-8">
            {/* Cabeçalho do Dashboard de Categorias */}
            <div className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Categorias</h2>
                    <p className="text-slate-400 text-sm">Gerencie o agrupamento de seus produtos</p>
                </div>

                <button
                    onClick={abrirModalCadastro}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg font-bold transition flex items-center space-x-2 text-sm cursor-pointer shadow-lg hover:shadow-cyan-500/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nova Categoria</span>
                </button>
            </div>

            {/* Mensagem de Erro Geral */}
            {erroGeral && (
                <div className="mb-6 text-red-400 bg-red-400/10 p-4 rounded-lg text-sm border border-red-500/20 text-center font-medium">
                    🔴 {erroGeral}
                </div>
            )}

            {/* Grid de Categorias em Cards */}
            {categorias.length === 0 ? (
                <div className="text-center text-slate-500 py-16">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-lg font-medium">Nenhuma categoria cadastrada.</p>
                    <p className="text-sm mt-1">Clique no botão acima para adicionar a primeira.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorias.map(cat => {
                        const qtdProdutos = contarProdutos(cat.id);
                        return (
                            <div key={cat.id} className="bg-slate-900 border border-slate-700/60 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between shadow-md group">
                                <div className="mb-6">
                                    <span className="text-slate-500 text-xs font-mono">ID: {cat.id}</span>
                                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mt-1 truncate">{cat.nome}</h3>
                                    
                                    <div className="flex items-center space-x-2 mt-4 bg-slate-800/40 border border-slate-800 px-3 py-2 rounded-lg w-fit">
                                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-300">
                                            {qtdProdutos} {qtdProdutos === 1 ? 'produto' : 'produtos'}
                                        </span>
                                    </div>
                                </div>

                                {/* Botões de Ação */}
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-800/60 pt-4 mt-auto">
                                    <button
                                        onClick={() => abrirModalEdicao(cat)}
                                        className="bg-slate-800 hover:bg-cyan-600/10 border border-slate-700 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                                        title="Editar Categoria"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Editar</span>
                                    </button>

                                    <button
                                        onClick={() => abrirModalProdutos(cat)}
                                        className="bg-slate-800 hover:bg-emerald-600/10 border border-slate-700 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                                        title="Visualizar Produtos"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span>Ver</span>
                                    </button>

                                    <button
                                        onClick={() => abrirModalExcluir(cat)}
                                        className="bg-slate-800 hover:bg-red-600/10 border border-slate-700 hover:border-red-500/30 text-slate-300 hover:text-red-400 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                                        title="Deletar Categoria"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Excluir</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============================================================== */}
            {/* 1. MODAL DE CADASTRO E EDIÇÃO DE CATEGORIAS */}
            {/* ============================================================== */}
            {modalFormAberto && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">
                            {categoriaEditando ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}
                        </h3>

                        {erroModalForm && (
                            <div className="mb-4 text-red-400 bg-red-400/10 p-3 rounded text-sm border border-red-500/20 text-center font-medium">
                                {erroModalForm}
                            </div>
                        )}

                        <form onSubmit={lidarComSalvarCategoria} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">
                                    Nome da Categoria
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ex: Armas, Poções, Pergaminhos"
                                    value={nomeCategoria}
                                    onChange={(e) => setNomeCategoria(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition text-sm"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setModalFormAberto(false)}
                                    disabled={salvandoCategoria}
                                    className="px-4 py-2 rounded text-slate-400 hover:text-white transition text-sm font-semibold cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvandoCategoria}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded font-bold transition text-sm flex items-center space-x-2 cursor-pointer shadow-lg hover:shadow-emerald-500/10"
                                >
                                    {salvandoCategoria ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <span>Confirmar</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 2. MODAL DE VISUALIZAÇÃO DE PRODUTOS */}
            {/* ============================================================== */}
            {modalProdutosAberto && categoriaSelecionada && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative animate-scale-up max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                            <div>
                                <h3 className="text-xl font-bold text-cyan-400">
                                    Produtos em: {categoriaSelecionada.nome}
                                </h3>
                                <p className="text-slate-400 text-xs">Lista detalhada de itens vinculados</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        setProdutoParaEditar(null);
                                        setModalProdutoFormAberto(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Adicionar Produto</span>
                                </button>
                                <button
                                    onClick={() => setModalProdutosAberto(false)}
                                    className="text-slate-400 hover:text-white transition"
                                    title="Fechar"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Listagem de Produtos */}
                        <div className="overflow-y-auto flex-grow pr-1 mb-4">
                            {obterProdutosDaCategoria(categoriaSelecionada.id).length === 0 ? (
                                <div className="text-center text-slate-500 py-12">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-sm font-semibold">Nenhum produto vinculado a esta categoria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
                                    <table className="w-full text-left text-slate-300 text-sm">
                                        <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Nome</th>
                                                <th className="px-4 py-3 text-right">Preço</th>
                                                <th className="px-4 py-3 text-right">Estoque</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {obterProdutosDaCategoria(categoriaSelecionada.id).map(prod => (
                                                <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{prod.id}</td>
                                                    <td className="px-4 py-3 font-bold text-white">{prod.nome}</td>
                                                    <td className="px-4 py-3 text-right">R$ {Number(prod.preco).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        <span className={prod.estoque <= 5 ? 'text-red-400' : 'text-emerald-400'}>
                                                            {prod.estoque} un
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setProdutoParaEditar(prod);
                                                                    setModalProdutoFormAberto(true);
                                                                }}
                                                                className="text-cyan-400 hover:text-cyan-300 transition text-xs font-bold cursor-pointer"
                                                                title="Editar Produto"
                                                            >
                                                                Editar
                                                            </button>
                                                            <span className="text-slate-700">|</span>
                                                            <button
                                                                onClick={() => lidarComExcluirProduto(prod)}
                                                                className="text-red-400 hover:text-red-300 transition text-xs font-bold cursor-pointer"
                                                                title="Excluir Produto"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-700 pt-4">
                            <button
                                onClick={() => setModalProdutosAberto(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded font-bold transition text-sm cursor-pointer"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 3. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {/* ============================================================== */}
            {modalExcluirAberto && categoriaParaExcluir && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Excluir Categoria</h3>
                            <p className="text-slate-400 text-sm mt-1">Esta ação não poderá ser desfeita.</p>
                        </div>

                        {erroModalExcluir && (
                            <div className="mb-4 text-red-400 bg-red-400/10 p-3 rounded text-sm border border-red-500/20 text-center font-medium">
                                {erroModalExcluir}
                            </div>
                        )}

                        <div className="space-y-4 text-center">
                            <p className="text-slate-300 text-sm">
                                Tem certeza que deseja excluir a categoria <strong className="text-white">"{categoriaParaExcluir.nome}"</strong>?
                            </p>

                            {contarProdutos(categoriaParaExcluir.id) > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-left">
                                    <p className="text-xs text-amber-400 font-bold uppercase mb-1 flex items-center">
                                        ⚠️ Atenção!
                                    </p>
                                    <p className="text-xs text-slate-300">
                                        Esta categoria possui <strong>{contarProdutos(categoriaParaExcluir.id)}</strong> produtos vinculados. 
                                        A exclusão pode falhar se houver restrições de integridade no banco de dados.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-700">
                            <button
                                type="button"
                                onClick={() => setModalExcluirAberto(false)}
                                disabled={excluindoCategoria}
                                className="px-4 py-2 rounded text-slate-400 hover:text-white transition text-sm font-semibold cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={lidarComExcluirCategoria}
                                disabled={excluindoCategoria}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded font-bold transition text-sm flex items-center space-x-2 cursor-pointer shadow-lg hover:shadow-red-500/10"
                            >
                                {excluindoCategoria ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Excluindo...</span>
                                    </>
                                ) : (
                                    <span>Excluir Categoria</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ============================================================== */}
            {/* 4. MODAL DE FORMULÁRIO DE PRODUTO (ADICIONAR / EDITAR) */}
            {/* ============================================================== */}
            {modalProdutoFormAberto && categoriaSelecionada && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[60] animate-fade-in p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
                        <ProdutoForm
                            categorias={categorias}
                            produtoEditando={produtoParaEditar ?? ({ categoria_id: categoriaSelecionada.id } as Produto)}
                            aoCancelar={() => setModalProdutoFormAberto(false)}
                            aoSalvar={(produtoSalvo) => {
                                if (produtoParaEditar) {
                                    // Edição
                                    setProdutos(produtos.map(p => p.id === produtoSalvo.id ? produtoSalvo : p));
                                } else {
                                    // Cadastro
                                    setProdutos([...produtos, produtoSalvo]);
                                }
                                setModalProdutoFormAberto(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
