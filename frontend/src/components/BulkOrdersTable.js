import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { format } from 'date-fns';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';
import { supabase } from '../lib/supabase';
import { requestNotificationPermission, notifyNewOrder, notifyOrderUpdate } from '../lib/notifications';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'company_name', label: 'Company' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_phone', label: 'Phone' },
  { key: 'contact_email', label: 'Email' },
  { key: 'total_weight_kg', label: 'Weight (kg)' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'discount_percent', label: 'Discount %' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'date', label: 'Date' },
  { key: 'actions', label: 'Actions' },
];

export default function BulkOrdersTable({ onUpdate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'company_name', 'contact_name', 'total', 'status', 'date', 'actions']);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [liveEvent, setLiveEvent] = useState(null);
  const limit = 50;
  const channelRef = useRef(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const response = await axios.get(`${API}/bulk-orders?${params.toString()}`);
      setOrders(response.data);
    } catch (error) {
      if (!silent) toast.error('Failed to load bulk orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Supabase Realtime subscription
  useEffect(() => {
    requestNotificationPermission();

    const channel = supabase
      .channel('bulk-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bulk_orders' }, (payload) => {
        const eventType = payload.eventType;
        if (eventType === 'INSERT') {
          const name = payload.new?.contact_name || payload.new?.company_name || '';
          const total = payload.new?.total || '';
          toast.success('New bulk order received!', { duration: 5000 });
          notifyNewOrder('bulk', name ? `${name} — ₹${total}` : undefined);
          setLiveEvent('new');
        } else if (eventType === 'UPDATE') {
          toast.info('Bulk order updated', { duration: 3000 });
          notifyOrderUpdate('bulk');
          setLiveEvent('update');
        } else if (eventType === 'DELETE') {
          toast.info('Bulk order removed', { duration: 3000 });
          setLiveEvent('delete');
        }
        fetchOrders(true);
        if (onUpdate) onUpdate();
        setTimeout(() => setLiveEvent(null), 3000);
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchOrders, onUpdate]);

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
      await axios.patch(`${API}/bulk-orders/${orderId}/status`, { status: newStatus });
      toast.success(`Bulk order ${newStatus} successfully`);
      fetchOrders();
      onUpdate();
    } catch (error) {
      toast.error('Failed to update bulk order status');
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

  const getItemLabel = (item) => item.product_name || item.name || item.product || item.item_name || 'Item';
  const getItemUnit = (item) => item.pack_size || item.unit || item.uom || '-';
  const getItemQuantity = (item) => item.quantity_kg ?? item.quantity ?? item.qty ?? '-';
  const getItemTotal = (item) => {
    const value = item.total_price ?? item.total ?? item.amount;
    return value ?? '-';
  };

  return (
    <div className="space-y-4" data-testid="bulk-orders-table-container">
      {/* Live indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium ${isLive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground border border-border'}`} data-testid="bulk-orders-live-indicator">
          <span className={`inline-block w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></span>
          {isLive ? 'Live' : 'Connecting...'}
        </div>
        {liveEvent && (
          <span className={`px-3 py-1.5 rounded-sm text-xs font-medium animate-pulse ${liveEvent === 'new' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} data-testid="bulk-orders-live-event">
            {liveEvent === 'new' ? 'New bulk order received' : liveEvent === 'update' ? 'Bulk order updated' : 'Bulk order removed'}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="rounded-sm border-input" data-testid="bulk-status-filter" style={{ backgroundColor: 'white' }}>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search company/contact..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10 rounded-sm border-input"
                data-testid="bulk-search-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Date From</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-sm border-input" data-testid="bulk-date-from-filter" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Date To</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-sm border-input" data-testid="bulk-date-to-filter" />
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
          <div className="p-8 text-center text-muted-foreground">No bulk orders found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-10"></TableHead>
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Order ID</TableHead>}
                    {visibleColumns.includes('company_name') && <SortableHeader column="company_name">Company</SortableHeader>}
                    {visibleColumns.includes('contact_name') && <SortableHeader column="contact_name">Contact</SortableHeader>}
                    {visibleColumns.includes('contact_phone') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Phone</TableHead>}
                    {visibleColumns.includes('contact_email') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Email</TableHead>}
                    {visibleColumns.includes('total_weight_kg') && <SortableHeader column="total_weight_kg">Weight (kg)</SortableHeader>}
                    {visibleColumns.includes('subtotal') && <SortableHeader column="subtotal">Subtotal</SortableHeader>}
                    {visibleColumns.includes('discount_percent') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Discount %</TableHead>}
                    {visibleColumns.includes('total') && <SortableHeader column="total">Total</SortableHeader>}
                    {visibleColumns.includes('status') && <SortableHeader column="status">Status</SortableHeader>}
                    {visibleColumns.includes('notes') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Notes</TableHead>}
                    {visibleColumns.includes('date') && <SortableHeader column="created_at">Date</SortableHeader>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <TableRow
                        className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                        data-testid={`bulk-order-row-${order.id}`}
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <TableCell className="w-10">
                          {order.items && order.items.length > 0 && (
                            expandedOrder === order.id
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{order.id.slice(0, 8)}</TableCell>}
                        {visibleColumns.includes('company_name') && <TableCell className="text-sm font-medium">{order.company_name || 'N/A'}</TableCell>}
                        {visibleColumns.includes('contact_name') && <TableCell className="text-sm">{order.contact_name}</TableCell>}
                        {visibleColumns.includes('contact_phone') && <TableCell className="text-sm text-muted-foreground">{order.contact_phone}</TableCell>}
                        {visibleColumns.includes('contact_email') && <TableCell className="text-sm text-muted-foreground">{order.contact_email || 'N/A'}</TableCell>}
                        {visibleColumns.includes('total_weight_kg') && <TableCell className="text-sm">{order.total_weight_kg}</TableCell>}
                        {visibleColumns.includes('subtotal') && <TableCell className="text-sm">₹{order.subtotal}</TableCell>}
                        {visibleColumns.includes('discount_percent') && <TableCell className="text-sm">{order.discount_percent}%</TableCell>}
                        {visibleColumns.includes('total') && <TableCell className="text-sm font-medium">₹{order.total}</TableCell>}
                        {visibleColumns.includes('status') && <TableCell>{getStatusBadge(order.status)}</TableCell>}
                        {visibleColumns.includes('notes') && <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{order.notes || '-'}</TableCell>}
                        {visibleColumns.includes('date') && <TableCell className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>}
                        {visibleColumns.includes('actions') && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => updateStatus(order.id, 'approved')} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm h-8 px-3" data-testid={`approve-bulk-order-${order.id}`}>
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'rejected')} className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3" data-testid={`reject-bulk-order-${order.id}`}>
                                    <X className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {order.status === 'approved' && (
                                <Button size="sm" onClick={() => updateStatus(order.id, 'completed')} className="bg-success-dark hover:bg-[#1C2922] text-white rounded-sm h-8 px-3" data-testid={`complete-bulk-order-${order.id}`}>
                                  <Check className="h-4 w-4 mr-1" /> Complete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {expandedOrder === order.id && order.items && order.items.length > 0 && (
                        <TableRow className="bg-muted/10">
                          <TableCell colSpan={visibleColumns.length + 1} className="p-0">
                            <div className="px-8 py-4 border-l-4 border-primary/40">
                              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Bulk Order Items ({order.items.length})
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                                    <th className="text-left py-2 pr-4">Item</th>
                                    <th className="text-left py-2 pr-4">Unit</th>
                                    <th className="text-right py-2 pr-4">Qty</th>
                                    <th className="text-right py-2">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, index) => (
                                    <tr key={`${order.id}-item-${item.id || index}`} className="border-b border-border/50" data-testid={`bulk-order-item-inline-${order.id}-${index}`}>
                                      <td className="py-2 pr-4 font-medium">{getItemLabel(item)}</td>
                                      <td className="py-2 pr-4 text-muted-foreground">{getItemUnit(item)}</td>
                                      <td className="py-2 pr-4 text-right">{getItemQuantity(item)}</td>
                                      <td className="py-2 text-right font-medium">{getItemTotal(item)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">Page {page} • Showing {orders.length} bulk orders</div>
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
