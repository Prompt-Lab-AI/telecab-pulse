import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetRow, str, num } from '@/lib/sheets';

interface DataTableProps {
  data: SheetRow[];
  title: string;
  columns: { key: string; label: string; align?: 'left' | 'right'; format?: (v: string) => string }[];
}

export function DataTable({ data, title, columns }: DataTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(col => (
                <TableHead key={col.key} className={`font-semibold ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map(col => {
                  const val = row[col.key] || '';
                  return (
                    <TableCell key={col.key} className={col.align === 'right' ? 'text-right' : ''}>
                      {col.format ? col.format(val) : val}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
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
