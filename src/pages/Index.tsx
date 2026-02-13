import { useState, useMemo } from 'react';
import { useSheetsData } from '@/hooks/useSheetsData';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PapTable } from '@/components/dashboard/PapTable';
import { SalesEvolutionChart, SalesByProductChart, SalesByCityChart } from '@/components/dashboard/Charts';
import { Filters } from '@/components/dashboard/Filters';
import { exportToExcel } from '@/lib/export';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { paps, vendas, metas, loading, lastUpdate, refetch } = useSheetsData();
  const [selectedPap, setSelectedPap] = useState('all');
  const [selectedCidade, setSelectedCidade] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  const filteredVendas = useMemo(() => {
    let filtered = vendas;
    if (selectedPap !== 'all') filtered = filtered.filter(v => v.papId === selectedPap);
    if (selectedCidade !== 'all') filtered = filtered.filter(v => v.cidade === selectedCidade);
    if (dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(dateRange);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(v => {
        const d = new Date(v.data);
        return !isNaN(d.getTime()) && d >= cutoff;
      });
    }
    return filtered;
  }, [vendas, selectedPap, selectedCidade, dateRange]);

  // Build filter options from PAPs sheet
  const papOptions = paps.filter(p => p.ativo === 'Sim').map(p => ({ id: p.id, nome: p.nome }));
  const cidades = [...new Set(paps.map(p => p.cidade))].sort();

  // KPI calculations
  const totalVendasQtd = filteredVendas.reduce((s, v) => s + v.vendas, 0);
  const totalValor = filteredVendas.reduce((s, v) => s + v.valorTotal, 0);
  const totalVisitas = filteredVendas.reduce((s, v) => s + v.visitas, 0);
  const currentMeta = metas.length > 0 ? metas[0] : null;
  const metaVendas = currentMeta?.metaVendas || 0;
  const metaPercent = metaVendas > 0 ? (totalVendasQtd / metaVendas) * 100 : 0;
  const taxaConversao = totalVisitas > 0 ? (totalVendasQtd / totalVisitas) * 100 : 0;
  const metaConversao = currentMeta?.metaConversao || 0;
  const metaChurn = currentMeta?.metaChurnNovos || 0;
  const cac = totalVendasQtd > 0 ? (totalValor * 0.12 / totalVendasQtd) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-primary px-4 py-4 text-primary-foreground shadow-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              📊 Telecab — Painel do Supervisor
            </h1>
            <p className="text-sm opacity-80">Monitoramento de PAPs em tempo real</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        <Filters
          paps={papOptions.map(p => p.id)}
          papLabels={papOptions.reduce((acc, p) => ({ ...acc, [p.id]: p.nome }), {} as Record<string, string>)}
          cidades={cidades}
          selectedPap={selectedPap}
          selectedCidade={selectedCidade}
          dateRange={dateRange}
          onPapChange={setSelectedPap}
          onCidadeChange={setSelectedCidade}
          onDateRangeChange={setDateRange}
          onExport={() => exportToExcel(filteredVendas)}
          onRefresh={refetch}
          lastUpdate={lastUpdate}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Meta de Vendas"
            value={`${metaPercent.toFixed(1)}%`}
            subtitle={`${totalVendasQtd} / ${metaVendas} vendas`}
            icon="target"
            trend={metaPercent >= 80 ? 'up' : 'down'}
          />
          <KpiCard
            title="Taxa de Conversão"
            value={`${taxaConversao.toFixed(1)}%`}
            subtitle={`Meta: ${metaConversao}% | ${totalVendasQtd} vendas / ${totalVisitas} visitas`}
            icon="conversion"
            trend={taxaConversao >= metaConversao ? 'up' : 'down'}
          />
          <KpiCard
            title="Churn Novos Clientes"
            value={`${metaChurn}%`}
            subtitle={`Meta máxima de churn`}
            icon="churn"
            trend="neutral"
          />
          <KpiCard
            title="CAC Estimado"
            value={`R$ ${cac.toFixed(0)}`}
            subtitle={`Valor total: R$ ${totalValor.toLocaleString('pt-BR')}`}
            icon="cac"
            trend={cac < 100 ? 'up' : 'down'}
          />
        </div>

        <PapTable vendas={filteredVendas} metas={metas} paps={paps} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SalesEvolutionChart vendas={filteredVendas} />
          <SalesByProductChart vendas={filteredVendas} />
        </div>
        <SalesByCityChart vendas={filteredVendas} />
      </main>
    </div>
  );
};

export default Index;
