import { SheetRow, parseCurrency, parseDate, num } from './sheets';

// ========== BUSINESS DEFINITIONS ==========

/** Venda Válida: Status = "Ativo" AND Data de Ativação preenchida */
export function isVendaValida(row: SheetRow): boolean {
  return row['status']?.toLowerCase() === 'ativo' && !!row['data de ativação']?.trim();
}

/** Contrato Ativo: Status = "Ativo" AND (Data de Cancelamento vazia OU futura) */
export function isContratoAtivo(row: SheetRow): boolean {
  if (row['status']?.toLowerCase() !== 'ativo') return false;
  const dataCancelamento = row['data de cancelamento']?.trim();
  if (!dataCancelamento) return true;
  const d = parseDate(dataCancelamento);
  return d ? d > new Date() : true;
}

/** Cancelamento 90 dias: "Cancelado até 90 dias?" contém valor indicando cancelamento */
export function isCancelamento90d(row: SheetRow): boolean {
  const val = (row['cancelado até 90 dias?'] || '').toLowerCase().trim();
  return val === 'sim' || val === 'cancelado';
}

/** Get month/year key from "Mês/Ano" field like "fevereiro/2026" */
export function getMesAno(row: SheetRow): string {
  return (row['mês/ano'] || '').toLowerCase().trim();
}

/** Get current month string */
export function getCurrentMesAno(): string {
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const now = new Date();
  return `${months[now.getMonth()]}/${now.getFullYear()}`;
}

/** Get previous month string */
export function getPreviousMesAno(): string {
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${months[prev.getMonth()]}/${prev.getFullYear()}`;
}

// ========== DATA FILTERS ==========

export function filterByMonth(data: SheetRow[], mesAno: string): SheetRow[] {
  if (!mesAno || mesAno === 'all') return data;
  return data.filter(r => getMesAno(r) === mesAno.toLowerCase());
}

export function filterByPap(data: SheetRow[], pap: string): SheetRow[] {
  if (!pap || pap === 'all') return data;
  return data.filter(r => r['pap'] === pap);
}

export function filterByCidade(data: SheetRow[], cidade: string): SheetRow[] {
  if (!cidade || cidade === 'all') return data;
  return data.filter(r => r['cidade'] === cidade);
}

export function filterByProduto(data: SheetRow[], produto: string): SheetRow[] {
  if (!produto || produto === 'all') return data;
  return data.filter(r => r['produto'] === produto);
}

export function filterByStatus(data: SheetRow[], status: string): SheetRow[] {
  if (!status || status === 'all') return data;
  return data.filter(r => r['status'] === status);
}

export function applyAllFilters(data: SheetRow[], filters: Record<string, string>): SheetRow[] {
  let result = data;
  result = filterByMonth(result, filters.mes || 'all');
  result = filterByPap(result, filters.pap || 'all');
  result = filterByCidade(result, filters.cidade || 'all');
  result = filterByProduto(result, filters.produto || 'all');
  result = filterByStatus(result, filters.status || 'all');
  return result;
}

// ========== KPI CALCULATIONS ==========

export interface KPIs {
  metaAtingida: number; // %
  totalVendasValidas: number;
  metaMensal: number;
  taxaConversao: number; // %
  vendasSubidas: number;
  vendasInstaladas: number;
  churn90d: number; // %
  cancelamentos90d: number;
  contratosUltimos90d: number;
  ticketMedio: number; // R$
  totalContratosAtivos: number;
  mrrAtivo: number; // R$
  receitaAtiva: number;
}

export function calculateKPIs(
  baseFiltered: SheetRow[],
  visaoMensal: SheetRow[],
  esteiraMensal: SheetRow[],
): KPIs {
  // 1. Vendas Válidas (from BASE_UNICA)
  const vendasValidas = baseFiltered.filter(isVendaValida);
  const totalVendasValidas = vendasValidas.length;

  // 2. Contratos Ativos
  const contratosAtivos = baseFiltered.filter(isContratoAtivo);
  const totalContratosAtivos = contratosAtivos.length;

  // 3. Meta Mensal (from VISAO_MENSAL — sum of Meta Mensal for rows with data)
  const visaoComDados = visaoMensal.filter(r => r['pap']?.trim());
  const metaMensal = visaoComDados.reduce((acc, r) => acc + num(r, 'meta mensal'), 0) || 0;
  const metaAtingida = metaMensal > 0 ? (totalVendasValidas / metaMensal) * 100 : 0;

  // 4. Esteira (from ESTEIRA_MENSAL)
  const esteiraComDados = esteiraMensal.filter(r => r['pap']?.trim());
  const vendasSubidas = esteiraComDados.reduce((acc, r) => acc + num(r, 'vendas subidas'), 0);
  const vendasInstaladas = esteiraComDados.reduce((acc, r) => acc + num(r, 'vendas instaladas'), 0);
  const taxaConversao = vendasSubidas > 0 ? (vendasInstaladas / vendasSubidas) * 100 : 0;

  // 5. Churn 90 dias
  const cancelamentos90d = baseFiltered.filter(isCancelamento90d).length;
  // Contratos vendidos nos últimos 90 dias
  const now = new Date();
  const d90ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const contratosUltimos90d = baseFiltered.filter(r => {
    const dv = parseDate(r['data da venda'] || '');
    return dv && dv >= d90ago;
  }).length;
  const churn90d = contratosUltimos90d > 0 ? (cancelamentos90d / contratosUltimos90d) * 100 : 0;

  // 6. Ticket Médio Real = Soma(Valor Mensal ativos) / Qtde ativos
  const receitaAtiva = contratosAtivos.reduce((acc, r) => acc + parseCurrency(r['valor mensal'] || ''), 0);
  const ticketMedio = totalContratosAtivos > 0 ? receitaAtiva / totalContratosAtivos : 0;

  // 7. MRR
  const mrrAtivo = receitaAtiva;

  return {
    metaAtingida,
    totalVendasValidas,
    metaMensal,
    taxaConversao,
    vendasSubidas,
    vendasInstaladas,
    churn90d,
    cancelamentos90d,
    contratosUltimos90d,
    ticketMedio,
    totalContratosAtivos,
    mrrAtivo,
    receitaAtiva,
  };
}

// ========== PAP RANKING ==========

export interface PapRanking {
  pap: string;
  vendasValidas: number;
  churn90d: number;
  ticketMedio: number;
  score: number;
  mrrAtivo: number;
}

export function calculatePapRankings(base: SheetRow[]): PapRanking[] {
  const paps = [...new Set(base.map(r => r['pap']).filter(Boolean))];
  
  return paps.map(pap => {
    const rows = base.filter(r => r['pap'] === pap);
    const vendasValidas = rows.filter(isVendaValida).length;
    const cancelados = rows.filter(isCancelamento90d).length;
    const ativos = rows.filter(isContratoAtivo);
    const receita = ativos.reduce((acc, r) => acc + parseCurrency(r['valor mensal'] || ''), 0);
    const ticketMedio = ativos.length > 0 ? receita / ativos.length : 0;
    const churn = rows.length > 0 ? (cancelados / rows.length) * 100 : 0;
    // Score: vendas * (1 - churn%) + ticket normalized
    const score = vendasValidas * (1 - churn / 100) + ticketMedio / 10;

    return { pap, vendasValidas, churn90d: churn, ticketMedio, score, mrrAtivo: receita };
  }).sort((a, b) => b.score - a.score);
}

// ========== ALERTS ==========

export interface Alert {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export function generateAlerts(kpis: KPIs, rankings: PapRanking[]): Alert[] {
  const alerts: Alert[] = [];

  if (kpis.churn90d > 5) {
    alerts.push({
      type: 'error',
      title: '🔴 Churn Crítico',
      message: `Churn 90d está em ${kpis.churn90d.toFixed(1)}% — acima do limite de 5%.`,
    });
  }

  if (kpis.metaAtingida < 80 && kpis.metaMensal > 0) {
    alerts.push({
      type: 'warning',
      title: '🟡 Meta em Risco',
      message: `Meta atingida: ${kpis.metaAtingida.toFixed(1)}% — abaixo de 80%.`,
    });
  }

  if (kpis.taxaConversao < 70 && kpis.vendasSubidas > 0) {
    alerts.push({
      type: 'info',
      title: '🟠 Conversão Baixa',
      message: `Taxa de conversão: ${kpis.taxaConversao.toFixed(1)}% — abaixo da média esperada.`,
    });
  }

  // PAP-specific alerts
  rankings.forEach(r => {
    if (r.churn90d > 10 && r.vendasValidas > 0) {
      alerts.push({
        type: 'error',
        title: `🔴 PAP ${r.pap} — Churn Alto`,
        message: `Churn de ${r.churn90d.toFixed(1)}% para ${r.pap}.`,
      });
    }
  });

  return alerts;
}

// ========== TREND ==========

export type Trend = 'up' | 'down' | 'stable';

export function getTrend(current: number, previous: number): Trend {
  if (previous === 0 && current === 0) return 'stable';
  if (previous === 0) return 'up';
  const change = ((current - previous) / previous) * 100;
  if (change > 2) return 'up';
  if (change < -2) return 'down';
  return 'stable';
}

// ========== CALCULATED TABLE COLUMNS ==========

export interface EnrichedRow extends Record<string, string> {
  _diasInstalacao: string;
  _slaColor: 'green' | 'yellow' | 'red' | 'pending';
  _isVendaValida: string;
}

export function enrichBaseRows(rows: SheetRow[]): EnrichedRow[] {
  return rows.map(row => {
    const dataVenda = parseDate(row['data da venda'] || '');
    const dataAtivacao = parseDate(row['data de ativação'] || '');
    
    let diasInstalacao = '-';
    let slaColor: 'green' | 'yellow' | 'red' | 'pending' = 'pending';
    
    if (dataVenda && dataAtivacao) {
      const diff = Math.floor((dataAtivacao.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24));
      diasInstalacao = `${diff}d`;
      if (diff <= 7) slaColor = 'green';
      else if (diff <= 15) slaColor = 'yellow';
      else slaColor = 'red';
    }

    return {
      ...row,
      _diasInstalacao: diasInstalacao,
      _slaColor: slaColor,
      _isVendaValida: isVendaValida(row) ? 'Sim' : 'Não',
    };
  });
}

// ========== CHART DATA HELPERS ==========

export function getRevenueByProduct(base: SheetRow[]): { produto: string; receita: number }[] {
  const ativos = base.filter(isContratoAtivo);
  const byProduct: Record<string, number> = {};
  ativos.forEach(r => {
    const p = r['produto'] || 'Outros';
    byProduct[p] = (byProduct[p] || 0) + parseCurrency(r['valor mensal'] || '');
  });
  return Object.entries(byProduct)
    .map(([produto, receita]) => ({ produto, receita }))
    .sort((a, b) => b.receita - a.receita);
}

export function getVendasByDay(base: SheetRow[]): { data: string; vendas: number }[] {
  const vendasValidas = base.filter(isVendaValida);
  const byDay: Record<string, number> = {};
  vendasValidas.forEach(r => {
    const d = r['data da venda'] || '';
    if (d) byDay[d] = (byDay[d] || 0) + 1;
  });
  return Object.entries(byDay)
    .map(([data, vendas]) => ({ data, vendas }))
    .sort((a, b) => {
      const da = parseDate(a.data);
      const db = parseDate(b.data);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
}

export function getFunnelData(esteira: SheetRow[]): { etapa: string; valor: number }[] {
  const comDados = esteira.filter(r => r['pap']?.trim());
  const subidas = comDados.reduce((acc, r) => acc + num(r, 'vendas subidas'), 0);
  const instaladas = comDados.reduce((acc, r) => acc + num(r, 'vendas instaladas'), 0);
  const cancelamentos = comDados.reduce((acc, r) => acc + num(r, 'cancelamentos 90d'), 0);

  return [
    { etapa: 'Vendas Subidas', valor: subidas },
    { etapa: 'Vendas Instaladas', valor: instaladas },
    { etapa: 'Cancelamentos 90d', valor: cancelamentos },
  ];
}
