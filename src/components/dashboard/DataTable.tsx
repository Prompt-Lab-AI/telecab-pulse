import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EnrichedRow } from '@/lib/analytics';

interface DataTableProps {
  data: EnrichedRow[];
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  'ativo': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'cancelado': 'bg-red-100 text-red-800 border-red-200',
  'agendado': 'bg-blue-100 text-blue-800 border-blue-200',
  'aguardando agendamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const SLA_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-muted text-muted-foreground border-border',
};

const SLA_LABELS: Record<string, string> = {
  green: '✅ ≤7d',
  yellow: '⚠️ 8-15d',
  red: '🔴 >15d',
  pending: '⏳ Pendente',
};

const VISIBLE_COLUMNS = [
  { key: 'pap', label: 'PAP' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'produto', label: 'Produto' },
  { key: 'data da venda', label: 'Data Venda' },
  { key: 'valor mensal', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: '_diasInstalacao', label: 'Dias Inst.' },
  { key: '_slaColor', label: 'SLA' },
];

export function DataTable({ data, title }: DataTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className="text-xs text-muted-foreground">{data.length} registros</span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {VISIBLE_COLUMNS.map(col => (
                <TableHead key={col.key} className="text-xs font-semibold whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} className="text-xs">
                {VISIBLE_COLUMNS.map(col => {
                  if (col.key === 'status') {
                    const statusKey = (row['status'] || '').toLowerCase();
                    return (
                      <TableCell key={col.key}>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[statusKey] || ''}`}>
                          {row['status'] || '-'}
                        </Badge>
                      </TableCell>
                    );
                  }
                  if (col.key === '_slaColor') {
                    const sla = row._slaColor;
                    return (
                      <TableCell key={col.key}>
                        <Badge variant="outline" className={`text-[10px] ${SLA_COLORS[sla]}`}>
                          {SLA_LABELS[sla]}
                        </Badge>
                      </TableCell>
                    );
                  }
                  if (col.key === '_diasInstalacao') {
                    return <TableCell key={col.key} className="font-mono">{row._diasInstalacao}</TableCell>;
                  }
                  return <TableCell key={col.key} className="whitespace-nowrap">{row[col.key] || '-'}</TableCell>;
                })}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={VISIBLE_COLUMNS.length} className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
