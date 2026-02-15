import { useState, useMemo } from 'react';
import { useSheetsData } from '@/hooks/useSheetsData';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { MonthlyEvolutionChart, FunnelStageChart, SalesByProductChart } from '@/components/dashboard/Charts';
import { Filters } from '@/components/dashboard/Filters';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { CommemorativeDates } from '@/components/dashboard/CommemorativeDates';
import { CondominiosList } from '@/components/dashboard/CondominiosList';
import { exportToExcel } from '@/lib/export';
import { num, str, SheetRow } from '@/lib/sheets';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    baseUnica, visaoMensal, esteiraMensal, baseDados,
    programacaoSemanal, datasComemoativas, acompCondominios,
    loading, lastUpdate, refetch,
  } = useSheetsData();

  const [filters, setFilters] = useState<Record<string, string>>({});

  // Detect columns from baseUnica headers
  const baseHeaders = baseUnica.length > 0 ? Object.keys(baseUnica[0]) : [];
  const papKey = baseHeaders.find(h => /pap|vendedor|nome/i.test(h)) || baseHeaders[0] || '';
  const cidadeKey = baseHeaders.find(h => /cidade|city|localidade/i.test(h)) || '';
  const statusKey = baseHeaders.find(h => /status|ativo|situacao/i.test(h)) || '';

  // Filter options
  const filterOptions = useMemo(() => {
    const opts: { key: string; label: string; values: string[] }[] = [];
    if (papKey) opts.push({ key: 'pap', label: 'Todos PAPs', values: [...new Set(baseUnica.map(r => r[papKey]).filter(Boolean))].sort() });
    if (cidadeKey) opts.push({ key: 'cidade', label: 'Todas Cidades', values: [...new Set(baseUnica.map(r => r[cidadeKey]).filter(Boolean))].sort() });
    if (statusKey) opts.push({ key: 'status', label: 'Todos Status', values: [...new Set(baseUnica.map(r => r[statusKey]).filter(Boolean))].sort() });
    return opts;
  }, [baseUnica, papKey, cidadeKey, statusKey]);

  // Filtered base data
  const filteredBase = useMemo(() => {
    let d = baseUnica;
    if (filters.pap && filters.pap !== 'all') d = d.filter(r => r[papKey] === filters.pap);
    if (filters.cidade && filters.cidade !== 'all') d = d.filter(r => r[cidadeKey] === filters.cidade);
    if (filters.status && filters.status !== 'all') d = d.filter(r => r[statusKey] === filters.status);
    return d;
  }, [baseUnica, filters, papKey, cidadeKey, statusKey]);

  // KPI calculations from baseUnica
  const kpis = useMemo(() => {
    const totalRows = filteredBase.length;
    const vendaKeys = baseHeaders.filter(h => /venda|vendas|sold/i.test(h));
    const visitaKeys = baseHeaders.filter(h => /visita|visit/i.test(h));
    const valorKeys = baseHeaders.filter(h => /valor|total|receita|ticket/i.test(h));
    const metaKeys = baseHeaders.filter(h => /meta/i.test(h));
    const instaladoKeys = baseHeaders.filter(h => /instalad|install/i.test(h));
    const churnKeys = baseHeaders.filter(h => /churn/i.test(h));

    let totalVendas = 0, totalVisitas = 0, totalValor = 0, totalMeta = 0, totalInstalado = 0, totalChurn = 0;
    filteredBase.forEach(r => {
      totalVendas += num(r, ...vendaKeys);
      totalVisitas += num(r, ...visitaKeys);
      totalValor += num(r, ...valorKeys);
      totalMeta += num(r, ...metaKeys);
      totalInstalado += num(r, ...instaladoKeys);
      totalChurn += num(r, ...churnKeys);
    });

    const metaPercent = totalMeta > 0 ? (totalVendas / totalMeta) * 100 : 0;
    const conversao = totalVisitas > 0 ? (totalVendas / totalVisitas) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;

    return { totalVendas, totalVisitas, totalValor, metaPercent, conversao, ticketMedio, totalInstalado, totalChurn, totalMeta };
  }, [filteredBase, baseHeaders]);

  // Table columns from baseUnica
  const tableColumns = useMemo(() => {
    return baseHeaders.slice(0, 10).map(h => ({
      key: h,
      label: h.charAt(0).toUpperCase() + h.slice(1),
    }));
  }, [baseHeaders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-80" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-primary px-4 py-3 text-primary-foreground shadow-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight md:text-xl">
              📊 Acompanhamento Entrega PAPs
            </h1>
            <p className="text-xs opacity-80">Telecab — Painel do Supervisor</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <Filters
          filterOptions={filterOptions}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          onExport={() => exportToExcel(filteredBase, 'base-unica')}
          onRefresh={refetch}
          lastUpdate={lastUpdate}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            title="Meta Atingida"
            value={`${kpis.metaPercent.toFixed(1)}%`}
            subtitle={`${kpis.totalVendas} / ${kpis.totalMeta} vendas`}
            icon="target"
            trend={kpis.metaPercent >= 80 ? 'up' : 'down'}
          />
          <KpiCard
            title="Taxa de Conversão"
            value={`${kpis.conversao.toFixed(1)}%`}
            subtitle={`${kpis.totalVendas} vendas / ${kpis.totalVisitas} visitas`}
            icon="conversion"
            trend={kpis.conversao >= 25 ? 'up' : 'down'}
          />
          <KpiCard
            title="Churn 90 dias"
            value={`${kpis.totalChurn}`}
            subtitle="Clientes perdidos"
            icon="churn"
            trend={kpis.totalChurn === 0 ? 'up' : 'down'}
          />
          <KpiCard
            title="Ticket Médio"
            value={`R$ ${kpis.ticketMedio.toFixed(0)}`}
            subtitle={`Valor total: R$ ${kpis.totalValor.toLocaleString('pt-BR')}`}
            icon="cac"
            trend={kpis.ticketMedio >= 80 ? 'up' : 'neutral'}
          />
          <KpiCard
            title="Vendas Instaladas"
            value={`${kpis.totalInstalado}`}
            subtitle="Instalações concluídas"
            icon="installed"
            trend={kpis.totalInstalado > 0 ? 'up' : 'neutral'}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="base" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="base">Base Única</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="programacao">Programação</TabsTrigger>
            <TabsTrigger value="datas">Datas Comemorativas</TabsTrigger>
            <TabsTrigger value="condominios">Condomínios</TabsTrigger>
          </TabsList>

          <TabsContent value="base">
            <DataTable data={filteredBase} title="Base Única — Desempenho PAPs" columns={tableColumns} />
          </TabsContent>

          <TabsContent value="graficos" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <MonthlyEvolutionChart data={visaoMensal} />
              <FunnelStageChart data={esteiraMensal} />
            </div>
            <SalesByProductChart data={baseUnica} />
          </TabsContent>

          <TabsContent value="programacao">
            <WeeklyCalendar data={programacaoSemanal} />
          </TabsContent>

          <TabsContent value="datas">
            <CommemorativeDates data={datasComemoativas} />
          </TabsContent>

          <TabsContent value="condominios">
            <CondominiosList data={acompCondominios} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
