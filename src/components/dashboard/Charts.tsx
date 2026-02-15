import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { SheetRow, num, str } from '@/lib/sheets';

const COLORS = [
  'hsl(215, 100%, 27%)', 'hsl(215, 80%, 45%)', 'hsl(200, 70%, 50%)',
  'hsl(190, 60%, 45%)', 'hsl(180, 50%, 40%)', 'hsl(215, 60%, 60%)',
];

interface GenericChartProps {
  data: SheetRow[];
}

export function MonthlyEvolutionChart({ data }: GenericChartProps) {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const monthKey = headers.find(h => /m[eê]s|month|periodo/i.test(h)) || headers[0] || 'mes';
  const valueKey = headers.find(h => /venda|total|valor|receita/i.test(h)) || headers[1] || '';

  const chartData = data.map(row => ({
    mes: str(row, monthKey),
    valor: num(row, valueKey),
  })).filter(d => d.mes);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Evolução Mensal</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 30%, 88%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="hsl(215, 100%, 27%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function FunnelStageChart({ data }: GenericChartProps) {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const stageKey = headers.find(h => /etapa|stage|fase|status/i.test(h)) || headers[0] || '';
  const countKey = headers.find(h => /qtd|quantidade|count|total/i.test(h)) || headers[1] || '';

  const chartData = data.map(row => ({
    name: str(row, stageKey),
    value: num(row, countKey),
  })).filter(d => d.name && d.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Funil de Esteira</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Dados do funil não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Funil de Esteira</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 30%, 88%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(215, 100%, 27%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesByProductChart({ data }: GenericChartProps) {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const productKey = headers.find(h => /produto|product|plano/i.test(h)) || headers[0] || '';
  const valueKey = headers.find(h => /venda|total|valor|qtd/i.test(h)) || headers[1] || '';

  const byProduct: Record<string, number> = {};
  data.forEach(row => {
    const p = str(row, productKey);
    if (p) byProduct[p] = (byProduct[p] || 0) + num(row, valueKey);
  });

  const chartData = Object.entries(byProduct)
    .sort(([, a], [, b]) => b - a)
    .map(([produto, valor]) => ({ produto, valor }));

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Vendas por Produto</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="valor" nameKey="produto" cx="50%" cy="50%" outerRadius={100}
                label={({ produto, percent }) => `${produto} (${(percent * 100).toFixed(0)}%)`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
