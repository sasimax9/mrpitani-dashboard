import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OrderItemsTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/order-items`);
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load order items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, []);

  return (
    <div className="space-y-4" data-testid="order-items-table">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading">
          Order Items
        </h2>
        <p className="text-sm text-muted-foreground mt-1">All items from orders</p>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading order items...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No order items found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Item ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Product</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Pack Size</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Quantity</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Unit Price</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-b border-border" data-testid={`order-item-${item.id}`}>
                  <TableCell className="text-sm font-mono">{item.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.brand_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{item.pack_size || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-sm font-medium">₹{item.unit_price}</TableCell>
                  <TableCell className="text-sm font-medium">₹{item.total_price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}