import { useState } from 'react';
import { Home, ShoppingCart, Package, TrendingUp, LogOut, Menu, X, Tag, FileText, Users, GitBranch, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar({ activeModule, onModuleChange, onLogout, userRole }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, testId: 'nav-dashboard', roles: ['admin', 'supervisor'] },
    { id: 'orders', name: 'Orders', icon: ShoppingCart, testId: 'nav-orders', roles: ['admin', 'supervisor'] },
    { id: 'bulk-orders', name: 'Bulk Orders', icon: Package, testId: 'nav-bulk-orders', roles: ['admin', 'supervisor'] },
    { id: 'order-items', name: 'Order Items', icon: FileText, testId: 'nav-order-items', roles: ['admin', 'supervisor'] },
    { id: 'products', name: 'Products', icon: TrendingUp, testId: 'nav-products', roles: ['admin', 'supervisor'] },
    { id: 'brands', name: 'Brands', icon: Tag, testId: 'nav-brands', roles: ['admin', 'supervisor'] },
    { id: 'variants', name: 'Brand Variants', icon: GitBranch, testId: 'nav-variants', roles: ['admin', 'supervisor'] },
    { id: 'images', name: 'Product Images', icon: ImageIcon, testId: 'nav-images', roles: ['admin', 'supervisor'] },
    { id: 'users', name: 'Users', icon: Users, testId: 'nav-users', roles: ['admin'] },
  ];

  const filteredModules = modules.filter(module => module.roles.includes(userRole));

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-sm hover:bg-muted shadow-sm"
        data-testid="mobile-menu-toggle"
      >
        {isMobileOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
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
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    onModuleChange(module.id);
                    setIsMobileOpen(false);
                  }}
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
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}