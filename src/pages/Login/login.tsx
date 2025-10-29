import React, { useState } from "react";
import { Card, CardBody, Input, Button } from "@heroui/react";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useWatchTheme } from "@/hooks/WatchTheme";
import lightLogo from "@/imgs/vc-financas-logo.png";
import darkLogo from "@/imgs/vc-financas-logo-dark.png";
// Importe o useNavigate para o redirecionamento
import { AnimatedThemeToggler } from "@/components/ui/theme-toggle";

export const Login: React.FC = () => {
  const { isDarkMode } = useWatchTheme();
  const navigate = useNavigate(); // Hook para navegar

  // --- Estados para controlar o formulário ---
  const [email, setEmail] = useState(`adm@granitoboneli.com.br`);
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  // --- Função de Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página
    setIsLoading(true);
    setError("");

    // Simulação de chamada de API (substitua pela sua lógica real)
    try {
      // Atraso de 1 segundo para simular a rede
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Lógica de autenticação (exemplo simples)
      if (email === "adm@granitoboneli.com.br" && password.length > 0) {
        // SUCESSO: Redireciona para o dashboard
        // Você pode salvar o token/usuário no localStorage/Context aqui
        navigate("/"); // <- Redireciona para a página principal
      } else {
        // ERRO:
        setError("Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center transition-all duration-300 bg-gradient-to-br from-blue-300 via-slate-200 to-blue-300 gap-10 h-full w-full dark:from-slate-950 dark:via-blue-950 dark:to-slate-950">
      <AnimatedThemeToggler className="absolute top-4 right-4" />
      <div className="flex flex-col items-center mb-8">
        <img
          alt="VC Finanças Logo"
          className="h-12 w-auto mb-4"
          src={isDarkMode ? darkLogo : lightLogo}
        />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Financeiro
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Acesse sua plataforma de gestão financeira
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg bg-neutral-100 dark:bg-neutral-950">
        <CardBody className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Entrar
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Digite suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Alterado para 'form' com 'onSubmit' */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <Input
                isRequired
                classNames={{ input: "!text-inherit" }}
                label="Email"
                placeholder="seu_email@gmail.com"
                startContent={<MailIcon className="text-gray-400" size={18} />}
                type="email"
                value={email} // Controlado pelo estado
                variant="underlined"
                onChange={(e) => setEmail(e.target.value)} // Atualiza o estado
              />
            </div>

            <div>
              <Input
                isRequired
                classNames={{ input: "!text-inherit" }}
                endContent={
                  <button
                    aria-label="Toggle password visibility"
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <EyeOffIcon className="text-gray-400" size={18} />
                    ) : (
                      <EyeIcon className="text-gray-400" size={18} />
                    )}
                  </button>
                }
                errorMessage={error} // Mostra a mensagem de erro
                label="Senha"
                placeholder="Digite sua senha"
                startContent={<LockIcon className="text-gray-400" size={18} />}
                type={isVisible ? "text" : "password"}
                value={password} // Controlado pelo estado
                variant="underlined"
                onChange={(e) => setPassword(e.target.value)} // Atualiza o estado
              />
            </div>

            <Button
              className="w-full text-white dark:text-black font-medium bg-black dark:bg-white"
              isLoading={isLoading} // Prop de carregamento
              size="lg"
              type="submit" // Define como botão de submissão do formulário
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <a className="text-sm text-blue-500 hover:underline" href="/">
              Esqueceu a senha?
            </a>
          </div>
        </CardBody>
      </Card>

      <footer className="mt-8 text-xs text-gray-500">
        © 2024 VC Finanças. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Login;
