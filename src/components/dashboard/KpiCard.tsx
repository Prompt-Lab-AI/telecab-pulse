import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Users, DollarSign, BarChart3 } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: 'target' | 'conversion' | 'churn' | 'cac';
  trend?: 'up' | 'down' | 'neutral';
}

const icons = {
  target: Target,
  conversion: BarChart3,
  churn: Users,
  cac: DollarSign,
};

export function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  const Icon = icons[icon];

  return (
    <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground shadow-lg">
      <div className="absolute right-0 top-0 h-full w-24 opacity-10">
        <Icon className="h-full w-full" />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium opacity-80">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && trend !== 'neutral' && (
            <span className="mb-1">
              {trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-300" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-300" />
              )}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
