import { useAuth, ClientData } from '@/contexts/AuthContext';

// Hook para acessar os clientes do usuário logado
export const useClients = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Retorna apenas os clientes do usuário logado - sem fallback
  const clients: ClientData[] = user?.clientes || [];
  
  // Função helper para encontrar cliente por ID
  const findClientById = (id: number): ClientData | undefined => {
    return clients.find(client => client.id === id);
  };
  
  // Função helper para encontrar cliente por key/nome
  const findClientByKey = (key: string): ClientData | undefined => {
    return clients.find(client => client.key === key);
  };
  
  return {
    clients,
    findClientById,
    findClientByKey,
    isAuthenticated,
    hasClients: clients.length > 0
  };
};

export default useClients;
