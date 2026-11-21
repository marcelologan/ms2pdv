import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodificarToken } from '../utils/auth';
import { API_URL } from '../config/api';

interface Usuario {
    id: number;
    nome: string;
    email: string;
}

export function Perfil() {
    const navegar = useNavigate();

    // Estados dos campos do formulário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // Estados de controle e UX
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('ms2pdv_token');
        if (!token) {
            navegar('/');
            return;
        }

        const payload = decodificarToken(token);
        if (!payload || !payload.id) {
            console.error("Token inválido ou expirado.");
            localStorage.removeItem('ms2pdv_token');
            localStorage.removeItem('ms2pdv_usuario');
            navegar('/');
            return;
        }

        setUserId(payload.id);

        // Buscar dados do usuário no backend
        const carregarDadosUsuario = async () => {
            try {
                const resposta = await fetch(`${API_URL}/api/usuarios/${payload.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (resposta.ok) {
                    const dados: Usuario = await resposta.json();
                    setNome(dados.nome);
                    setEmail(dados.email);
                } else if (resposta.status === 401 || resposta.status === 403) {
                    // Sessão expirou
                    localStorage.removeItem('ms2pdv_token');
                    localStorage.removeItem('ms2pdv_usuario');
                    navegar('/');
                } else {
                    setErro("Não foi possível carregar os dados do perfil.");
                }
            } catch {
                setErro("Erro de comunicação com o servidor.");
            } finally {
                setCarregando(false);
            }
        };

        carregarDadosUsuario();
    }, [navegar]);

    const lidarComSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);
        setSucesso(null);

        if (!nome.trim() || !email.trim()) {
            setErro("Os campos Nome e E-mail são obrigatórios.");
            return;
        }

        // Validação de senha
        if (senha) {
            if (senha.length < 6) {
                setErro("A nova senha deve ter pelo menos 6 caracteres.");
                return;
            }
            if (senha !== confirmarSenha) {
                setErro("A confirmação de senha não confere.");
                return;
            }
        }

        setSalvando(true);
        const token = localStorage.getItem('ms2pdv_token');

        try {
            const bodyData: any = { nome, email };
            if (senha) {
                bodyData.senha = senha;
            }

            const resposta = await fetch(`${API_URL}/api/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setSucesso("Dados atualizados com sucesso!");
                // Atualizar o nome do usuário no cabeçalho
                localStorage.setItem('ms2pdv_usuario', nome);
                // Limpa os campos de senha
                setSenha('');
                setConfirmarSenha('');
            } else {
                setErro(dados.erro || "Erro ao atualizar dados.");
            }
        } catch {
            setErro("Falha de comunicação com o servidor.");
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <p className="text-cyan-400 font-bold animate-pulse text-xl">Buscando informações do perfil...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in my-8">
            <div className="border-b border-slate-700 pb-4 mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Meu Perfil</h2>
                    <p className="text-slate-400 text-sm">Gerencie suas credenciais de acesso</p>
                </div>
                <button
                    onClick={() => navegar('/dashboard')}
                    className="text-slate-400 hover:text-white transition flex items-center text-sm font-semibold"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Painel
                </button>
            </div>

            {erro && (
                <div className="mb-4 text-red-400 bg-red-400/10 p-4 rounded-lg text-sm border border-red-500/20 text-center font-medium">
                    🔴 {erro}
                </div>
            )}

            {sucesso && (
                <div className="mb-4 text-emerald-400 bg-emerald-400/10 p-4 rounded-lg text-sm border border-emerald-500/20 text-center font-medium">
                    🟢 {sucesso}
                </div>
            )}

            <form onSubmit={lidarComSubmit} className="space-y-6">
                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">Nome Completo</label>
                    <input
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">E-mail</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">Alterar Senha</h3>
                    <p className="text-slate-400 text-xs mb-4">Deixe em branco se não quiser alterar a senha atual.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">Nova Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                placeholder="Confirme a nova senha"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={salvando}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg font-bold transition flex justify-center items-center"
                    >
                        {salvando ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processando...
                            </>
                        ) : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
