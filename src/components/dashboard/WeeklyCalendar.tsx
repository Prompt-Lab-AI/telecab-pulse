import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetRow } from '@/lib/sheets';
import {
  Users, MapPin, CalendarDays, AlertTriangle, Lightbulb,
  BarChart3, Megaphone, Expand, PartyPopper, User,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: SheetRow[];
}

interface DaySchedule {
  data: string;
  mes: string;
  diaSemana: string;
  acao: string;
  assignments: { vendedor: string; local: string }[];
}

const WEEKDAYS = ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado', 'Domingo'];
const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Known non-vendedor columns
const SKIP_KEYS = new Set(['data', 'mês', 'mes', 'dia da semana', 'ação / bairro', 'acao / bairro', 'ação/bairro']);

function getActionIcon(acao: string) {
  const a = acao.toLowerCase();
  if (a.includes('panflet') || a.includes('expansão') || a.includes('expansao')) return Megaphone;
  if (a.includes('evento') || a.includes('carnaval') || a.includes('saúde')) return PartyPopper;
  return Expand;
}

function getWeekNumber(dateStr: string): string {
  if (!dateStr || !dateStr.includes('/')) return '';
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const startOfYear = new Date(y, 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const week = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
  return `Semana ${week}`;
}

export function WeeklyCalendar({ data }: Props) {
  const [filterVendedor, setFilterVendedor] = useState('all');
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterSemana, setFilterSemana] = useState('all');

  // Parse schedule data
  const { days, vendedores } = useMemo(() => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const vendedorKeys = headers.filter(h => !SKIP_KEYS.has(h.toLowerCase()));

    const parsedDays: DaySchedule[] = data
      .filter(row => {
        const dt = row['data'] || '';
        return dt.includes('/');
      })
      .map(row => {
        const dataStr = row['data'] || '';
        const mes = row['mês'] || row['mes'] || '';
        const diaSemana = row['dia da semana'] || '';
        const acao = row['ação / bairro'] || row['acao / bairro'] || row['ação/bairro'] || '';
        const assignments = vendedorKeys
          .map(k => ({ vendedor: k, local: (row[k] || '').trim() }))
          .filter(a => a.local);
        return { data: dataStr, mes, diaSemana, acao, assignments };
      })
      .filter(d => d.assignments.length > 0);

    return { days: parsedDays, vendedores: vendedorKeys };
  }, [data]);

  // Unique values
  const semanas = useMemo(() => [...new Set(days.map(d => getWeekNumber(d.data)).filter(Boolean))], [days]);
  const cidades = useMemo(() => {
    const all = new Set<string>();
    days.forEach(d => d.assignments.forEach(a => all.add(a.local)));
    return [...all].sort();
  }, [days]);

  // Filtered
  const filtered = useMemo(() => {
    return days.filter(d => {
      if (filterSemana !== 'all' && getWeekNumber(d.data) !== filterSemana) return false;
      if (filterVendedor !== 'all') {
        const has = d.assignments.some(a => a.vendedor === filterVendedor);
        if (!has) return false;
      }
      if (filterCidade !== 'all') {
        const has = d.assignments.some(a => a.local.includes(filterCidade));
        if (!has) return false;
      }
      return true;
    });
  }, [days, filterSemana, filterVendedor, filterCidade]);

  // KPIs
  const vendedoresEmCampo = useMemo(() => {
    const vSet = new Set<string>();
    filtered.forEach(d => d.assignments.forEach(a => vSet.add(a.vendedor)));
    return vSet.size;
  }, [filtered]);

  const cidadesCobertas = useMemo(() => {
    const cSet = new Set<string>();
    filtered.forEach(d => d.assignments.forEach(a => cSet.add(a.local)));
    return cSet.size;
  }, [filtered]);

  const diasSemCobertura = useMemo(() => {
    const weekdaysInRange = new Set(WEEKDAYS.slice(0, 6)); // Seg-Sab
    const coveredDays = new Set(filtered.map(d => d.diaSemana));
    return [...weekdaysInRange].filter(w => !coveredDays.has(w)).length;
  }, [filtered]);

  // Group by weekday for calendar view
  const calendarGrid = useMemo(() => {
    const grid: Record<string, DaySchedule[]> = {};
    WEEKDAYS.forEach(w => { grid[w] = []; });
    filtered.forEach(d => {
      if (grid[d.diaSemana]) grid[d.diaSemana].push(d);
    });
    return grid;
  }, [filtered]);

  // Charts
  const vendedoresByCidade = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    filtered.forEach(d => d.assignments.forEach(a => {
      if (!map[a.local]) map[a.local] = new Set();
      map[a.local].add(a.vendedor);
    }));
    return Object.entries(map)
      .map(([cidade, vSet]) => ({ cidade, vendedores: vSet.size }))
      .sort((a, b) => b.vendedores - a.vendedores)
      .slice(0, 12);
  }, [filtered]);

  // Alerts
  const alerts = useMemo(() => {
    const msgs: { type: 'error' | 'warning'; text: string }[] = [];

    // Days without coverage
    if (diasSemCobertura > 0) {
      msgs.push({ type: 'error', text: `${diasSemCobertura} dia(s) útil(eis) sem cobertura no período filtrado.` });
    }

    // Cities with only 1 vendedor
    const cityVendedorCount: Record<string, Set<string>> = {};
    filtered.forEach(d => d.assignments.forEach(a => {
      if (!cityVendedorCount[a.local]) cityVendedorCount[a.local] = new Set();
      cityVendedorCount[a.local].add(a.vendedor);
    }));
    const singleVendorCities = Object.entries(cityVendedorCount).filter(([, s]) => s.size === 1);
    if (singleVendorCities.length > 0) {
      msgs.push({ type: 'warning', text: `${singleVendorCities.length} cidade(s) com apenas 1 vendedor: ${singleVendorCities.slice(0, 3).map(([c]) => c).join(', ')}${singleVendorCities.length > 3 ? '...' : ''}.` });
    }

    // Vendedor with excessive travel (many different cities)
    const vendedorCities: Record<string, Set<string>> = {};
    filtered.forEach(d => d.assignments.forEach(a => {
      if (!vendedorCities[a.vendedor]) vendedorCities[a.vendedor] = new Set();
      vendedorCities[a.vendedor].add(a.local);
    }));
    Object.entries(vendedorCities).forEach(([v, cities]) => {
      if (cities.size > 4) {
        msgs.push({ type: 'warning', text: `${v} alocado em ${cities.size} locais diferentes — verificar deslocamento excessivo.` });
      }
    });

    return msgs;
  }, [filtered, diasSemCobertura]);

  // Insights
  const insights = useMemo(() => {
    const msgs: string[] = [];
    if (filtered.length > 0) {
      const vendedorDays: Record<string, number> = {};
      filtered.forEach(d => d.assignments.forEach(a => {
        vendedorDays[a.vendedor] = (vendedorDays[a.vendedor] || 0) + 1;
      }));
      const topVendedor = Object.entries(vendedorDays).sort((a, b) => b[1] - a[1])[0];
      if (topVendedor) msgs.push(`${topVendedor[0]} possui maior presença em campo com ${topVendedor[1]} dia(s) programado(s).`);
    }
    if (cidadesCobertas > 0) msgs.push(`${cidadesCobertas} localidade(s) coberta(s) no período. Avaliar se há regiões sem atendimento.`);
    if (msgs.length === 0) msgs.push('Sem dados de programação disponíveis. Preencher a aba PROGRAMAÇÃO_SEMANAL na planilha.');
    return msgs;
  }, [filtered, cidadesCobertas]);

  // Vendedor color palette
  const vendedorColors = useMemo(() => {
    const palette = [
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-emerald-100 text-emerald-800 border-emerald-300',
      'bg-purple-100 text-purple-800 border-purple-300',
      'bg-amber-100 text-amber-800 border-amber-300',
      'bg-pink-100 text-pink-800 border-pink-300',
      'bg-cyan-100 text-cyan-800 border-cyan-300',
    ];
    const map: Record<string, string> = {};
    vendedores.forEach((v, i) => { map[v] = palette[i % palette.length]; });
    return map;
  }, [vendedores]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniKpi icon={Users} label="Vendedores em Campo" value={String(vendedoresEmCampo)} />
        <MiniKpi icon={MapPin} label="Cidades Cobertas" value={String(cidadesCobertas)} />
        <MiniKpi icon={AlertTriangle} label="Dias Sem Cobertura" value={String(diasSemCobertura)} accent={diasSemCobertura > 0 ? 'red' : 'emerald'} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterSemana} onValueChange={setFilterSemana}>
          <SelectTrigger className="w-[150px] h-9 text-xs bg-card"><SelectValue placeholder="Semana" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Semanas</SelectItem>
            {semanas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterVendedor} onValueChange={setFilterVendedor}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Vendedores</SelectItem>
            {vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCidade} onValueChange={setFilterCidade}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-card"><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cidades.slice(0, 50).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length} dia(s)</span>
      </div>

      {/* Weekly Calendar Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Agenda Semanal de Campo
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {WEEKDAYS.map((weekday, wIdx) => {
              const dayEntries = calendarGrid[weekday] || [];
              const hasCoverage = dayEntries.length > 0;
              return (
                <div key={weekday} className="space-y-1.5">
                  {/* Day header */}
                  <div className={`text-center text-[11px] font-bold py-1.5 rounded-t-lg ${
                    hasCoverage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {WEEKDAYS_SHORT[wIdx]}
                  </div>

                  {/* Day content */}
                  <div className={`min-h-[120px] rounded-b-lg border p-1.5 space-y-1 ${
                    hasCoverage ? 'bg-card border-border' : 'bg-destructive/5 border-destructive/20'
                  }`}>
                    {dayEntries.length === 0 && (
                      <div className="flex items-center justify-center h-full text-[9px] text-muted-foreground">
                        Sem programação
                      </div>
                    )}
                    {dayEntries.map((day, dIdx) => (
                      <div key={dIdx} className="space-y-0.5">
                        <div className="text-[9px] text-muted-foreground text-center">{day.data}</div>
                        {day.assignments
                          .filter(a => filterVendedor === 'all' || a.vendedor === filterVendedor)
                          .map((a, aIdx) => (
                          <div key={aIdx} className={`rounded border px-1.5 py-1 ${vendedorColors[a.vendedor] || 'bg-muted'}`}>
                            <div className="text-[10px] font-semibold flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />
                              {a.vendedor}
                            </div>
                            <div className="text-[9px] opacity-80 truncate" title={a.local}>{a.local}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Alertas Operacionais</h4>
                {alerts.map((a, i) => (
                  <p key={i} className={`text-xs ${a.type === 'error' ? 'text-destructive' : 'text-amber-700'}`}>
                    • {a.text}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts + Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Vendedores por Localidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {vendedoresByCidade.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendedoresByCidade} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="cidade" type="category" tick={{ fontSize: 9 }} width={140} />
                    <Tooltip />
                    <Bar dataKey="vendedores" fill="hsl(215, 100%, 35%)" radius={[0, 6, 6, 0]} name="Vendedores" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 h-full">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Insights Operacionais</h4>
                {insights.map((msg, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {msg}</p>
                ))}
                {/* Vendedor legend */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {vendedores.map(v => (
                    <Badge key={v} variant="outline" className={`text-[10px] ${vendedorColors[v]}`}>{v}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Detalhamento da Programação
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Dia</TableHead>
                {vendedores.map(v => (
                  <TableHead key={v} className="font-semibold text-xs">{v}</TableHead>
                ))}
                <TableHead className="font-semibold">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs whitespace-nowrap">{d.data}</TableCell>
                  <TableCell className="text-xs">{d.diaSemana}</TableCell>
                  {vendedores.map(v => {
                    const assign = d.assignments.find(a => a.vendedor === v);
                    return (
                      <TableCell key={v} className="text-xs">
                        {assign ? (
                          <Badge variant="outline" className={`text-[10px] ${vendedorColors[v]}`}>
                            {assign.local}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-xs max-w-[150px] truncate" title={d.acao}>{d.acao || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={vendedores.length + 3} className="text-center text-muted-foreground py-8">
                    Nenhuma programação encontrada
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
  icon: typeof Users; label: string; value: string; accent?: 'red' | 'emerald';
}) {
  const accentColor = accent === 'red' ? 'text-destructive' : accent === 'emerald' ? 'text-emerald-600' : 'text-primary';
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
