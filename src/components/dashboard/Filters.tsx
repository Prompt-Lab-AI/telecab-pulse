import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface FiltersProps {
  paps: string[];
  papLabels?: Record<string, string>;
  cidades: string[];
  selectedPap: string;
  selectedCidade: string;
  dateRange: string;
  onPapChange: (v: string) => void;
  onCidadeChange: (v: string) => void;
  onDateRangeChange: (v: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  lastUpdate: Date | null;
}

export function Filters({
  paps, papLabels, cidades, selectedPap, selectedCidade, dateRange,
  onPapChange, onCidadeChange, onDateRangeChange, onExport, onRefresh, lastUpdate,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedPap} onValueChange={onPapChange}>
        <SelectTrigger className="w-[180px] bg-card">
          <SelectValue placeholder="Todos os PAPs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os PAPs</SelectItem>
          {paps.map(p => (
            <SelectItem key={p} value={p}>{papLabels?.[p] || p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCidade} onValueChange={onCidadeChange}>
        <SelectTrigger className="w-[160px] bg-card">
          <SelectValue placeholder="Todas cidades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas cidades</SelectItem>
          {cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-[160px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="all">Todo período</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        {lastUpdate && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onExport} className="gap-1">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>
    </div>
  );
}
