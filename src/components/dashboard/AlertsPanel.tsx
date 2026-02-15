import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, Trophy, ArrowDown } from 'lucide-react';
import type { Alert, PapRanking } from '@/lib/analytics';

interface AlertsPanelProps {
  alerts: Alert[];
  rankings: PapRanking[];
}

const alertIcon = {
  error: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />,
  info: <Info className="h-4 w-4 text-orange-500 shrink-0" />,
};

const alertBg = {
  error: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  info: 'bg-orange-500/10 border-orange-500/20',
};

export function AlertsPanel({ alerts, rankings }: AlertsPanelProps) {
  const top5 = rankings.slice(0, 5);
  const bottom5 = rankings.length > 5 ? rankings.slice(-5).reverse() : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">✅ Nenhum alerta ativo</p>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${alertBg[a.type]}`}>
                {alertIcon[a.type]}
                <div>
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="text-muted-foreground mt-0.5">{a.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top 5 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 5 PAPs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {top5.map((r, i) => (
              <div key={r.pap} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary w-5">{i + 1}º</span>
                  <span className="text-sm font-medium">{r.pap}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{r.vendasValidas} vendas</span>
                  <span>R$ {r.ticketMedio.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom 5 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ArrowDown className="h-4 w-4 text-destructive" />
            PAPs que Precisam de Atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bottom5.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Dados insuficientes</p>
          ) : (
            <div className="space-y-1.5">
              {bottom5.map((r, i) => (
                <div key={r.pap} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2">
                  <span className="text-sm font-medium">{r.pap}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{r.vendasValidas} vendas</span>
                    <span className={r.churn90d > 5 ? 'text-destructive font-semibold' : ''}>
                      {r.churn90d.toFixed(0)}% churn
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
