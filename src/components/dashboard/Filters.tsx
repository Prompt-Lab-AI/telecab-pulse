import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface FiltersProps {
  filterOptions: { key: string; label: string; values: string[] }[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  lastUpdate: Date | null;
}

export function Filters({ filterOptions, filterValues, onFilterChange, onExport, onRefresh, lastUpdate }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filterOptions.map(opt => (
        <Select key={opt.key} value={filterValues[opt.key] || 'all'} onValueChange={v => onFilterChange(opt.key, v)}>
          <SelectTrigger className="w-[170px] bg-card">
            <SelectValue placeholder={opt.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{opt.label}</SelectItem>
            {opt.values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}

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
