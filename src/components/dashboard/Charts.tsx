import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { VendaData } from '@/lib/sheets';

interface ChartsProps {
  vendas: VendaData[];
}

const COLORS = ['hsl(215, 100%, 27%)', 'hsl(215, 80%, 45%)', 'hsl(215, 60%, 60%)', 'hsl(200, 70%, 50%)', 'hsl(190, 60%, 45%)', 'hsl(180, 50%, 40%)'];

export function SalesEvolutionChart({ vendas }: ChartsProps) {
  const dailySales: Record<string, number> = {};
  vendas.forEach(v => {
    const key = v.data; // Already YYYY-MM-DD
    dailySales[key] = (dailySales[key] || 0) + v.valorTotal;
  });

  const data = Object.entries(dailySales)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, valor]) => ({ dia: dia.substring(5), valor }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolução de Vendas no Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 30%, 88%)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Vendas']} />
              <Line type="monotone" dataKey="valor" stroke="hsl(215, 100%, 27%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesByProductChart({ vendas }: ChartsProps) {
  const byProduct: Record<string, number> = {};
  vendas.forEach(v => {
    byProduct[v.produto] = (byProduct[v.produto] || 0) + v.valorTotal;
  });

  const data = Object.entries(byProduct)
    .sort(([, a], [, b]) => b - a)
    .map(([produto, valor]) => ({ produto, valor }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vendas por Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 30%, 88%)" />
              <XAxis dataKey="produto" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Vendas']} />
              <Bar dataKey="valor" fill="hsl(215, 100%, 27%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesByCityChart({ vendas }: ChartsProps) {
  const byCity: Record<string, number> = {};
  vendas.forEach(v => {
    byCity[v.cidade] = (byCity[v.cidade] || 0) + v.valorTotal;
  });

  const data = Object.entries(byCity)
    .sort(([, a], [, b]) => b - a)
    .map(([cidade, valor]) => ({ cidade, valor }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vendas por Cidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="valor" nameKey="cidade" cx="50%" cy="50%" outerRadius={100} label={({ cidade, percent }) => `${cidade} (${(percent * 100).toFixed(0)}%)`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Vendas']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
