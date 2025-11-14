import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Interface para dados do cliente
export interface ClientData {
  id: number;
  key: string;
  label: string;
}

// Interface para dados do usuário logado
export interface UserData {
  id: number;
  name: string;
  email: string;
  token: string;
  clientes: ClientData[]; // Lista de clientes que o usuário tem acesso
}

// Interface para resposta do login do backend
export interface LoginResponse {
  result: Array<{
    id?: number;
    nome?: string;
    name?: string;
  }>;
  clientes: Array<{
    id_cliente: number;
    nome_cliente: string;
    crs: any[];
  }>;
}

// Interface do contexto
interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  simulateLogin: () => void; // Novo método para simular login em desenvolvimento
  logout: () => void;
  isAuthenticated: boolean;
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider do contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se há dados salvos no localStorage ao inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Remove dados corrompidos
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  // Função de login
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://wmsapp.vallysys.com.br:9000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: email,
          senha: password,
        }),
      });

      if (response.ok) {
        const loginData = await response.json();
        
        // Verificar se tem dados de resposta
        if (loginData.result || loginData.clientes) {
          // Extrair dados do usuário do array result
          let userInfo = loginData.result?.[0] || {};
          
          // Processar clientes da resposta do backend
          let normalizedClients: ClientData[] = [];
          
          if (loginData.clientes && Array.isArray(loginData.clientes)) {
            normalizedClients = loginData.clientes.map((cliente: any) => ({
              id: cliente.id_cliente,
              key: cliente.nome_cliente,
              label: cliente.nome_cliente
            }));
          }

          // Criar objeto do usuário
          const userData: UserData = {
            id: userInfo.id || 1,
            name: userInfo.nome || userInfo.name || email.split('@')[0],
            email: email,
            token: 'authenticated',
            clientes: normalizedClients
          };

          // Salva no estado e localStorage
          setUser(userData);
          localStorage.setItem('userData', JSON.stringify(userData));
          localStorage.setItem('authToken', userData.token);
          
          return true;
        } else {
          return false;
        }
      }
      
      console.error('Response não OK:', response.status);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
  };

  // Função para simular login em desenvolvimento
  const simulateLogin = () => {
    const mockUserData: UserData = {
      id: 1,
      name: 'Usuário de Teste',
      email: 'teste@exemplo.com.br',
      token: 'mock-token-123',
      clientes: [
        { id: 101, key: "EMPRESA ALPHA LTDA", label: "EMPRESA ALPHA LTDA" },
        { id: 102, key: "BETA COMERCIO E SERVICOS", label: "BETA COMERCIO E SERVICOS" },
        { id: 103, key: "GAMMA INDUSTRIA S.A.", label: "GAMMA INDUSTRIA S.A." },
        { id: 104, key: "DELTA DISTRIBUIDORA", label: "DELTA DISTRIBUIDORA" },
        { id: 105, key: "EPSILON TECNOLOGIA", label: "EPSILON TECNOLOGIA" }
      ]
    };

    setUser(mockUserData);
    localStorage.setItem('userData', JSON.stringify(mockUserData));
    localStorage.setItem('authToken', mockUserData.token);
    
    console.log('Login simulado realizado com sucesso:', mockUserData);
  };

  // Valor do contexto
  const value: AuthContextType = {
    user,
    isLoading,
    login,
    simulateLogin,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};