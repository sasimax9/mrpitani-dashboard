import { useState } from 'react';
import { Home, ShoppingCart, Package, TrendingUp, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar({ activeModule, onModuleChange, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, testId: 'nav-dashboard' },
    { id: 'orders', name: 'Orders', icon: ShoppingCart, testId: 'nav-orders' },
    { id: 'bulk-orders', name: 'Bulk Orders', icon: Package, testId: 'nav-bulk-orders' },
    { id: 'products', name: 'Products', icon: TrendingUp, testId: 'nav-products' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-sm hover:bg-muted"
        data-testid="mobile-menu-toggle"
      >
        {isCollapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-200 ${
          isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } lg:translate-x-0 w-64`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Branding */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xl font-heading">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading text-foreground">mrpitani</h1>
                <p className="text-xs text-muted-foreground">CRM System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => onModuleChange(module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  data-testid={module.testId}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-sm">{module.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start gap-3 rounded-sm border-border hover:bg-muted"
              data-testid="sidebar-logout-button"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}