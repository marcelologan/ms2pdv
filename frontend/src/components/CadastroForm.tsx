import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function CadastroForm() {
    // 1. Estados de Dados
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // 2. Estados de Interface (UX)
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);

    const navegar = useNavigate();

    // 3. Submissão do Formulário
    const lidarComSubmit = async (evento: React.FormEvent) => {
        evento.preventDefault();
        setErro(null);
        setSucesso(null);

        // Validações básicas no front-end
        if (!nome.trim() || !email.trim() || !senha) {
            setErro('Preencha todos os campos obrigatórios.');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('A senha e a confirmação de senha não coincidem.');
            return;
        }

        if (senha.length < 3) {
            setErro('A senha deve conter no mínimo 3 caracteres.');
            return;
        }

        setCarregando(true);

        try {
            // Chamada à rota pública de criação de usuários analisada no controller
            const resposta = await fetch('http://localhost:3000/api/usuarios/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: nome.trim(),
                    email: email.trim(),
                    senha
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                // Sucesso: feedback visual e redirecionamento de volta para o login
                setSucesso('Conta cadastrada com sucesso! Redirecionando para o login...');

                setTimeout(() => {
                    navegar('/', {
                        state: {
                            sucesso: 'Cadastro realizado com sucesso! Faça login para entrar no sistema.'
                        }
                    });
                }, 1200);
            } else {
                // Exibe a mensagem de validação retornada pelo controller (ex: 'E-mail já cadastrado')
                setErro(dados.erro || dados.detalhe || 'Erro ao realizar o cadastro.');
            }
        } catch (error) {
            setErro('Servidor inoperante. Verifique se o Back-end está rodando.');
            console.error('Erro MS² PDV de Rede ao cadastrar:', error);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <form onSubmit={lidarComSubmit} className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Criar Nova Conta</h2>

            {/* FEEDBACK DE ERRO */}
            {erro && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm font-medium text-center">
                    🔴 {erro}
                </div>
            )}

            {/* FEEDBACK DE SUCESSO */}
            {sucesso && (
                <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded mb-4 text-sm font-medium text-center">
                    ✅ {sucesso}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="nome">
                    Nome Completo
                </label>
                <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Seu Nome Completo"
                    required
                    disabled={carregando}
                />
            </div>

            <div className="mb-4">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="email">
                    E-mail de Acesso
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="operador@ms2pdv.com"
                    required
                    disabled={carregando}
                />
            </div>

            <div className="mb-4">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="senha">
                    Senha
                </label>
                <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Digite sua senha"
                    required
                    disabled={carregando}
                />
            </div>

            <div className="mb-6">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="confirmarSenha">
                    Confirmar Senha
                </label>
                <input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Repita sua senha"
                    required
                    disabled={carregando}
                />
            </div>

            <button
                type="submit"
                disabled={carregando}
                className={`w-full font-bold py-3 px-4 rounded transition flex justify-center items-center ${
                    carregando
                    ? 'bg-slate-600 cursor-not-allowed text-slate-400'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                }`}
            >
                {carregando ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>

            {/* LINK PARA RETORNAR AO LOGIN */}
            <div className="mt-6 text-center border-t border-slate-700/80 pt-4">
                <p className="text-sm text-slate-400">
                    Já possui uma conta?{' '}
                    <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                        Fazer login
                    </Link>
                </p>
            </div>
        </form>
    );
}
