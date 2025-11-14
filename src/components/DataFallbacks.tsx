// Componentes de fallback padrão para quando dados não estão disponíveis
import React from 'react';
import { Card } from '@heroui/card';

interface DataFallbackProps {
  message?: string;
  type?: 'loading' | 'no-data' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export const DataFallback: React.FC<DataFallbackProps> = ({ 
  message, 
  type = 'no-data',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  };

  const getContent = () => {
    switch (type) {
      case 'loading':
        return (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">{message || 'Carregando dados...'}</p>
          </>
        );
      case 'error':
        return (
          <>
            <div className="text-red-500 text-2xl mb-4">⚠️</div>
            <p className="text-red-600">{message || 'Erro ao carregar dados'}</p>
          </>
        );
      case 'no-data':
      default:
        return (
          <>
            <div className="text-gray-400 text-2xl mb-4">📊</div>
            <p className="text-gray-500">{message || 'Dados não disponíveis'}</p>
          </>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center">
        {getContent()}
      </div>
    </div>
  );
};

interface MetricCardFallbackProps {
  title: string;
  message?: string;
  showZero?: boolean;
}

export const MetricCardFallback: React.FC<MetricCardFallbackProps> = ({ 
  title, 
  message,
  showZero = true 
}) => (
  <Card className="p-4 bg-white dark:bg-[#141313] shadow-none opacity-50">
    <div className="space-y-2">
      <h4 className="font-bold text-large text-gray-400">{title}</h4>
      <div className="flex items-center">
        {showZero ? (
          <p className="text-2xl font-bold text-gray-400">0</p>
        ) : (
          <p className="text-sm text-gray-400">{message || 'N/A'}</p>
        )}
      </div>
      {message && (
        <p className="text-xs text-gray-400">{message}</p>
      )}
    </div>
  </Card>
);

interface ChartFallbackProps {
  title: string;
  message?: string;
  height?: string;
}

export const ChartFallback: React.FC<ChartFallbackProps> = ({ 
  title, 
  message,
  height = "400px" 
}) => (
  <div 
    className="w-full shadow-md p-4 rounded-xl bg-white dark:bg-[#141313] opacity-50"
    style={{ height }}
  >
    <div className="text-start mb-4">
      <h2 className="text-lg font-semibold text-gray-400">
        {title}
      </h2>
      {message && (
        <p className="text-xs text-gray-400">
          {message}
        </p>
      )}
    </div>
    <DataFallback 
      message="Gráfico não disponível - dados insuficientes"
      type="no-data"
      size="lg"
    />
  </div>
);

interface SafeMetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
  hasData?: boolean;
  fallbackMessage?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SafeMetricCard: React.FC<SafeMetricCardProps> = ({
  title,
  value,
  prefix = "",
  suffix = "",
  isLoading = false,
  hasData = true,
  fallbackMessage,
  className = "",
  children
}) => {
  if (isLoading) {
    return (
      <Card className={`p-4 bg-white dark:bg-[#141313] ${className}`}>
        <DataFallback type="loading" size="sm" />
      </Card>
    );
  }

  if (!hasData) {
    return (
      <MetricCardFallback 
        title={title} 
        message={fallbackMessage}
        showZero={true}
      />
    );
  }

  return (
    <Card className={`p-4 bg-white dark:bg-[#141313] transition-all duration-150 hover:-translate-y-1 hover:shadow-sm shadow-none default: hover:shadow-gray-400 dark:hover:shadow-blue-400 ${className}`}>
      <div className="space-y-2">
        <h4 className="font-bold text-large">{title}</h4>
        <div className="flex items-center">
          {prefix && <p className="text-3xl font-bold">{prefix}</p>}
          <span className="text-3xl font-bold">
            {typeof value === 'number' && !isNaN(value) ? 
              value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 
              '0.00'
            }
          </span>
          {suffix && <p className="text-3xl font-bold">{suffix}</p>}
        </div>
        {children}
      </div>
    </Card>
  );
};