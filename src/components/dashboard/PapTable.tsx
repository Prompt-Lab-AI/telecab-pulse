import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VendaData, MetaData, PapData } from '@/lib/sheets';

interface PapTableProps {
  vendas: VendaData[];
  metas: MetaData[];
  paps: PapData[];
}

interface PapRow {
  nome: string;
  cidade: string;
  visitas: number;
  vendas: number;
  ticketMedio: number;
  conversao: number;
}

export function PapTable({ vendas, metas, paps }: PapTableProps) {
  const rows: PapRow[] = paps.filter(p => p.ativo === 'Sim').map(pap => {
    const papVendas = vendas.filter(v => v.papId === pap.id);
    const totalVendas = papVendas.reduce((s, v) => s + v.vendas, 0);
    const totalValor = papVendas.reduce((s, v) => s + v.valorTotal, 0);
    const totalVisitas = papVendas.reduce((s, v) => s + v.visitas, 0);

    return {
      nome: pap.nome,
      cidade: pap.cidade,
      visitas: totalVisitas,
      vendas: totalVendas,
      ticketMedio: totalVendas > 0 ? totalValor / totalVendas : 0,
      conversao: totalVisitas > 0 ? (totalVendas / totalVisitas) * 100 : 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Desempenho por PAP</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">PAP</TableHead>
              <TableHead className="font-semibold">Cidade</TableHead>
              <TableHead className="text-right font-semibold">Visitas</TableHead>
              <TableHead className="text-right font-semibold">Vendas</TableHead>
              <TableHead className="text-right font-semibold">Ticket Médio</TableHead>
              <TableHead className="text-right font-semibold">Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.nome}>
                <TableCell className="font-medium">{row.nome}</TableCell>
                <TableCell>{row.cidade}</TableCell>
                <TableCell className="text-right">{row.visitas}</TableCell>
                <TableCell className="text-right">{row.vendas}</TableCell>
                <TableCell className="text-right">R$ {row.ticketMedio.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <span className={row.conversao >= 30 ? 'text-green-600 font-semibold' : row.conversao >= 15 ? 'text-yellow-600' : 'text-red-500'}>
                    {row.conversao.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
