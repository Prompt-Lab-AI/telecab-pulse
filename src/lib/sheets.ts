import { supabase } from "@/integrations/supabase/client";

export type SheetRow = Record<string, string>;

function parseSheet(rows: string[][]): SheetRow[] {
  if (!rows || rows.length < 2) return [];
  // Find the header row (first row with 3+ non-empty cells)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const nonEmpty = (rows[i] || []).filter(c => c?.trim()).length;
    if (nonEmpty >= 3) { headerIdx = i; break; }
  }
  const headers = rows[headerIdx].map(h => h.trim().toLowerCase());
  return rows.slice(headerIdx + 1)
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

/** Parse Brazilian currency "R$ 59,90" → 59.9 */
export function parseCurrency(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/r\$\s*/i, '').replace(/\./g, '').replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
}

/** Parse Brazilian date "dd/mm/yyyy" → Date | null */
export function parseDate(v: string): Date | null {
  if (!v || !v.includes('/')) return null;
  const parts = v.split('/');
  if (parts.length < 3) return null;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return isNaN(d.getTime()) ? null : d;
}

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

export function str(row: SheetRow, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
}
