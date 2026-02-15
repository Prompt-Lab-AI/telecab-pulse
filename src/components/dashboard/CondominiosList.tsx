import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetRow } from '@/lib/sheets';
import {
  Building2, MapPin, CheckCircle2, AlertTriangle, XCircle, Eye,
  BarChart3, PieChart as PieChartIcon, Lightbulb,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props {
  data: SheetRow[];
}

type StatusCategory = 'liberado' | 'contato' | 'bloqueado' | 'indefinido';

function categorizeStatus(raw: string): StatusCategory {
  if (!raw || !raw.trim()) return 'indefinido';
  const s = raw.toLowerCase().trim();
  if (s.includes('liberado') || s.includes('negoci') || s.includes('ativo') || s.includes('aprovado'))
    return 'liberado';
  if (s.includes('contato') || s.includes('primeiro') || s.includes('pendente') || s.includes('agend'))
    return 'contato';
  if (s.includes('bloque') || s.includes('recus') || s.includes('negado') || s.includes('sem acesso'))
    return 'bloqueado';
  return 'indefinido';
}

const STATUS_CONFIG: Record<StatusCategory, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  liberado: { label: 'Liberado / Negociação', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  contato: { label: 'Primeiro Contato', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Eye },
  bloqueado: { label: 'Bloqueado / Recusado', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  indefinido: { label: 'Não Abordado', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border', icon: AlertTriangle },
};

const PIE_COLORS = ['hsl(150, 60%, 40%)', 'hsl(45, 90%, 50%)', 'hsl(0, 70%, 50%)', 'hsl(215, 20%, 65%)'];

export function CondominiosList({ data }: Props) {
  const [filterRegiao, setFilterRegiao] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerfil, setFilterPerfil] = useState('all');

  // Parse and enrich
  const condominios = useMemo(() => {
    return data.map(row => {
      const nome = row['nome do condomínio'] || row['nome'] || Object.values(row)[0] || '';
      const regiao = row['região / bairro'] || row['região'] || row['bairro'] || '';
      const perfil = row['perfil do público'] || row['perfil'] || '';
      const statusRaw = row['status da abordagem'] || row['status'] || '';
      const obs = row['observações'] || row['obs'] || '';
      return {
        nome: nome.trim(),
        regiao: regiao.trim() || 'Sem região',
        perfil: perfil.trim() || 'Não informado',
        statusRaw: statusRaw.trim(),
        status: categorizeStatus(statusRaw),
        obs: obs.trim(),
      };
    }).filter(c => c.nome);
  }, [data]);

  // Unique values for filters
  const regioes = useMemo(() => [...new Set(condominios.map(c => c.regiao))].sort(), [condominios]);
  const perfis = useMemo(() => [...new Set(condominios.map(c => c.perfil))].sort(), [condominios]);

  // Apply filters
  const filtered = useMemo(() => {
    return condominios.filter(c => {
      if (filterRegiao !== 'all' && c.regiao !== filterRegiao) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterPerfil !== 'all' && c.perfil !== filterPerfil) return false;
      return true;
    });
  }, [condominios, filterRegiao, filterStatus, filterPerfil]);

  // KPI counts
  const total = condominios.length;
  const countByStatus = useMemo(() => {
    const counts: Record<StatusCategory, number> = { liberado: 0, contato: 0, bloqueado: 0, indefinido: 0 };
    condominios.forEach(c => counts[c.status]++);
    return counts;
  }, [condominios]);

  const pctAbordados = total > 0 ? (((countByStatus.liberado + countByStatus.contato + countByStatus.bloqueado) / total) * 100) : 0;
  const pctNegociacao = total > 0 ? ((countByStatus.liberado / total) * 100) : 0;
  const pctBloqueados = total > 0 ? ((countByStatus.bloqueado / total) * 100) : 0;

  // Charts data
  const byRegiao = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { map[c.regiao] = (map[c.regiao] || 0) + 1; });
    return Object.entries(map).map(([regiao, qtd]) => ({ regiao, qtd })).sort((a, b) => b.qtd - a.qtd);
  }, [filtered]);

  const byStatusPie = useMemo(() => {
    const order: StatusCategory[] = ['liberado', 'contato', 'bloqueado', 'indefinido'];
    return order
      .map(s => ({ name: STATUS_CONFIG[s].label, value: filtered.filter(c => c.status === s).length }))
      .filter(d => d.value > 0);
  }, [filtered]);

  // Insights
  const insights = useMemo(() => {
    const msgs: string[] = [];
    const naoAbordados = condominios.filter(c => c.status === 'indefinido');
    if (naoAbordados.length > 0) {
      const regMap: Record<string, number> = {};
      naoAbordados.forEach(c => { regMap[c.regiao] = (regMap[c.regiao] || 0) + 1; });
      const topRegiao = Object.entries(regMap).sort((a, b) => b[1] - a[1])[0];
      if (topRegiao) {
        msgs.push(`"${topRegiao[0]}" concentra ${topRegiao[1]} condomínio(s) ainda não abordado(s). Priorizar ação comercial direcionada.`);
      }
    }
    if (countByStatus.bloqueado > 0) {
      msgs.push(`${countByStatus.bloqueado} condomínio(s) bloqueado(s)/recusado(s). Avaliar estratégia alternativa de abordagem.`);
    }
    if (pctNegociacao > 30) {
      msgs.push(`${pctNegociacao.toFixed(0)}% dos condomínios já em negociação — pipeline saudável.`);
    }
    if (msgs.length === 0) {
      msgs.push('Dados de status insuficientes. Preencher a coluna "Status da Abordagem" na planilha para habilitar insights.');
    }
    return msgs;
  }, [condominios, countByStatus, pctNegociacao]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiMini icon={Building2} label="Total Condomínios" value={String(total)} />
        <KpiMini icon={Eye} label="Já Abordados" value={`${pctAbordados.toFixed(0)}%`} sub={`${countByStatus.liberado + countByStatus.contato + countByStatus.bloqueado} de ${total}`} />
        <KpiMini icon={CheckCircle2} label="Em Negociação" value={`${pctNegociacao.toFixed(0)}%`} sub={`${countByStatus.liberado} cond.`} accent="emerald" />
        <KpiMini icon={XCircle} label="Bloqueados" value={`${pctBloqueados.toFixed(0)}%`} sub={`${countByStatus.bloqueado} cond.`} accent="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterRegiao} onValueChange={setFilterRegiao}>
          <SelectTrigger className="w-[170px] h-9 text-xs bg-card"><SelectValue placeholder="Região" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Regiões</SelectItem>
            {regioes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px] h-9 text-xs bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="liberado">Liberado / Negociação</SelectItem>
            <SelectItem value="contato">Primeiro Contato</SelectItem>
            <SelectItem value="bloqueado">Bloqueado / Recusado</SelectItem>
            <SelectItem value="indefinido">Não Abordado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPerfil} onValueChange={setFilterPerfil}>
          <SelectTrigger className="w-[170px] h-9 text-xs bg-card"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Perfis</SelectItem>
            {perfis.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length} de {total} condomínios</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c, i) => {
          const cfg = STATUS_CONFIG[c.status];
          const Icon = cfg.icon;
          return (
            <Card key={i} className={`border ${cfg.bg} transition-shadow hover:shadow-md`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{c.nome}</h4>
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {c.regiao}
                </div>
                <Badge variant="outline" className={`text-[10px] ${cfg.color} border-current`}>
                  {c.statusRaw || cfg.label}
                </Badge>
                {c.perfil !== 'Não informado' && (
                  <p className="text-[10px] text-muted-foreground">Perfil: {c.perfil}</p>
                )}
                {c.obs && <p className="text-[10px] text-muted-foreground italic truncate" title={c.obs}>{c.obs}</p>}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum condomínio encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar chart by region */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Condomínios por Região
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {byRegiao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegiao} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="regiao" type="category" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="qtd" fill="hsl(215, 100%, 35%)" radius={[0, 6, 6, 0]} name="Qtd" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados de região</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart by status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {byStatusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byStatusPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {byStatusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados de status</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Insights Automáticos</h4>
              {insights.map((msg, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {msg}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Detalhamento Operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Condomínio</TableHead>
                <TableHead className="font-semibold">Região</TableHead>
                <TableHead className="font-semibold">Perfil</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.regiao}</TableCell>
                    <TableCell>{c.perfil}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color} border-current`}>
                        {c.statusRaw || cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs" title={c.obs}>{c.obs || '—'}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum condomínio encontrado
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

/* Mini KPI card component */
function KpiMini({ icon: Icon, label, value, sub, accent }: {
  icon: typeof Building2; label: string; value: string; sub?: string; accent?: 'emerald' | 'red';
}) {
  const accentColor = accent === 'emerald' ? 'text-emerald-600' : accent === 'red' ? 'text-red-600' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`text-lg font-bold ${accentColor}`}>{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
