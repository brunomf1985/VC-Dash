// src/pages/dashboard/types.ts
export interface Faturamento {
  tipo_registro?: string;
  percent?: string;
  dre_conta?: number;
  nome: string;
  saldo_jan_2025: number;
  saldo_fev_2025: number;
  saldo_mar_2025: number;
  saldo_abr_2025: number;
  saldo_mai_2025: number;
  saldo_jun_2025: number;
  saldo_jul_2025: number;
  saldo_ago_2025: number;
  saldo_total?: number;
  media: number;
  media_seg?: number;
  media_sist?: number;
}

export interface MonthlyRecord {
  nome: string;
  [key: string]: any;
}

export interface RegistroFinanceiro {
  nome: string;
  media?: number;
  media_sist?: number;
  saldo_total?: number;
  [key: string]: any;
}
export interface DataItem extends RegistroFinanceiro {}

export interface PerformanceData {
  faturamento: RegistroFinanceiro[];
  custos_operacionais_percentual: RegistroFinanceiro[];
  evolucao_resultados_percentual: RegistroFinanceiro[];
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

export interface DataItem {
  nome: string;
  media?: number;
  media_sist?: number;
  saldo_jan_2025?: number;
  saldo_ago_2025?: number;
  [key: string]: any;
}

export interface RadarConfig {
    subject: string;
    getValor: (d: any) => number; 
    getMeta: (d: any) => number | undefined;
    tipoFormula: 'maiorMelhor' | 'menorMelhor';
}
