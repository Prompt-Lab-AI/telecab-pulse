import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend,
} from 'recharts';
import {
  Target, BarChart3, Users, Wallet,
  TrendingUp, TrendingDown, Minus, ArrowRight,
  Trophy, AlertTriangle,
} from 'lucide-react';
import type { KPIs, PapRanking, Trend } from '@/lib/analytics';

const COLORS = [
  'hsl(215, 100%, 35%)', 'hsl(200, 80%, 45%)', 'hsl(190, 70%, 40%)',
  'hsl(170, 60%, 40%)', 'hsl(215, 60%, 55%)', 'hsl(230, 50%, 50%)',
];

// ========== TREND INDICATOR ==========

function TrendBadge({ trend, label }: { trend: Trend; label?: string }) {
  if (trend === 'up') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
      <TrendingUp className="h-3.5 w-3.5" /> {label || 'Melhora'}
    </span>
  );
  if (trend === 'down') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
      <TrendingDown className="h-3.5 w-3.5" /> {label || 'Piora'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> {label || 'Estável'}
    </span>
  );
}

// ========== EXECUTIVE KPI ==========

interface ExecKpiProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: Trend;
  accentClass?: string;
}

function ExecKpi({ title, value, subtitle, icon, trend, accentClass }: ExecKpiProps) {
  return (
    <Card className={`relative overflow-hidden border-none shadow-lg ${accentClass || 'bg-primary text-primary-foreground'}`}>
      <div className="absolute right-2 top-2 opacity-10">
        {icon}
      </div>
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{title}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] opacity-70">{subtitle}</span>
          <TrendBadge trend={trend} />
        </div>
      </CardContent>
    </Card>
  );
}

// ========== MAIN PANEL ==========

interface ExecutivePanelProps {
  kpis: KPIs;
  rankings: PapRanking[];
  vendasByDay: { data: string; vendas: number }[];
  funnelData: { etapa: string; valor: number }[];
  revenueByProduct: { produto: string; receita: number }[];
}

export function ExecutivePanel({ kpis, rankings, vendasByDay, funnelData, revenueByProduct }: ExecutivePanelProps) {
  // Trend logic (simplified — real comparison needs previous month data)
  const metaTrend: Trend = kpis.metaAtingida >= 80 ? 'up' : kpis.metaAtingida >= 50 ? 'stable' : 'down';
  const conversaoTrend: Trend = kpis.taxaConversao >= 70 ? 'up' : kpis.taxaConversao >= 50 ? 'stable' : 'down';
  const churnTrend: Trend = kpis.churn90d <= 3 ? 'up' : kpis.churn90d <= 5 ? 'stable' : 'down';
  const receitaTrend: Trend = kpis.mrrAtivo > 0 ? 'up' : 'stable';

  const top5 = useMemo(() => rankings.slice(0, 5), [rankings]);
  const bottom5 = useMemo(() => [...rankings].sort((a, b) => a.score - b.score).slice(0, 5), [rankings]);

  const papChartData = useMemo(() =>
    rankings.slice(0, 10).map(r => ({ pap: r.pap, vendas: r.vendasValidas, mrr: r.mrrAtivo })),
    [rankings]
  );

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ExecKpi
          title="Meta Atingida"
          value={kpis.metaMensal > 0 ? `${kpis.metaAtingida.toFixed(1)}%` : 'N/D'}
          subtitle={`${kpis.totalVendasValidas} de ${kpis.metaMensal}`}
          icon={<Target className="h-12 w-12" />}
          trend={metaTrend}
          accentClass="bg-primary text-primary-foreground"
        />
        <ExecKpi
          title="Conversão"
          value={kpis.vendasSubidas > 0 ? `${kpis.taxaConversao.toFixed(1)}%` : 'N/D'}
          subtitle={`${kpis.vendasInstaladas} / ${kpis.vendasSubidas}`}
          icon={<BarChart3 className="h-12 w-12" />}
          trend={conversaoTrend}
          accentClass="bg-primary text-primary-foreground"
        />
        <ExecKpi
          title="Churn 90d"
          value={`${kpis.churn90d.toFixed(1)}%`}
          subtitle={`${kpis.cancelamentos90d} cancelamentos`}
          icon={<Users className="h-12 w-12" />}
          trend={churnTrend}
          accentClass={kpis.churn90d > 5 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}
        />
        <ExecKpi
          title="Receita Ativa"
          value={`R$ ${kpis.mrrAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle={`${kpis.totalContratosAtivos} contratos`}
          icon={<Wallet className="h-12 w-12" />}
          trend={receitaTrend}
          accentClass="bg-primary text-primary-foreground"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sales Evolution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Evolução de Vendas</CardTitle>
              <TrendBadge trend={vendasByDay.length > 1 ? 'up' : 'stable'} label="vs mês anterior" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="hsl(215, 100%, 35%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(215, 100%, 35%)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Funil Comercial</CardTitle>
              <TrendBadge trend={conversaoTrend} label="conversão" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="etapa" type="category" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={['hsl(215, 100%, 35%)', 'hsl(150, 60%, 40%)', 'hsl(0, 70%, 50%)'][i % 3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue by Product */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Receita por Produto (MRR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByProduct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="produto" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => `R$ ${v.toFixed(2)}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                    {revenueByProduct.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PAP Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Comparativo de PAPs — Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={papChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="pap" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Legend />
                  <Bar dataKey="vendas" name="Vendas" fill="hsl(215, 100%, 35%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold text-foreground">Top 5 PAPs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {top5.map((r, i) => (
              <div key={r.pap} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.pap}</p>
                    <p className="text-[11px] text-muted-foreground">{r.vendasValidas} vendas • Ticket R$ {r.ticketMedio.toFixed(0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">R$ {r.mrrAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                  <Badge variant={r.churn90d <= 5 ? 'default' : 'destructive'} className="text-[10px]">
                    Churn {r.churn90d.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
            {top5.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem dados disponíveis</p>}
          </CardContent>
        </Card>

        {/* Bottom 5 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold text-foreground">PAPs — Atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {bottom5.map((r) => (
              <div key={r.pap} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.pap}</p>
                  <p className="text-[11px] text-muted-foreground">{r.vendasValidas} vendas • Score {r.score.toFixed(1)}</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="text-[10px]">
                    Churn {r.churn90d.toFixed(1)}%
                  </Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    MRR R$ {r.mrrAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
            {bottom5.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem dados disponíveis</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
