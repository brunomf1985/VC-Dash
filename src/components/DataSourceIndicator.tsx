import { useFilter } from '@/hooks/useFilter';
import { useAuth } from '@/contexts/AuthContext';
import { Chip } from '@heroui/chip';
import { Globe, User } from 'lucide-react';

export function DataSourceIndicator({ className = "" }: { className?: string }) {
  const { isLoadingApi, hasData } = useFilter();
  const { isAuthenticated } = useAuth();

  const getStatus = () => {
    if (isLoadingApi) return { text: "Carregando...", color: "warning" as const, icon: <Globe size={14} /> };
    if (!isAuthenticated) return { text: "Não autenticado", color: "danger" as const, icon: <User size={14} /> };
    if (hasData) return { text: "Dados da API", color: "success" as const, icon: <Globe size={14} /> };
    return { text: "Sem dados", color: "default" as const, icon: <Globe size={14} /> };
  };

  const status = getStatus();

  return (
    <div className={className}>
      <Chip
        startContent={status.icon}
        color={status.color}
        variant="solid"
        size="sm"
      >
        {status.text}
      </Chip>
    </div>
  );
}