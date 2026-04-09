import { DollarSign, ShoppingBag, Clock, CheckCircle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      bgColor: 'bg-success-light',
      iconColor: 'text-success-dark',
      testId: 'stat-total-orders'
    },
    {
      title: 'Total Earnings',
      value: `₹${(stats?.total_earnings || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-success-light',
      iconColor: 'text-success-dark',
      testId: 'stat-total-earnings'
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: Clock,
      bgColor: 'bg-warning-light',
      iconColor: 'text-warning-dark',
      testId: 'stat-pending-orders'
    },
    {
      title: 'Completed Orders',
      value: stats?.completed_orders || 0,
      icon: CheckCircle,
      bgColor: 'bg-success-light',
      iconColor: 'text-success-dark',
      testId: 'stat-completed-orders'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="stats-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-sm p-6 hover:bg-muted transition-all duration-200"
          data-testid={card.testId}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {card.title}
              </p>
              <p className="text-4xl font-light tracking-tight text-foreground font-heading">
                {card.value}
              </p>
            </div>
            <div className={`${card.bgColor} ${card.iconColor} p-3 rounded-sm`}>
              <card.icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}