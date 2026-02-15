import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend,
} from 'recharts';
import {
  enrichBaseRows, isContratoAtivo, isVendaValida, getVendasByDay,
  calculatePapRankings,
} from '@/lib/analytics';
import { parseCurrency } from '@/lib/sheets';
import type { EnrichedRow } from '@/lib/analytics';
import { FileText, DollarSign, CheckCircle, AlertTriangle, Search, TrendingUp, TrendingDown } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';

interface BaseUnicaPanelProps {
  data: SheetRow[];
}

// ── KPI Card ──
function MiniKpi({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Status & SLA badge colors ──
const STATUS_COLORS: Record<string, string> = {
  'ativo': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'cancelado': 'bg-red-100 text-red-800 border-red-200',
  'agendado': 'bg-blue-100 text-blue-800 border-blue-200',
  'aguardando agendamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
};
const SLA_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-muted text-muted-foreground border-border',
};
const SLA_LABELS: Record<string, string> = {
  green: '✅ ≤7d', yellow: '⚠️ 8-15d', red: '🔴 >15d', pending: '⏳ Pendente',
};

const VISIBLE_COLUMNS = [
  { key: 'pap', label: 'PAP' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'produto', label: 'Produto' },
  { key: 'data da venda', label: 'Data Venda' },
  { key: 'valor mensal', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: '_diasInstalacao', label: 'Dias Inst.' },
  { key: '_slaColor', label: 'SLA' },
];

export function BaseUnicaPanel({ data }: BaseUnicaPanelProps) {
  const [search, setSearch] = useState('');

  // ── Enriched rows ──
  const enriched = useMemo(() => enrichBaseRows(data), [data]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const ativos = data.filter(isContratoAtivo);
    const mrr = ativos.reduce((s, r) => s + parseCurrency(r['valor mensal'] || ''), 0);
    const totalEnriched = enriched.length;
    const slaGreen = enriched.filter(r => r._slaColor === 'green').length;
    const slaRed = enriched.filter(r => r._slaColor === 'red').length;
    return {
      contratosAtivos: ativos.length,
      mrr,
      pctSlaGreen: totalEnriched > 0 ? (slaGreen / totalEnriched) * 100 : 0,
      pctSlaRed: totalEnriched > 0 ? (slaRed / totalEnriched) * 100 : 0,
    };
  }, [data, enriched]);

  // ── Chart: vendas ao longo do tempo ──
  const vendasByDay = useMemo(() => getVendasByDay(data), [data]);

  // ── Chart: vendas por PAP ──
  const vendasByPap = useMemo(() => {
    const rankings = calculatePapRankings(data);
    return rankings.map(r => ({ pap: r.pap, vendas: r.vendasValidas }));
  }, [data]);

  // ── Chart: SLA empilhado por PAP ──
  const slaByPap = useMemo(() => {
    const paps = [...new Set(data.map(r => r['pap']).filter(Boolean))];
    return paps.map(pap => {
      const rows = enriched.filter(r => r['pap'] === pap);
      return {
        pap,
        verde: rows.filter(r => r._slaColor === 'green').length,
        amarelo: rows.filter(r => r._slaColor === 'yellow').length,
        vermelho: rows.filter(r => r._slaColor === 'red').length,
      };
    }).filter(r => r.verde + r.amarelo + r.vermelho > 0)
      .sort((a, b) => (b.verde + b.amarelo + b.vermelho) - (a.verde + a.amarelo + a.vermelho));
  }, [data, enriched]);

  // ── Rankings ──
  const rankings = useMemo(() => calculatePapRankings(data), [data]);
  const top5 = rankings.slice(0, 5);
  const bottom5 = [...rankings].reverse().slice(0, 5);

  // ── Search filter ──
  const filteredTable = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(r =>
      (r['cliente'] || '').toLowerCase().includes(q) ||
      (r['cpf'] || '').toLowerCase().includes(q) ||
      (r['pap'] || '').toLowerCase().includes(q)
    );
  }, [enriched, search]);

  return (
    <div className="space-y-4">
      {/* 1) KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniKpi
          title="Contratos Ativos"
          value={String(kpis.contratosAtivos)}
          subtitle="Contratos vigentes"
          icon={FileText}
          color="bg-primary/10 text-primary"
        />
        <MiniKpi
          title="Receita Ativa (MRR)"
          value={`R$ ${kpis.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle="Mensal recorrente"
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-700"
        />
        <MiniKpi
          title="SLA Verde (≤ 7d)"
          value={`${kpis.pctSlaGreen.toFixed(1)}%`}
          subtitle="Instalações no prazo"
          icon={CheckCircle}
          color="bg-emerald-100 text-emerald-700"
        />
        <MiniKpi
          title="SLA Vermelho (> 15d)"
          value={`${kpis.pctSlaRed.toFixed(1)}%`}
          subtitle="Instalações atrasadas"
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* 2) Gráficos principais */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Vendas ao longo do tempo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Vendas ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="vendas" stroke="hsl(215, 100%, 35%)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(215, 100%, 35%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vendas por PAP */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Vendas Válidas por PAP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasByPap} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="pap" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="hsl(215, 100%, 35%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA empilhado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Distribuição SLA por PAP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaByPap}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="pap" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="verde" name="≤ 7d" stackId="sla" fill="hsl(150, 60%, 40%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="amarelo" name="8-15d" stackId="sla" fill="hsl(45, 90%, 50%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vermelho" name="> 15d" stackId="sla" fill="hsl(0, 70%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3) Rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Top 5 PAPs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top5.map((r, i) => (
              <div key={r.pap} className="flex items-center justify-between rounded-lg border bg-emerald-50/50 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.pap}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{r.vendasValidas} vendas</span>
                  <span>R$ {r.ticketMedio.toFixed(0)}</span>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    Score {r.score.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
            {top5.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
          </CardContent>
        </Card>

        {/* Bottom 5 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-red-600" /> Bottom 5 PAPs — Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bottom5.map((r, i) => (
              <div key={r.pap} className="flex items-center justify-between rounded-lg border bg-red-50/50 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {rankings.length - i}
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.pap}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{r.vendasValidas} vendas</span>
                  <span>Churn {r.churn90d.toFixed(1)}%</span>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                    Score {r.score.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
            {bottom5.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* 4) Pesquisa inteligente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Search className="h-4 w-4" /> Pesquisa Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por Cliente, CPF ou PAP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* 5) Tabela detalhada */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Base Única — Contratos</CardTitle>
            <span className="text-xs text-muted-foreground">{filteredTable.length} registros</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {VISIBLE_COLUMNS.map(col => (
                  <TableHead key={col.key} className="text-xs font-semibold whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTable.map((row, i) => (
                <TableRow key={i} className="text-xs">
                  {VISIBLE_COLUMNS.map(col => {
                    if (col.key === 'status') {
                      const statusKey = (row['status'] || '').toLowerCase();
                      return (
                        <TableCell key={col.key}>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[statusKey] || ''}`}>
                            {row['status'] || '-'}
                          </Badge>
                        </TableCell>
                      );
                    }
                    if (col.key === '_slaColor') {
                      const sla = row._slaColor;
                      return (
                        <TableCell key={col.key}>
                          <Badge variant="outline" className={`text-[10px] ${SLA_COLORS[sla]}`}>
                            {SLA_LABELS[sla]}
                          </Badge>
                        </TableCell>
                      );
                    }
                    if (col.key === '_diasInstalacao') {
                      return <TableCell key={col.key} className="font-mono">{row._diasInstalacao}</TableCell>;
                    }
                    return <TableCell key={col.key} className="whitespace-nowrap">{row[col.key] || '-'}</TableCell>;
                  })}
                </TableRow>
              ))}
              {filteredTable.length === 0 && (
                <TableRow>
                  <TableCell colSpan={VISIBLE_COLUMNS.length} className="text-center text-muted-foreground py-8">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
