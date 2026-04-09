import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductsTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, searchQuery]);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setNewPrice(product.price.toString());
  };

  const handleUpdatePrice = async () => {
    if (!editingProduct || !newPrice) return;

    try {
      await axios.patch(`${API}/products/${editingProduct.id}/price`, {
        price: parseFloat(newPrice),
      });
      toast.success('Product price updated successfully');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product price');
    }
  };

  return (
    <div className="space-y-4" data-testid="products-table-container">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Category
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-sm border-input" data-testid="category-filter">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-sm border-input"
                data-testid="product-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No products found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Product ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Price</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-b border-border" data-testid={`product-row-${product.id}`}>
                  <TableCell className="text-sm font-mono">{product.id}</TableCell>
                  <TableCell className="text-sm font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm">
                    <span className="px-2 py-1 bg-muted rounded-sm text-xs">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.brand_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm font-medium">${product.price}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(product)}
                      className="rounded-sm border-border hover:bg-muted h-8 px-3"
                      data-testid={`edit-product-${product.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Price
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="edit-price-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Update Product Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Product Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{editingProduct?.name}</p>
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                New Price ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-2 rounded-sm border-input"
                data-testid="new-price-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProduct(null)}
              className="rounded-sm border-border"
              data-testid="cancel-price-update"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePrice}
              className="bg-primary hover:bg-[#1C2922] text-white rounded-sm"
              data-testid="confirm-price-update"
            >
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}