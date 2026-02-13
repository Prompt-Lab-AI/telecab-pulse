import { supabase } from "@/integrations/supabase/client";

export interface PapData {
  id: string;
  nome: string;
  cidade: string;
  equipe: string;
  ativo: string;
}

export interface VendaData {
  data: string;
  papId: string;
  cidade: string;
  visitas: number;
  vendas: number;
  valorTotal: number;
  produto: string;
  instalado: string;
  nps: number;
}

export interface MetaData {
  mes: string;
  metaVendas: number;
  metaConversao: number;
  metaChurnNovos: number;
}

function parseRows<T>(rows: string[][], mapper: (row: string[], headers: string[]) => T): T[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  return rows.slice(1).filter(r => r.length > 0).map(r => mapper(r, headers));
}

function col(row: string[], headers: string[], name: string, fallbackIdx: number): string {
  const idx = headers.indexOf(name);
  return (idx >= 0 ? row[idx] : row[fallbackIdx]) || '';
}

export async function fetchAllSheets(): Promise<{
  paps: PapData[];
  vendas: VendaData[];
  metas: MetaData[];
}> {
  const { data, error } = await supabase.functions.invoke('google-sheets');
  
  if (error) throw new Error(`Erro ao buscar dados: ${error.message}`);
  
  const paps = parseRows<PapData>(data.paps, (row, headers) => ({
    id: col(row, headers, 'pap_id', 0),
    nome: col(row, headers, 'nome', 1),
    cidade: col(row, headers, 'cidade', 2),
    equipe: col(row, headers, 'equipe', 3),
    ativo: col(row, headers, 'ativo', 4),
  }));

  const vendas = parseRows<VendaData>(data.vendas, (row, headers) => ({
    data: col(row, headers, 'data', 0),
    papId: col(row, headers, 'pap_id', 1),
    cidade: col(row, headers, 'cidade', 2),
    visitas: parseInt(col(row, headers, 'visitas', 3)) || 0,
    vendas: parseInt(col(row, headers, 'vendas', 4)) || 0,
    valorTotal: parseFloat(col(row, headers, 'valor_total', 5)) || 0,
    produto: col(row, headers, 'produto', 6),
    instalado: col(row, headers, 'instalado', 7),
    nps: parseInt(col(row, headers, 'nps', 8)) || 0,
  }));

  const metas = parseRows<MetaData>(data.metas, (row, headers) => ({
    mes: col(row, headers, 'mês', 0) || col(row, headers, 'mes', 0),
    metaVendas: parseFloat(col(row, headers, 'meta_vendas', 1)) || 0,
    metaConversao: parseFloat(col(row, headers, 'meta_conversao_%', 2)) || 0,
    metaChurnNovos: parseFloat(col(row, headers, 'meta_churn_novos', 3)) || 0,
  }));

  return { paps, vendas, metas };
}
