import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, AlertCircle, Info, Trophy, ArrowDown, Lightbulb, TrendingDown } from 'lucide-react';
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
  error: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20',
  info: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
};

interface AlertDetail {
  explanation: string;
  causes: string[];
  actions: string[];
}

function getAlertDetail(alert: Alert): AlertDetail {
  const title = alert.title.toLowerCase();

  if (title.includes('churn')) {
    return {
      explanation: 'Cancelamentos acima do limite esperado. Isso impacta diretamente a receita recorrente e a sustentabilidade da operação.',
      causes: [
        'Qualidade das vendas recentes pode estar baixa',
        'Tempo de instalação elevado gera desistências',
        'Falta de acompanhamento pós-venda',
      ],
      actions: [
        'Verificar qualidade das vendas recentes',
        'Reduzir tempo entre venda e instalação',
        'Implementar contato de boas-vindas após ativação',
        'Revisar PAPs com maior índice de cancelamento',
      ],
    };
  }

  if (title.includes('meta')) {
    return {
      explanation: 'A meta atingida está abaixo de 80%. É necessário ação imediata para recuperar o ritmo de vendas no período restante.',
      causes: [
        'Distribuição desigual de equipe em campo',
        'PAPs de baixa conversão reduzindo a média',
        'Falta de ações táticas nos dias restantes',
      ],
      actions: [
        'Redistribuir equipe para regiões de maior potencial',
        'Focar nos PAPs com maior taxa de conversão',
        'Criar metas diárias para os próximos dias',
        'Intensificar ações em condomínios pré-mapeados',
      ],
    };
  }

  if (title.includes('conversão')) {
    return {
      explanation: 'Funil com perda excessiva entre subida e instalação. Vendas são feitas mas não se concretizam.',
      causes: [
        'Demora na análise de crédito ou viabilidade',
        'Falhas no agendamento de instalação',
        'Desistência do cliente por demora no processo',
      ],
      actions: [
        'Reforçar acompanhamento operacional do funil',
        'Reduzir tempo entre venda subida e instalação',
        'Acompanhar individualmente vendas pendentes',
        'Verificar gargalos no processo de ativação',
      ],
    };
  }

  // PAP-specific or generic
  return {
    explanation: alert.message,
    causes: ['Desempenho abaixo do esperado para o indicador monitorado'],
    actions: [
      'Acompanhar de perto o indicador nos próximos dias',
      'Revisar ações recentes que possam ter impactado',
      'Considerar ajustes na estratégia de campo',
    ],
  };
}

function getPapIssues(pap: PapRanking, avgVendas: number, avgTicket: number, avgConversao: number) {
  const issues: { icon: string; label: string }[] = [];
  if (pap.vendasValidas < avgVendas * 0.7) issues.push({ icon: '↓', label: 'vendas' });
  if (pap.ticketMedio < avgTicket * 0.8) issues.push({ icon: '↓', label: 'ticket' });
  const papConversao = pap.vendasValidas > 0 ? 100 : 0;
  if (papConversao < avgConversao * 0.7) issues.push({ icon: '↓', label: 'conversão' });
  if (pap.churn90d > 5) issues.push({ icon: '↑', label: 'churn' });
  return issues;
}

const motivationTips = [
  'Acompanhamento em campo com feedback direto',
  'Definir meta curta (diária ou semanal) para recuperação',
  'Reforço positivo e reconhecimento de pequenos avanços',
  'Redistribuição de região para área com maior potencial',
  'Treinamento rápido focado em abordagem e fechamento',
];

export function AlertsPanel({ alerts, rankings }: AlertsPanelProps) {
  const top5 = rankings.slice(0, 5);

  // Calculate averages for determining issues
  const avgVendas = rankings.length > 0 ? rankings.reduce((a, r) => a + r.vendasValidas, 0) / rankings.length : 0;
  const avgTicket = rankings.length > 0 ? rankings.reduce((a, r) => a + r.ticketMedio, 0) / rankings.length : 0;
  const avgConversao = 70; // benchmark

  // Bottom PAPs: those with issues
  const bottomPaps = rankings
    .filter(r => {
      const issues = getPapIssues(r, avgVendas, avgTicket, avgConversao);
      return issues.length > 0 || r.score < (rankings[0]?.score || 0) * 0.4;
    })
    .slice(-7)
    .reverse();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Interactive Alerts */}
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
            alerts.map((a, i) => {
              const detail = getAlertDetail(a);
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <button className={`w-full flex items-start gap-2 rounded-lg border p-2.5 text-xs text-left cursor-pointer transition-colors ${alertBg[a.type]}`}>
                      {alertIcon[a.type]}
                      <div>
                        <p className="font-semibold text-foreground">{a.title}</p>
                        <p className="text-muted-foreground mt-0.5">{a.message}</p>
                        <p className="text-[10px] text-primary mt-1 font-medium">Clique para ver detalhes →</p>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" side="right" align="start">
                    <div className="border-b px-4 py-2.5 bg-muted/50">
                      <p className="text-sm font-bold text-foreground">{a.title}</p>
                    </div>
                    <div className="px-4 py-3 space-y-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground mb-1">📋 Diagnóstico</p>
                        <p className="text-muted-foreground leading-relaxed">{detail.explanation}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">🔍 Possíveis Causas</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {detail.causes.map((c, ci) => (
                            <li key={ci} className="flex items-start gap-1.5">
                              <span className="text-yellow-500 mt-0.5">•</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">✅ Ações Recomendadas</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {detail.actions.map((ac, ai) => (
                            <li key={ai} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">→</span>{ac}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })
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

      {/* Bottom PAPs - Managerial Intelligence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ArrowDown className="h-4 w-4 text-destructive" />
            PAPs que Precisam de Atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bottomPaps.length === 0 ? (
            <div className="text-center py-4 space-y-1">
              <p className="text-sm font-medium text-emerald-600">✅ Nenhum PAP em atenção no momento</p>
              <p className="text-xs text-muted-foreground">Performance dentro do esperado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bottomPaps.slice(0, 5).map((r, i) => {
                const issues = getPapIssues(r, avgVendas, avgTicket, avgConversao);
                const tip = motivationTips[i % motivationTips.length];
                return (
                  <Popover key={r.pap}>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2 hover:bg-destructive/10 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{r.pap}</span>
                          <div className="flex gap-1.5">
                            {issues.map((issue, ii) => (
                              <span key={ii} className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                {issue.icon} {issue.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-yellow-500" />
                          {tip}
                        </p>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" side="left" align="start">
                      <div className="border-b px-4 py-2.5 bg-muted/50">
                        <p className="text-sm font-bold">{r.pap}</p>
                        <p className="text-[10px] text-muted-foreground">Diagnóstico de performance</p>
                      </div>
                      <div className="px-4 py-3 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground">Vendas</p>
                            <p className="font-bold text-foreground">{r.vendasValidas}</p>
                          </div>
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground">Ticket Médio</p>
                            <p className="font-bold text-foreground">R$ {r.ticketMedio.toFixed(0)}</p>
                          </div>
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground">Churn 90d</p>
                            <p className={`font-bold ${r.churn90d > 5 ? 'text-destructive' : 'text-foreground'}`}>{r.churn90d.toFixed(1)}%</p>
                          </div>
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground">MRR</p>
                            <p className="font-bold text-foreground">R$ {r.mrrAtivo.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="border-t pt-2">
                          <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-destructive" /> Recomendações
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            PAP com queda de performance. Sugere-se acompanhamento próximo, meta de curto prazo e reforço positivo. Considere feedback individual e ajuste de região se necessário.
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
