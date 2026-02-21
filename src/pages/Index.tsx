import { useState, useMemo } from 'react';
import { useSheetsData } from '@/hooks/useSheetsData';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { BaseUnicaPanel } from '@/components/dashboard/BaseUnicaPanel';
import { ExecutivePanel } from '@/components/dashboard/Charts';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { Filters } from '@/components/dashboard/Filters';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { CommemorativeDates } from '@/components/dashboard/CommemorativeDates';
import { CondominiosList } from '@/components/dashboard/CondominiosList';
import { VendedoresPanel } from '@/components/dashboard/VendedoresPanel';
import { exportToExcel } from '@/lib/export';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle } from 'lucide-react';
import telecabLogo from '@/assets/telecab-logo.png';
import {
  applyAllFilters, calculateKPIs, calculatePapRankings, generateAlerts,
  getRevenueByProduct, getVendasByDay, getFunnelData,
  getCurrentMesAno,
} from '@/lib/analytics';

const Index = () => {
  const {
    baseUnica, visaoMensal, esteiraMensal,
    programacaoSemanal, datasComemoativas, acompCondominios,
    loading, lastUpdate, refetch,
  } = useSheetsData();

  const [filters, setFilters] = useState<Record<string, string>>({ mes: getCurrentMesAno() });

  // Filter options
  const filterOptions = useMemo(() => {
    const unique = (key: string) => [...new Set(baseUnica.map(r => r[key]).filter(Boolean))].sort();
    const meses = [...new Set(baseUnica.map(r => r['mês/ano']).filter(Boolean))];
    return [
      { key: 'mes', label: 'Todos os Meses', values: meses },
      { key: 'pap', label: 'Todos PAPs', values: unique('pap') },
      { key: 'cidade', label: 'Todas Cidades', values: unique('cidade') },
      { key: 'produto', label: 'Todos Produtos', values: unique('produto') },
      { key: 'status', label: 'Todos Status', values: unique('status') },
    ];
  }, [baseUnica]);

  // Apply filters
  const filteredBase = useMemo(() => applyAllFilters(baseUnica, filters), [baseUnica, filters]);

  // KPIs
  const kpis = useMemo(() => calculateKPIs(filteredBase, visaoMensal, esteiraMensal), [filteredBase, visaoMensal, esteiraMensal]);

  // Rankings
  const rankings = useMemo(() => calculatePapRankings(filteredBase), [filteredBase]);

  // Alerts
  const alerts = useMemo(() => generateAlerts(kpis, rankings), [kpis, rankings]);



  // Chart data
  const vendasByDay = useMemo(() => getVendasByDay(filteredBase), [filteredBase]);
  const funnelData = useMemo(() => getFunnelData(esteiraMensal), [esteiraMensal]);
  const revenueByProduct = useMemo(() => getRevenueByProduct(filteredBase), [filteredBase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-80" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-primary px-4 py-3 text-primary-foreground shadow-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={telecabLogo} alt="Telecab" className="h-8 w-8 rounded object-contain bg-white/10 p-0.5" />
            <div>
              <h1 className="text-base font-bold tracking-tight md:text-lg">
                Acompanhamento Entrega PAPs
              </h1>
              <p className="text-[10px] opacity-70">Telecab — Painel do Supervisor</p>
            </div>
          </div>
          {alerts.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg hover:bg-red-700 transition-colors animate-pulse cursor-pointer">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b bg-red-50 px-4 py-2.5">
                  <p className="text-sm font-bold text-red-700">⚠️ Alertas Ativos</p>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1.5">
                  {alerts.map((a, i) => (
                    <div key={i} className="rounded-md border px-3 py-2 text-xs">
                      <p className="font-semibold text-foreground">{a.title}</p>
                      <p className="text-muted-foreground mt-0.5">{a.message}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        {/* Filters */}
        <Filters
          filterOptions={filterOptions}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          onExport={() => exportToExcel(filteredBase, 'base-unica')}
          onRefresh={refetch}
          lastUpdate={lastUpdate}
        />

        {/* KPIs - 6 cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <KpiCard
            title="Meta Atingida"
            value={kpis.metaMensal > 0 ? `${kpis.metaAtingida.toFixed(1)}%` : 'N/D'}
            subtitle={`${kpis.totalVendasValidas} / ${kpis.metaMensal} vendas`}
            icon="target"
            trend={kpis.metaAtingida >= 80 ? 'up' : 'down'}
            alert={kpis.metaAtingida < 80 && kpis.metaMensal > 0 ? 'warning' : null}
          />
          <KpiCard
            title="Conversão"
            value={kpis.vendasSubidas > 0 ? `${kpis.taxaConversao.toFixed(1)}%` : 'N/D'}
            subtitle={`${kpis.vendasInstaladas} inst / ${kpis.vendasSubidas} sub`}
            icon="conversion"
            trend={kpis.taxaConversao >= 70 ? 'up' : 'down'}
          />
          <KpiCard
            title="Churn 90d"
            value={`${kpis.churn90d.toFixed(1)}%`}
            subtitle={`${kpis.cancelamentos90d} canc / ${kpis.contratosUltimos90d} contratos`}
            icon="churn"
            trend={kpis.churn90d <= 5 ? 'up' : 'down'}
            alert={kpis.churn90d > 5 ? 'error' : null}
          />
          <KpiCard
            title="Ticket Médio"
            value={`R$ ${kpis.ticketMedio.toFixed(2)}`}
            subtitle={`${kpis.totalContratosAtivos} contratos ativos`}
            icon="ticket"
            trend={kpis.ticketMedio >= 60 ? 'up' : 'stable'}
          />
          <KpiCard
            title="Instaladas"
            value={`${kpis.totalVendasValidas}`}
            subtitle="Vendas com ativação"
            icon="installed"
            trend={kpis.totalVendasValidas > 0 ? 'up' : 'stable'}
          />
          <KpiCard
            title="MRR Ativo"
            value={`R$ ${kpis.mrrAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            subtitle="Receita mensal ativa"
            icon="mrr"
            trend={kpis.mrrAtivo > 0 ? 'up' : 'stable'}
          />
        </div>

        {/* Intelligence Panel */}
        <AlertsPanel alerts={alerts} rankings={rankings} />

        {/* Tabs */}
        <Tabs defaultValue="graficos" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="base">Base Única</TabsTrigger>
            <TabsTrigger value="programacao">Programação</TabsTrigger>
            <TabsTrigger value="datas">Datas Comemorativas</TabsTrigger>
            <TabsTrigger value="condominios">Condomínios</TabsTrigger>
            <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          </TabsList>

          <TabsContent value="graficos">
            <ExecutivePanel
              kpis={kpis}
              rankings={rankings}
              vendasByDay={vendasByDay}
              funnelData={funnelData}
              revenueByProduct={revenueByProduct}
            />
          </TabsContent>

          <TabsContent value="base">
            <BaseUnicaPanel data={filteredBase} />
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

          <TabsContent value="vendedores">
            <VendedoresPanel data={filteredBase} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
