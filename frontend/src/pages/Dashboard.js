import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import OrdersTable from '@/components/OrdersTable';
import BulkOrdersTable from '@/components/BulkOrdersTable';
import ProductsTable from '@/components/ProductsTable';
import OrdersChart from '@/components/OrdersChart';
import BrandsManagement from '@/components/BrandsManagement';
import OrderItemsTable from '@/components/OrderItemsTable';
import ProductBrandVariants from '@/components/ProductBrandVariants';
import UsersManagement from '@/components/UsersManagement';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ onLogout }) {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/chart-data?days=7`),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderContent = () => {
    if (loading && activeModule === 'dashboard') {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground font-heading mb-6">
                Overview
              </h2>
              <StatsCards stats={stats} />
            </div>

            {/* Chart */}
            <div className="bg-card border border-border rounded-sm p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading mb-6">
                Orders & Earnings (Last 7 Days)
              </h2>
              <OrdersChart data={chartData} />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground font-heading mb-6">
              Orders Management
            </h2>
            <OrdersTable onUpdate={fetchDashboardData} />
          </div>
        );

      case 'bulk-orders':
        return (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground font-heading mb-6">
              Bulk Orders Management
            </h2>
            <BulkOrdersTable onUpdate={fetchDashboardData} />
          </div>
        );

      case 'order-items':
        return <OrderItemsTable />;

      case 'products':
        return (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground font-heading mb-6">
              Products Management
            </h2>
            <ProductsTable />
          </div>
        );

      case 'brands':
        return <BrandsManagement />;

      case 'variants':
        return <ProductBrandVariants />;

      case 'users':
        return <UsersManagement />;

      default:
        return null;
    }
  };

  const getModuleTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      orders: 'Orders',
      'bulk-orders': 'Bulk Orders',
      'order-items': 'Order Items',
      products: 'Products',
      brands: 'Brands',
      variants: 'Brand Variants',
      users: 'Users',
    };
    return titles[activeModule] || 'Dashboard';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCFDFB' }} data-testid="dashboard-page">
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={onLogout}
        userRole={role}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground font-heading">
                  {getModuleTitle()}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{email}</p>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-sm">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{fullName || email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
