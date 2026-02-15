import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  values: string[];
}

interface FiltersProps {
  filterOptions: FilterOption[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  lastUpdate: Date | null;
}

export function Filters({ filterOptions, filterValues, onFilterChange, onExport, onRefresh, lastUpdate }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filterOptions.map(opt => (
        <Select key={opt.key} value={filterValues[opt.key] || 'all'} onValueChange={v => onFilterChange(opt.key, v)}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card">
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
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        )}
        <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="h-9 gap-1 text-xs" onClick={onExport}>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
      </div>
    </div>
  );
}
