import React from 'react';
import { Button } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';

export const DevAuthButton: React.FC = () => {
  const { isAuthenticated, simulateLogin, logout, user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="fixed top-4 left-4 z-50 p-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
          Logado como: {user?.name}
        </p>
        <p className="text-xs text-green-600 dark:text-green-300 mb-2">
          Clientes: {user?.clientes.length}
        </p>
        <Button 
          size="sm" 
          color="danger"
          onClick={logout}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg border border-yellow-300 dark:border-yellow-700">
      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        Não autenticado - usando dados de fallback
      </p>
      <Button 
        size="sm" 
        color="warning"
        onClick={simulateLogin}
      >
        Simular Login
      </Button>
    </div>
  );
};