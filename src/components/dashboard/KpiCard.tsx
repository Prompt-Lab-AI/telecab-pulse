import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Users, DollarSign, ShoppingCart, Wallet } from 'lucide-react';
import type { Trend } from '@/lib/analytics';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: 'target' | 'conversion' | 'churn' | 'ticket' | 'installed' | 'mrr';
  trend?: Trend;
  alert?: 'error' | 'warning' | null;
}

const icons = {
  target: Target,
  conversion: BarChart3,
  churn: Users,
  ticket: DollarSign,
  installed: ShoppingCart,
  mrr: Wallet,
};

const TrendIcon = ({ trend }: { trend?: Trend }) => {
  if (!trend || trend === 'stable') return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  return <TrendingDown className="h-4 w-4 text-red-400" />;
};

export function KpiCard({ title, value, subtitle, icon, trend, alert }: KpiCardProps) {
  const Icon = icons[icon];
  
  const borderClass = alert === 'error' 
    ? 'ring-2 ring-red-500/50' 
    : alert === 'warning' 
    ? 'ring-2 ring-yellow-500/50' 
    : '';

  return (
    <Card className={`relative overflow-hidden border-none bg-primary text-primary-foreground shadow-lg ${borderClass}`}>
      <div className="absolute right-0 top-0 h-full w-20 opacity-[0.07]">
        <Icon className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider opacity-80">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          <TrendIcon trend={trend} />
        </div>
        {subtitle && <p className="mt-1 text-[11px] opacity-60 leading-tight">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
