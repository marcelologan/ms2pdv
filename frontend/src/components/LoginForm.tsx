import { useState } from 'react';
// 1. Importamos as ferramentas de navegação e rotas
import { useNavigate, Link, useLocation } from 'react-router-dom';

export function LoginForm() {
    // 1. Estados de Dados
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    
    // 2. Estados de Interface (UX - User Experience)
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);

    // Lê mensagem de sucesso caso redirecionado da página de cadastro
    const localizacao = useLocation();
    const mensagemSucessoInicial = (localizacao.state as { sucesso?: string })?.sucesso || null;
    const [sucesso, setSucesso] = useState<string | null>(mensagemSucessoInicial);

     // Instanciamos o navegador programático
    const navegar = useNavigate();

    // 3. A Função Assíncrona de Comunicação (O Evento)
    const lidarComSubmit = async (evento: React.FormEvent) => {
        evento.preventDefault(); 
        
        // Limpa mensagens anteriores e avisa a tela para bloquear o botão
        setErro(null);
        setSucesso(null);
        setCarregando(true);

        try {
            // A PONTE HTTP: Disparamos o 'fetch' contra a rota que criamos no Módulo 2
            const resposta = await fetch('http://localhost:3000/api/login', {
                method: 'POST', // O verbo HTTP para envio de dados sigilosos
                headers: {
                    'Content-Type': 'application/json' // Avisa o Node.js que estamos enviando JSON
                },
                body: JSON.stringify({ email, senha }) // Transforma nossas variáveis em texto para a viagem
            });

            // Convertemos a resposta do servidor de volta para Objeto
            const dados = await resposta.json();

            // Verificamos se o Node.js devolveu um Status Code de sucesso (200 OK)
            if (resposta.ok) {
                // 3. O COFRE: Guardamos o Token JWT e o Nome do Usuário no navegador
                localStorage.setItem('ms2pdv_token', dados.token);
                localStorage.setItem('ms2pdv_usuario', dados.usuario.nome);
                
                // 4. O REDIRECIONAMENTO: Mandamos o usuário para o painel imediatamente!
                navegar('/dashboard');
                
            } else {
                // ERRO 401 (Não Autorizado) ou 400 (Bad Request)
                // Usamos a mensagem de erro que o nosso próprio Node.js gerou!
                setErro(dados.erro || "Falha na autenticação.");
            }

        } catch (error) {
            // Se o Node.js estiver desligado, o código cai aqui.
            setErro("Servidor inoperante. Verifique se o Back-end está rodando.");
            console.error("Erro MS² PDV de Rede:", error);
        } finally {
            // Independente se deu certo ou errado, paramos o botão de carregar
            setCarregando(false);
        }
    };

    return (
        <form onSubmit={lidarComSubmit} className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Acesso ao Sistema</h2>

            {/* ÁREA DE FEEDBACK DE SUCESSO: Exibida se veio redirecionado do cadastro */}
            {sucesso && (
                <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded mb-4 text-sm font-medium text-center">
                    ✅ {sucesso}
                </div>
            )}

            {/* ÁREA DE FEEDBACK DE ERRO: Só aparece se a variável 'erro' tiver algum texto */}
            {erro && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm font-medium text-center">
                    🔴 {erro}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="email">
                    E-mail Corporativo
                </label>
                <input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="operador@ms2pdv.com"
                    required
                    disabled={carregando} // Impede de digitar enquanto carrega
                />
            </div>

            <div className="mb-6">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="senha">
                    Senha
                </label>
                <input 
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="********"
                    required
                    disabled={carregando}
                />
            </div>

            <button 
                type="submit" 
                disabled={carregando} // Desliga o botão para evitar clique duplo
                className={`w-full font-bold py-3 px-4 rounded transition flex justify-center items-center ${
                    carregando 
                    ? 'bg-slate-600 cursor-not-allowed text-slate-400' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                }`}
            >
                {/* Condicional JSX: Muda o texto do botão instantaneamente */}
                {carregando ? 'Autenticando...' : 'Entrar no PDV'}
            </button>

            {/* LINK PARA PÁGINA DE CADASTRO */}
            <div className="mt-6 text-center border-t border-slate-700/80 pt-4">
                <p className="text-sm text-slate-400">
                    Não possui uma conta?{' '}
                    <Link to="/cadastro" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                        Cadastre-se aqui
                    </Link>
                </p>
            </div>
        </form>
    );
}