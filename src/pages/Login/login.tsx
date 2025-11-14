import React, { useState } from "react";
import { Card, CardBody, Input, Button } from "@heroui/react";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useWatchTheme } from "@/hooks/WatchTheme";
import { useAuth } from "@/contexts/AuthContext";
import lightLogo from "@/imgs/vc-financas-logo.png";
import darkLogo from "@/imgs/vc-financas-logo-dark.png";
import { AnimatedThemeToggler } from "@/components/ui/theme-toggle";

// const BASE_URL = 'https://wmsapp.vallysys.com.br:9000';
// const LOGIN_ENDPOINT = '/login';

export const Login: React.FC = () => {
  const { isDarkMode } = useWatchTheme();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState(`adm@granitoboneli.com.br`);
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(email, password);
      
      if (success) {
        navigate("/");
      } else {
        setError("Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Ocorreu um erro de rede. Verifique sua conexão.");
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

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <Input
                isRequired
                classNames={{ input: "!text-inherit" }}
                label="CPF"
                placeholder="12345678910"
                startContent={<MailIcon className="text-gray-400" size={18} />}
                type="number"
                value={email}
                variant="underlined"
                onChange={(e) => setEmail(e.target.value)}
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
                errorMessage={error}
                isInvalid={!!error}
                label="Senha"
                placeholder="Digite sua senha"
                startContent={<LockIcon className="text-gray-400" size={18} />}
                type={isVisible ? "text" : "password"}
                value={password}
                variant="underlined"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");  
                }}
              />
            </div>

            <Button
              className="w-full text-white dark:text-black font-medium bg-black dark:bg-white"
              isLoading={isLoading}
              size="lg"
              type="submit"
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