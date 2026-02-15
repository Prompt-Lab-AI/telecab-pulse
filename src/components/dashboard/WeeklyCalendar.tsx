import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SheetRow, str } from '@/lib/sheets';
import { CalendarDays } from 'lucide-react';

interface Props {
  data: SheetRow[];
}

export function WeeklyCalendar({ data }: Props) {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Programação Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map(h => (
                <TableHead key={h} className="font-semibold capitalize">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 50).map((row, i) => (
              <TableRow key={i}>
                {headers.map(h => (
                  <TableCell key={h}>{row[h]}</TableCell>
                ))}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={headers.length || 1} className="text-center text-muted-foreground py-8">
                  Nenhuma programação disponível
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
