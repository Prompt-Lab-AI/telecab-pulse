import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetRow } from '@/lib/sheets';
import {
  CalendarDays, MapPin, PartyPopper, Music, Church, Flag,
  Trophy, Lightbulb, BarChart3, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props {
  data: SheetRow[];
}

interface EventData {
  mes: string;
  mesIdx: number;
  cidade: string;
  evento: string;
  periodo: string;
  parceiro: string;
  acaoComercial: string;
  tipo: EventType;
  intensidade: 'alta' | 'media' | 'baixa';
}

type EventType = 'festa' | 'esporte' | 'cultura' | 'religioso' | 'politico' | 'outro';

const MESES_ORDER: Record<string, number> = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
  'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
};
const MESES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function classifyEvent(evento: string): EventType {
  const e = evento.toLowerCase();
  if (e.includes('padroei') || e.includes('santo') || e.includes('são') || e.includes('nossa senhora') || e.includes('festa de reis') || e.includes('paixão') || e.includes('paróquia'))
    return 'religioso';
  if (e.includes('emancipação') || e.includes('politica') || e.includes('política'))
    return 'politico';
  if (e.includes('vaquejada') || e.includes('copa') || e.includes('torneio') || e.includes('campeonato') || e.includes('corrida') || e.includes('futsal') || e.includes('volei') || e.includes('motocicl') || e.includes('moto fest') || e.includes('cavalg'))
    return 'esporte';
  if (e.includes('carnaval') || e.includes('folia') || e.includes('junin') || e.includes('são joão') || e.includes('quadrilh') || e.includes('arraiá') || e.includes('bloco') || e.includes('festival'))
    return 'festa';
  if (e.includes('feira') || e.includes('mostra') || e.includes('gastronom') || e.includes('livro') || e.includes('cultural') || e.includes('artesanato'))
    return 'cultura';
  return 'outro';
}

function getIntensidade(evento: string, periodo: string): 'alta' | 'media' | 'baixa' {
  const e = evento.toLowerCase();
  if (e.includes('carnaval') || e.includes('são joão') || e.includes('junin') || e.includes('folia') || e.includes('vaquejada') || e.includes('festival'))
    return 'alta';
  if (e.includes('padroei') || e.includes('emancipação') || e.includes('feira') || e.includes('copa') || e.includes('campeonato'))
    return 'media';
  return 'baixa';
}

function generateSuggestion(ev: EventData): string {
  if (ev.acaoComercial) return ev.acaoComercial;
  switch (ev.tipo) {
    case 'festa': return 'Montar stand/barraca no evento. Distribuir brindes e oferecer promoções exclusivas.';
    case 'esporte': return 'Patrocinar evento com banner. Oferecer degustação de internet rápida no local.';
    case 'religioso': return 'Ação corpo-a-corpo nas proximidades. Panfletagem e oferta especial pós-festa.';
    case 'politico': return 'Presença institucional. Networking com lideranças e divulgação local.';
    case 'cultura': return 'Participação como expositor. Promoção cultural com desconto especial.';
    default: return 'Avaliar presença comercial com equipe local.';
  }
}

const TYPE_CONFIG: Record<EventType, { icon: typeof PartyPopper; color: string; label: string }> = {
  festa: { icon: PartyPopper, color: 'text-pink-600', label: 'Festa' },
  esporte: { icon: Trophy, color: 'text-blue-600', label: 'Esporte' },
  cultura: { icon: Music, color: 'text-purple-600', label: 'Cultura' },
  religioso: { icon: Church, color: 'text-amber-700', label: 'Religioso' },
  politico: { icon: Flag, color: 'text-emerald-700', label: 'Político' },
  outro: { icon: CalendarDays, color: 'text-muted-foreground', label: 'Outro' },
};

const INTENSITY_CONFIG = {
  alta: { label: 'Alta', bg: 'bg-red-100 text-red-800 border-red-300' },
  media: { label: 'Média', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  baixa: { label: 'Baixa', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

const PIE_COLORS = ['hsl(340, 70%, 55%)', 'hsl(215, 70%, 50%)', 'hsl(275, 60%, 55%)', 'hsl(35, 80%, 50%)', 'hsl(150, 60%, 40%)', 'hsl(215, 20%, 65%)'];

export function CommemorativeDates({ data }: Props) {
  const [filterMes, setFilterMes] = useState('all');
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');

  // Parse events, propagating month from the first column
  const events = useMemo(() => {
    const result: EventData[] = [];
    let currentMes = '';
    data.forEach(row => {
      const mesRaw = row['mês'] || row['mes'] || '';
      const cidade = row['cidade'] || '';
      const evento = row['evento'] || '';
      const periodo = row['data/periodo'] || row['data/período'] || row['periodo'] || '';
      const parceiro = row['parceiro'] || '';
      const acao = row['sugestão de ação comercial'] || row['sugestao de acao comercial'] || '';

      if (mesRaw.trim()) currentMes = mesRaw.trim().replace(/^"|"$/g, '');
      if (!evento.trim() && !cidade.trim()) return;

      const mesNorm = currentMes.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const mesIdx = MESES_ORDER[mesNorm] ?? -1;
      const tipo = classifyEvent(evento);

      result.push({
        mes: currentMes,
        mesIdx,
        cidade: cidade.trim(),
        evento: evento.trim(),
        periodo: periodo.trim(),
        parceiro: parceiro.trim(),
        acaoComercial: acao.trim(),
        tipo,
        intensidade: getIntensidade(evento, periodo),
      });
    });
    return result.filter(e => e.evento);
  }, [data]);

  // Filter values
  const cidades = useMemo(() => [...new Set(events.map(e => e.cidade).filter(Boolean))].sort(), [events]);
  const tipos: EventType[] = ['festa', 'esporte', 'cultura', 'religioso', 'politico', 'outro'];

  // Filtered
  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filterMes !== 'all' && e.mesIdx !== Number(filterMes)) return false;
      if (filterCidade !== 'all' && e.cidade !== filterCidade) return false;
      if (filterTipo !== 'all' && e.tipo !== filterTipo) return false;
      return true;
    });
  }, [events, filterMes, filterCidade, filterTipo]);

  // Charts
  const byCity = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => { if (e.cidade) map[e.cidade] = (map[e.cidade] || 0) + 1; });
    return Object.entries(map).map(([cidade, qtd]) => ({ cidade, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 15);
  }, [filtered]);

  const byMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    filtered.forEach(e => { if (e.mesIdx >= 0) counts[e.mesIdx]++; });
    return counts.map((qtd, i) => ({ mes: MESES_LABELS[i], qtd }));
  }, [filtered]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => { map[e.tipo] = (map[e.tipo] || 0) + 1; });
    return Object.entries(map).map(([tipo, value]) => ({
      name: TYPE_CONFIG[tipo as EventType]?.label || tipo,
      value,
    })).filter(d => d.value > 0);
  }, [filtered]);

  // Events grouped by month for timeline
  const groupedByMonth = useMemo(() => {
    const groups: Record<number, EventData[]> = {};
    filtered.forEach(e => {
      if (e.mesIdx >= 0) {
        if (!groups[e.mesIdx]) groups[e.mesIdx] = [];
        groups[e.mesIdx].push(e);
      }
    });
    return groups;
  }, [filtered]);

  // Insights
  const insights = useMemo(() => {
    const msgs: string[] = [];
    const monthCounts = new Array(12).fill(0);
    events.forEach(e => { if (e.mesIdx >= 0) monthCounts[e.mesIdx]++; });
    const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
    if (monthCounts[maxMonth] > 0) {
      msgs.push(`${MESES_FULL[maxMonth]} concentra o maior volume de eventos (${monthCounts[maxMonth]}). Recomendada presença de equipe dedicada.`);
    }
    const altaCount = events.filter(e => e.intensidade === 'alta').length;
    if (altaCount > 0) {
      msgs.push(`${altaCount} evento(s) classificado(s) como alta oportunidade comercial. Priorizar alocação de recursos.`);
    }
    const cityCounts: Record<string, number> = {};
    events.forEach(e => { if (e.cidade) cityCounts[e.cidade] = (cityCounts[e.cidade] || 0) + 1; });
    const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCity) {
      msgs.push(`"${topCity[0]}" possui ${topCity[1]} eventos cadastrados — cidade com maior potencial de presença contínua.`);
    }
    if (msgs.length === 0) msgs.push('Sem dados suficientes para gerar insights.');
    return msgs;
  }, [events]);

  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniKpi icon={CalendarDays} label="Total de Eventos" value={String(events.length)} />
        <MiniKpi icon={MapPin} label="Cidades Cobertas" value={String(new Set(events.map(e => e.cidade).filter(Boolean)).size)} />
        <MiniKpi icon={PartyPopper} label="Alta Oportunidade" value={String(events.filter(e => e.intensidade === 'alta').length)} accent="red" />
        <MiniKpi icon={Calendar} label="Eventos Este Mês" value={String(events.filter(e => e.mesIdx === currentMonth).length)} accent="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[150px] h-9 text-xs bg-card"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {MESES_FULL.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCidade} onValueChange={setFilterCidade}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-card"><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length} evento(s)</span>
      </div>

      {/* Monthly Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Calendário Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[900px]">
            {MESES_FULL.map((mes, idx) => {
              const monthEvents = groupedByMonth[idx] || [];
              const isCurrentMonth = idx === currentMonth;
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[100px] rounded-lg border p-2 transition-colors ${
                    isCurrentMonth ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className={`text-[11px] font-bold text-center mb-1.5 ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground'}`}>
                    {MESES_LABELS[idx]}
                  </div>
                  <div className="text-center text-lg font-bold text-foreground">{monthEvents.length}</div>
                  <div className="text-[9px] text-center text-muted-foreground">evento(s)</div>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-0.5">
                    {monthEvents.slice(0, 5).map((e, i) => {
                      const cfg = TYPE_CONFIG[e.tipo];
                      return <div key={i} className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`} title={e.evento} />;
                    })}
                    {monthEvents.length > 5 && <span className="text-[8px] text-muted-foreground">+{monthEvents.length - 5}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, 40).map((ev, i) => {
          const typeCfg = TYPE_CONFIG[ev.tipo];
          const intCfg = INTENSITY_CONFIG[ev.intensidade];
          const Icon = typeCfg.icon;
          return (
            <Card key={i} className="border hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{ev.evento}</h4>
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${typeCfg.color}`} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {ev.cidade || 'Sem cidade'}
                </div>
                {ev.periodo && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {ev.periodo}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${typeCfg.color} border-current`}>
                    {typeCfg.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${intCfg.bg}`}>
                    {intCfg.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  💡 {generateSuggestion(ev)}
                </p>
                {ev.parceiro && <p className="text-[10px] text-muted-foreground">📞 {ev.parceiro}</p>}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length > 40 && (
          <div className="col-span-full text-center text-xs text-muted-foreground py-2">
            Mostrando 40 de {filtered.length} eventos. Use os filtros para refinar.
          </div>
        )}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum evento encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Eventos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="hsl(215, 100%, 35%)" radius={[6, 6, 0, 0]} name="Eventos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Top Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {byCity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="cidade" type="category" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="qtd" fill="hsl(200, 70%, 45%)" radius={[0, 6, 6, 0]} name="Eventos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Por Tipo de Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {byType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byType} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
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
              <h4 className="text-sm font-semibold text-foreground">Insights Comerciais</h4>
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
            <CalendarDays className="h-4 w-4" /> Detalhamento de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Mês</TableHead>
                <TableHead className="font-semibold">Cidade</TableHead>
                <TableHead className="font-semibold">Evento</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Oportunidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((ev, i) => {
                const typeCfg = TYPE_CONFIG[ev.tipo];
                const intCfg = INTENSITY_CONFIG[ev.intensidade];
                return (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{ev.mes}</TableCell>
                    <TableCell className="text-xs">{ev.cidade}</TableCell>
                    <TableCell className="text-xs font-medium">{ev.evento}</TableCell>
                    <TableCell className="text-xs">{ev.periodo || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${typeCfg.color} border-current`}>
                        {typeCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${intCfg.bg}`}>
                        {intCfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum evento encontrado
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

function MiniKpi({ icon: Icon, label, value, accent }: {
  icon: typeof CalendarDays; label: string; value: string; accent?: 'red' | 'emerald';
}) {
  const accentColor = accent === 'red' ? 'text-red-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`text-lg font-bold ${accentColor}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
