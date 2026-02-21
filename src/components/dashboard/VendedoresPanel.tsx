import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, ShoppingCart, XCircle, TrendingDown, Search,
  CheckCircle, AlertTriangle, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { isVendaValida, isCancelamento90d, isContratoAtivo } from '@/lib/analytics';
import { parseCurrency, type SheetRow } from '@/lib/sheets';

interface VendedoresPanelProps {
  data: SheetRow[];
}

interface VendorStats {
  pap: string;
  vendasValidas: number;
  cancelamentos: number;
  ticketMedio: number;
  mrr: number;
  performance: 'bom' | 'atencao' | 'critico';
}

function computeVendorStats(data: SheetRow[]): VendorStats[] {
  const paps = [...new Set(data.map(r => r['pap']).filter(Boolean))];

  const stats = paps.map(pap => {
    const rows = data.filter(r => r['pap'] === pap);
    const vendasValidas = rows.filter(isVendaValida).length;
    const cancelamentos = rows.filter(isCancelamento90d).length;
    const ativos = rows.filter(isContratoAtivo);
    const receita = ativos.reduce((s, r) => s + parseCurrency(r['valor mensal'] || ''), 0);
    const ticketMedio = ativos.length > 0 ? receita / ativos.length : 0;

    let performance: 'bom' | 'atencao' | 'critico' = 'bom';
    if (vendasValidas === 0 || cancelamentos > vendasValidas * 0.3) performance = 'critico';
    else if (cancelamentos > vendasValidas * 0.15 || ticketMedio < 50) performance = 'atencao';

    return { pap, vendasValidas, cancelamentos, ticketMedio, mrr: receita, performance };
  });

  return stats.sort((a, b) => b.vendasValidas - a.vendasValidas);
}

const perfBadge = {
  bom: { label: 'Bom', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  atencao: { label: 'Atenção', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  critico: { label: 'Crítico', class: 'bg-red-100 text-red-700 border-red-200' },
};

const CHART_COLORS = { vendas: 'hsl(142, 71%, 45%)', cancelamentos: 'hsl(0, 84%, 60%)' };

export function VendedoresPanel({ data }: VendedoresPanelProps) {
  const [search, setSearch] = useState('');

  const allStats = useMemo(() => computeVendorStats(data), [data]);

  const stats = useMemo(
    () => search
      ? allStats.filter(s => s.pap.toLowerCase().includes(search.toLowerCase()))
      : allStats,
    [allStats, search],
  );

  const totalVendedores = allStats.length;
  const totalVendas = allStats.reduce((s, v) => s + v.vendasValidas, 0);
  const totalCanc = allStats.reduce((s, v) => s + v.cancelamentos, 0);
  const taxaCanc = totalVendas > 0 ? (totalCanc / totalVendas) * 100 : 0;

  const chartData = stats.map(s => ({
    name: s.pap.length > 12 ? s.pap.slice(0, 12) + '…' : s.pap,
    'Vendas Válidas': s.vendasValidas,
    'Cancelamentos': s.cancelamentos,
  }));

  // Detailed table rows
  const tableRows = useMemo(() => {
    const filtered = search
      ? data.filter(r => (r['pap'] || '').toLowerCase().includes(search.toLowerCase()))
      : data;
    return filtered.slice(0, 200);
  }, [data, search]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiMini icon={<Users className="h-5 w-5" />} label="Vendedores Ativos" value={totalVendedores} />
        <KpiMini icon={<ShoppingCart className="h-5 w-5" />} label="Vendas Válidas" value={totalVendas} accent="emerald" />
        <KpiMini icon={<XCircle className="h-5 w-5" />} label="Cancelamentos" value={totalCanc} accent="red" />
        <KpiMini icon={<TrendingDown className="h-5 w-5" />} label="Taxa Cancelamento" value={`${taxaCanc.toFixed(1)}%`} accent={taxaCanc > 10 ? 'red' : 'muted'} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar vendedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Vendas vs Cancelamentos por Vendedor</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="Vendas Válidas" fill={CHART_COLORS.vendas} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cancelamentos" fill={CHART_COLORS.cancelamentos} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Vendor cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map(v => {
          const badge = perfBadge[v.performance];
          const PerfIcon = v.performance === 'bom' ? CheckCircle : v.performance === 'atencao' ? AlertTriangle : AlertCircle;
          return (
            <Card key={v.pap} className="relative overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">{v.pap}</p>
                  <Badge variant="outline" className={`text-[10px] ${badge.class}`}>
                    <PerfIcon className="mr-1 h-3 w-3" />
                    {badge.label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Vendas" value={v.vendasValidas} color="text-emerald-600" />
                  <Stat label="Cancelamentos" value={v.cancelamentos} color="text-red-500" />
                  <Stat label="Ticket Médio" value={`R$ ${v.ticketMedio.toFixed(2)}`} />
                  <Stat label="MRR" value={`R$ ${v.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {stats.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">
            Nenhum vendedor encontrado.
          </p>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Detalhamento de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PAP</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Data Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r['pap']}</TableCell>
                  <TableCell>{r['cliente'] || r['nome'] || '-'}</TableCell>
                  <TableCell>{r['produto'] || '-'}</TableCell>
                  <TableCell>{r['cidade'] || '-'}</TableCell>
                  <TableCell>{r['data da venda'] || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${r['status']?.toLowerCase() === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {r['status'] || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{r['valor mensal'] || '-'}</TableCell>
                </TableRow>
              ))}
              {tableRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem dados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* Mini KPI card */
function KpiMini({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600',
    red: 'text-red-500',
    muted: 'text-muted-foreground',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-muted p-2">{icon}</div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${accent ? colorMap[accent] || '' : ''}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* Stat line */
function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className={`font-semibold ${color || ''}`}>{value}</p>
    </div>
  );
}
