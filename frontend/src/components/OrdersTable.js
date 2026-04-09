import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'date', label: 'Date' },
  { key: 'actions', label: 'Actions' }
];

export default function OrdersTable({ onUpdate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'customer', 'total', 'status', 'date', 'actions']);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const limit = 50;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

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
  }, [statusFilter, dateFrom, dateTo, page, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

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

      const response = await axios.get(`${API}/orders/export?${params.toString()}`, { responseType: 'blob' });
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
      <span className={`px-3 py-1 rounded-sm text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const SortableHeader = ({ column, children }) => (
    <TableHead
      className="text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const visibleCount = visibleColumns.filter(c => c !== 'actions').length + (visibleColumns.includes('actions') ? 1 : 0);

  return (
    <div className="space-y-4" data-testid="orders-table-container">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="rounded-sm border-input" data-testid="status-filter" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Date From</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-sm border-input" data-testid="date-from-filter" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Date To</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-sm border-input" data-testid="date-to-filter" />
          </div>
          <div className="flex items-end">
            <Button onClick={exportOrders} variant="outline" className="w-full rounded-sm border-border hover:bg-muted" data-testid="export-orders-button">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
          <div className="flex items-end">
            <ColumnChooser columns={ALL_COLUMNS} visibleColumns={visibleColumns} onToggleColumn={toggleColumn} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={10} columns={6} /></div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-10"></TableHead>
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Order ID</TableHead>}
                    {visibleColumns.includes('customer') && <SortableHeader column="delivery_name">Customer</SortableHeader>}
                    {visibleColumns.includes('phone') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Phone</TableHead>}
                    {visibleColumns.includes('address') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Address</TableHead>}
                    {visibleColumns.includes('total') && <SortableHeader column="total">Total</SortableHeader>}
                    {visibleColumns.includes('status') && <SortableHeader column="status">Status</SortableHeader>}
                    {visibleColumns.includes('payment_method') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Payment</TableHead>}
                    {visibleColumns.includes('date') && <SortableHeader column="created_at">Date</SortableHeader>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <>
                      <TableRow key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" data-testid={`order-row-${order.id}`} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <TableCell className="w-10">
                          {order.order_items && order.order_items.length > 0 && (
                            expandedOrder === order.id
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{order.id.slice(0, 8)}</TableCell>}
                        {visibleColumns.includes('customer') && (
                          <TableCell className="text-sm"><div className="font-medium">{order.delivery_name || 'N/A'}</div></TableCell>
                        )}
                        {visibleColumns.includes('phone') && <TableCell className="text-sm text-muted-foreground">{order.delivery_phone}</TableCell>}
                        {visibleColumns.includes('address') && <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{order.delivery_address}</TableCell>}
                        {visibleColumns.includes('total') && <TableCell className="text-sm font-medium">₹{order.total}</TableCell>}
                        {visibleColumns.includes('status') && <TableCell>{getStatusBadge(order.status)}</TableCell>}
                        {visibleColumns.includes('payment_method') && <TableCell className="text-sm">{order.payment_method}</TableCell>}
                        {visibleColumns.includes('date') && <TableCell className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>}
                        {visibleColumns.includes('actions') && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => updateStatus(order.id, 'approved')} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm h-8 px-3" data-testid={`approve-order-${order.id}`}>
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'rejected')} className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3" data-testid={`reject-order-${order.id}`}>
                                    <X className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {order.status === 'approved' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'completed')} className="bg-success-dark hover:bg-[#1C2922] text-white rounded-sm h-8 px-3" data-testid={`complete-order-${order.id}`}>
                                  <Check className="h-4 w-4 mr-1" /> Complete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Expanded Order Items */}
                      {expandedOrder === order.id && order.order_items && order.order_items.length > 0 && (
                        <TableRow key={`${order.id}-items`} className="bg-muted/10">
                          <TableCell colSpan={visibleColumns.length + 1} className="p-0">
                            <div className="px-8 py-4 border-l-4 border-primary/40">
                              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Order Items ({order.order_items.length})
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                                    <th className="text-left py-2 pr-4">Product</th>
                                    <th className="text-left py-2 pr-4">Brand</th>
                                    <th className="text-left py-2 pr-4">Pack Size</th>
                                    <th className="text-right py-2 pr-4">Qty</th>
                                    <th className="text-right py-2 pr-4">Unit Price</th>
                                    <th className="text-right py-2">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.order_items.map((item) => (
                                    <tr key={item.id} className="border-b border-border/50" data-testid={`order-item-inline-${item.id}`}>
                                      <td className="py-2 pr-4 font-medium">{item.product_name}</td>
                                      <td className="py-2 pr-4 text-muted-foreground">{item.brand_name || 'N/A'}</td>
                                      <td className="py-2 pr-4">{item.pack_size || 'N/A'}</td>
                                      <td className="py-2 pr-4 text-right">{item.quantity}</td>
                                      <td className="py-2 pr-4 text-right">₹{item.unit_price}</td>
                                      <td className="py-2 text-right font-medium">₹{item.total_price}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">Page {page} • Showing {orders.length} orders</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < limit} className="rounded-sm">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
