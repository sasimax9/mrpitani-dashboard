import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import StatsCards from '@/components/StatsCards';
import OrdersTable from '@/components/OrdersTable';
import BulkOrdersTable from '@/components/BulkOrdersTable';
import ProductsTable from '@/components/ProductsTable';
import OrdersChart from '@/components/OrdersChart';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem('email');

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCFDFB' }} data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              CRM Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{email}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="rounded-sm border-border hover:bg-muted"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Chart */}
            <div className="bg-card border border-border rounded-sm p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading mb-6">
                Orders & Earnings (Last 7 Days)
              </h2>
              <OrdersChart data={chartData} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="bg-muted rounded-sm" data-testid="dashboard-tabs">
                <TabsTrigger value="orders" className="rounded-sm" data-testid="orders-tab">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="bulk-orders" className="rounded-sm" data-testid="bulk-orders-tab">
                  <Package className="h-4 w-4 mr-2" />
                  Bulk Orders
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-sm" data-testid="products-tab">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Products
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                <OrdersTable onUpdate={fetchDashboardData} />
              </TabsContent>

              <TabsContent value="bulk-orders" className="space-y-4">
                <BulkOrdersTable onUpdate={fetchDashboardData} />
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <ProductsTable />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}