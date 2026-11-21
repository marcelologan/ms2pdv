import { CadastroForm } from '../components/CadastroForm';

export function Cadastro() {
    return (
        <div className="w-full max-w-md mx-auto py-12">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-extrabold text-cyan-400 mb-2">MS² PDV</h2>
                <p className="text-slate-400">Crie sua conta de operador para acessar o Ponto de Venda</p>
            </div>
            {/* Formulário de cadastro de usuário */}
            <CadastroForm />
        </div>
    );
}
