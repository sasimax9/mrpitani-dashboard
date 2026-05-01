import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Item ID' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'product_name', label: 'Product' },
  { key: 'brand_name', label: 'Brand' },
  { key: 'pack_size', label: 'Pack Size' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit_price', label: 'Unit Price' },
  { key: 'total_price', label: 'Total' },
];

export default function OrderItemsTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'product_name', 'brand_name', 'pack_size', 'quantity', 'unit_price', 'total_price']);
  const limit = 50;

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const response = await axios.get(`${API}/order-items?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load order items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, [searchQuery, page, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortableHeader = ({ column, children }) => (
    <TableHead className="text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column)}>
      <div className="flex items-center gap-2">{children}<ArrowUpDown className="h-3 w-3" /></div>
    </TableHead>
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]);
  };

  return (
    <div className="space-y-4" data-testid="order-items-table">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search product or brand..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 rounded-sm border-input" data-testid="order-items-search-input" />
            </div>
          </div>

          <div className="flex items-end">
            <ColumnChooser columns={ALL_COLUMNS} visibleColumns={visibleColumns} onToggleColumn={toggleColumn} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={10} columns={7} /></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No order items found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Item ID</TableHead>}
                    {visibleColumns.includes('product_id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Product ID</TableHead>}
                    {visibleColumns.includes('product_name') && <SortableHeader column="product_name">Product</SortableHeader>}
                    {visibleColumns.includes('brand_name') && <SortableHeader column="brand_name">Brand</SortableHeader>}
                    {visibleColumns.includes('pack_size') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Pack Size</TableHead>}
                    {visibleColumns.includes('quantity') && <SortableHeader column="quantity">Quantity</SortableHeader>}
                    {visibleColumns.includes('unit_price') && <SortableHeader column="unit_price">Unit Price</SortableHeader>}
                    {visibleColumns.includes('total_price') && <SortableHeader column="total_price">Total</SortableHeader>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`order-item-${item.id}`}>
                      {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{item.id.slice(0, 8)}</TableCell>}
                      {visibleColumns.includes('product_id') && <TableCell className="text-sm font-mono text-muted-foreground">{item.product_id}</TableCell>}
                      {visibleColumns.includes('product_name') && <TableCell className="text-sm font-medium">{item.product_name}</TableCell>}
                      {visibleColumns.includes('brand_name') && <TableCell className="text-sm text-muted-foreground">{item.brand_name || 'N/A'}</TableCell>}
                      {visibleColumns.includes('pack_size') && <TableCell className="text-sm">{item.pack_size || 'N/A'}</TableCell>}
                      {visibleColumns.includes('quantity') && <TableCell className="text-sm">{item.quantity}</TableCell>}
                      {visibleColumns.includes('unit_price') && <TableCell className="text-sm font-medium">₹{item.unit_price}</TableCell>}
                      {visibleColumns.includes('total_price') && <TableCell className="text-sm font-medium">₹{item.total_price}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">Page {page} • Showing {items.length} items</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={items.length < limit} className="rounded-sm">
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
