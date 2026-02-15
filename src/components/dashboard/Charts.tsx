import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import type { PapRanking } from '@/lib/analytics';

const COLORS = [
  'hsl(215, 100%, 35%)', 'hsl(200, 80%, 45%)', 'hsl(190, 70%, 40%)',
  'hsl(170, 60%, 40%)', 'hsl(215, 60%, 55%)', 'hsl(230, 50%, 50%)',
];

// 1. Evolução Diária de Vendas
export function SalesEvolutionChart({ data }: { data: { data: string; vendas: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Evolução de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="vendas" stroke="hsl(215, 100%, 35%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(215, 100%, 35%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Funil de Esteira Comercial
export function FunnelChart({ data }: { data: { etapa: string; valor: number }[] }) {
  const colors = ['hsl(215, 100%, 35%)', 'hsl(150, 60%, 40%)', 'hsl(0, 70%, 50%)'];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Funil Comercial</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="etapa" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 3. Receita por Produto
export function RevenueByProductChart({ data }: { data: { produto: string; receita: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Receita por Produto (MRR)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="produto" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 4. Ranking de PAPs
export function PapRankingChart({ data }: { data: PapRanking[] }) {
  const chartData = data.map(d => ({ pap: d.pap, vendas: d.vendasValidas }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Ranking PAPs — Vendas Válidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="pap" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="vendas" fill="hsl(215, 100%, 35%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// 5. Ticket Médio por PAP
export function TicketByPapChart({ data }: { data: PapRanking[] }) {
  const chartData = data.map(d => ({ pap: d.pap, ticket: Number(d.ticketMedio.toFixed(2)) }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Ticket Médio por PAP</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="pap" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Bar dataKey="ticket" fill="hsl(200, 70%, 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
