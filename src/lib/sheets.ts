import { supabase } from "@/integrations/supabase/client";

// Generic row type for flexible parsing
export type SheetRow = Record<string, string>;

function parseSheet(rows: string[][]): SheetRow[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1)
    .filter(r => r.some(cell => cell?.trim()))
    .map(r => {
      const obj: SheetRow = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] || '').trim();
      });
      return obj;
    });
}

export interface AllSheetsData {
  baseUnica: SheetRow[];
  visaoMensal: SheetRow[];
  esteiraMensal: SheetRow[];
  baseDados: SheetRow[];
  programacaoSemanal: SheetRow[];
  datasComemoativas: SheetRow[];
  acompCondominios: SheetRow[];
}

export async function fetchAllSheets(): Promise<AllSheetsData> {
  const { data, error } = await supabase.functions.invoke('google-sheets');

  if (error) throw new Error(`Erro ao buscar dados: ${error.message}`);

  return {
    baseUnica: parseSheet(data['BASE_UNICA']),
    visaoMensal: parseSheet(data['VISAO_MENSAL']),
    esteiraMensal: parseSheet(data['ESTEIRA_MENSAL']),
    baseDados: parseSheet(data['base_dados']),
    programacaoSemanal: parseSheet(data['PROGRAMAÇÃO_SEMANAL']),
    datasComemoativas: parseSheet(data['DATAS COMEMORATIVASS_CIDADES']),
    acompCondominios: parseSheet(data['ACOMP_CONDOMINIOS']),
  };
}

// Helper to safely get numeric value from a row
export function num(row: SheetRow, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== '') {
      const n = parseFloat(v.replace(',', '.').replace(/[^0-9.\-]/g, ''));
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

// Helper to get string value trying multiple keys
export function str(row: SheetRow, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
}
