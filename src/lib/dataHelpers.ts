// Utilitários para busca segura de dados da API
import { RegistroFinanceiro } from '@/pages/types';

export interface DataSearchOptions {
  fallbackValue?: number;
  logWarning?: boolean;
  fieldName?: string;
}

/**
 * Busca segura por um item em um array de dados
 */
export function findDataItem<T>(
  dataArray: T[] | undefined | null,
  predicate: (item: T) => boolean,
  options: DataSearchOptions = {}
): T | null {
  const { logWarning = true, fieldName = 'item' } = options;

  if (!dataArray || !Array.isArray(dataArray)) {
    if (logWarning) {
      console.warn(`Array de dados não encontrado para busca: ${fieldName}`);
    }
    return null;
  }

  const item = dataArray.find(predicate);
  
  if (!item && logWarning) {
    console.warn(`Item não encontrado no array: ${fieldName}`);
  }

  return item || null;
}

/**
 * Busca segura por valor em um registro financeiro
 */
export function getFinancialValue(
  dataArray: RegistroFinanceiro[] | undefined | null,
  itemName: string,
  fieldKey: keyof RegistroFinanceiro = 'saldo_total',
  options: DataSearchOptions = {}
): number {
  const { fallbackValue = 0, logWarning = true } = options;

  const item = findDataItem(
    dataArray,
    (record: RegistroFinanceiro) => record.nome?.trim().toUpperCase() === itemName.toUpperCase(),
    { logWarning, fieldName: itemName }
  );

  if (!item) {
    return fallbackValue;
  }

  const value = item[fieldKey];
  return typeof value === 'number' ? value : fallbackValue;
}

/**
 * Busca segura por múltiplos valores financeiros de uma vez
 */
export function getMultipleFinancialValues(
  dataArray: RegistroFinanceiro[] | undefined | null,
  itemNames: string[],
  fieldKey: keyof RegistroFinanceiro = 'saldo_total',
  options: DataSearchOptions = {}
): Record<string, number> {
  const result: Record<string, number> = {};

  itemNames.forEach(name => {
    result[name] = getFinancialValue(dataArray, name, fieldKey, options);
  });

  return result;
}

/**
 * Verifica se um conjunto de dados contém os campos essenciais
 */
export function validateDataAvailability(
  data: any,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    if (!data || !data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missingFields.push(field);
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Extrai dados mensais de forma segura
 */
export function extractMonthlyData(
  item: RegistroFinanceiro | null,
  months: string[],
  year: number = new Date().getFullYear(),
  options: DataSearchOptions = {}
): Array<{ month: string; value: number; key: string }> {
  const { fallbackValue = 0 } = options;

  if (!item) {
    return months.map(month => ({
      month,
      value: fallbackValue,
      key: `saldo_${month}_${year}`
    }));
  }

  return months.map(month => {
    const keyString = `saldo_${month}_${year}`;
    const key = keyString as keyof RegistroFinanceiro;
    const value = item[key];
    
    return {
      month,
      value: typeof value === 'number' ? value : fallbackValue,
      key: keyString // Retornar como string
    };
  });
}

/**
 * Calcula crescimento percentual de forma segura
 */
export function calculateGrowthPercentage(
  currentValue: number,
  previousValue: number,
  options: { returnZeroOnInvalid?: boolean } = {}
): { percentage: number; isValid: boolean } {
  const { returnZeroOnInvalid = true } = options;

  if (previousValue === 0 || !isFinite(currentValue) || !isFinite(previousValue)) {
    return {
      percentage: returnZeroOnInvalid ? 0 : NaN,
      isValid: false
    };
  }

  const percentage = ((currentValue - previousValue) / previousValue) * 100;
  
  return {
    percentage: isFinite(percentage) ? parseFloat(percentage.toFixed(2)) : 0,
    isValid: true
  };
}