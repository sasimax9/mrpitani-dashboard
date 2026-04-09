import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OrdersTable({ onUpdate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${API}/orders?${params.toString()}`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFrom, dateTo]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order ${newStatus} successfully`);
      fetchOrders();
      onUpdate();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const exportOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${API}/orders/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Orders exported successfully');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-warning-light text-warning-dark',
      approved: 'bg-blue-50 text-blue-700',
      completed: 'bg-success-light text-success-dark',
      rejected: 'bg-red-50 text-red-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-sm text-xs font-medium ${styles[status] || ''}`}
        data-testid={`order-status-${status}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4" data-testid="orders-table-container">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-sm border-input" data-testid="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Date From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-sm border-input"
              data-testid="date-from-filter"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Date To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-sm border-input"
              data-testid="date-to-filter"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={exportOrders}
              variant="outline"
              className="w-full rounded-sm border-border hover:bg-muted"
              data-testid="export-orders-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Order ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Total</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-b border-border" data-testid={`order-row-${order.id}`}>
                  <TableCell className="text-sm font-mono">{order.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <div className="font-medium">{order.delivery_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{order.delivery_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">₹{order.total}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(order.id, 'approved')}
                            className="bg-primary hover:bg-[#1C2922] text-white rounded-sm h-8 px-3"
                            data-testid={`approve-order-${order.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(order.id, 'rejected')}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3"
                            data-testid={`reject-order-${order.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="bg-success-dark hover:bg-[#1C2922] text-white rounded-sm h-8 px-3"
                          data-testid={`complete-order-${order.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}