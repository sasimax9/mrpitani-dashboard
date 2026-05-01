import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit, Search, Plus, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'storage', label: 'Storage' },
  { key: 'prep', label: 'Prep' },
  { key: 'order', label: 'Order Type' },
  { key: 'pack_sizes', label: 'Pack Sizes' },
  { key: 'bulk_available', label: 'Bulk Available' },
  { key: 'brand_name', label: 'Brand' },
  { key: 'price', label: 'Price' },
  { key: 'date', label: 'Created' },
  { key: 'actions', label: 'Actions' },
];

export default function ProductsTable() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'name', 'category', 'brand_name', 'price', 'actions']);
  const [categories, setCategories] = useState([]);
  const limit = 50;
  const [newProduct, setNewProduct] = useState({
    id: '', name: '', category: 'general', type: 'veg', storage: 'frozen', prep: 'raw', order: 'both', pack_sizes: [], bulk_available: false, price: '', brand_id: ''
  });

  useEffect(() => {
    axios.get(`${API}/products/categories`).then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const [productsRes, brandsRes] = await Promise.all([
        axios.get(`${API}/products?${params.toString()}`),
        axios.get(`${API}/brands?page=1&limit=100`)
      ]);
      setProducts(productsRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, searchQuery, page, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setNewPrice(product.price.toString());
  };

  const handleUpdatePrice = async () => {
    if (!editingProduct || !newPrice) return;
    try {
      await axios.patch(`${API}/products/${editingProduct.id}/price`, { price: parseFloat(newPrice) });
      toast.success('Product price updated successfully');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product price');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.id || !newProduct.name || !newProduct.price) {
      toast.error('ID, Name, and Price are required');
      return;
    }
    try {
      await axios.post(`${API}/products`, { ...newProduct, price: parseFloat(newProduct.price), pack_sizes: newProduct.pack_sizes.filter(s => s.trim() !== '') });
      toast.success('Product created successfully');
      setShowAddDialog(false);
      setNewProduct({ id: '', name: '', category: 'general', type: 'veg', storage: 'frozen', prep: 'raw', order: 'both', pack_sizes: [], bulk_available: false, price: '', brand_id: '' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
    }
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
    <div className="space-y-4" data-testid="products-table-container">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
              <SelectTrigger className="rounded-sm border-input" data-testid="category-filter" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 rounded-sm border-input" data-testid="product-search-input" />
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={() => setShowAddDialog(true)} className="w-full bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="add-product-button">
              <Plus className="h-4 w-4 mr-2" /> Add Product
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
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No products found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Product ID</TableHead>}
                    {visibleColumns.includes('name') && <SortableHeader column="name">Name</SortableHeader>}
                    {visibleColumns.includes('category') && <SortableHeader column="category">Category</SortableHeader>}
                    {visibleColumns.includes('type') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Type</TableHead>}
                    {visibleColumns.includes('storage') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Storage</TableHead>}
                    {visibleColumns.includes('prep') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Prep</TableHead>}
                    {visibleColumns.includes('order') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Order Type</TableHead>}
                    {visibleColumns.includes('pack_sizes') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Pack Sizes</TableHead>}
                    {visibleColumns.includes('bulk_available') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Bulk</TableHead>}
                    {visibleColumns.includes('brand_name') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>}
                    {visibleColumns.includes('price') && <SortableHeader column="price">Price</SortableHeader>}
                    {visibleColumns.includes('date') && <SortableHeader column="created_at">Created</SortableHeader>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`product-row-${product.id}`}>
                      {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{product.id}</TableCell>}
                      {visibleColumns.includes('name') && <TableCell className="text-sm font-medium">{product.name}</TableCell>}
                      {visibleColumns.includes('category') && <TableCell className="text-sm"><span className="px-2 py-1 bg-muted rounded-sm text-xs">{product.category}</span></TableCell>}
                      {visibleColumns.includes('type') && <TableCell className="text-sm">{product.type || '-'}</TableCell>}
                      {visibleColumns.includes('storage') && <TableCell className="text-sm">{product.storage || '-'}</TableCell>}
                      {visibleColumns.includes('prep') && <TableCell className="text-sm">{product.prep || '-'}</TableCell>}
                      {visibleColumns.includes('order') && <TableCell className="text-sm">{product.order || '-'}</TableCell>}
                      {visibleColumns.includes('pack_sizes') && <TableCell className="text-sm">{(product.pack_sizes || []).join(', ') || '-'}</TableCell>}
                      {visibleColumns.includes('bulk_available') && <TableCell className="text-sm">{product.bulk_available ? 'Yes' : 'No'}</TableCell>}
                      {visibleColumns.includes('brand_name') && <TableCell className="text-sm text-muted-foreground">{product.brand_name || 'N/A'}</TableCell>}
                      {visibleColumns.includes('price') && <TableCell className="text-sm font-medium">₹{product.price}</TableCell>}
                      {visibleColumns.includes('date') && <TableCell className="text-sm text-muted-foreground">{product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}</TableCell>}
                      {visibleColumns.includes('actions') && (
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(product)} className="rounded-sm border-border hover:bg-muted h-8 px-3" data-testid={`edit-product-${product.id}`}>
                            <Edit className="h-4 w-4 mr-1" /> Edit Price
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">Page {page} • Showing {products.length} products</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={products.length < limit} className="rounded-sm">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="edit-price-dialog">
          <DialogHeader><DialogTitle className="font-heading text-xl">Update Product Price</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Product Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{editingProduct?.name}</p>
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium">New Price (₹)</Label>
              <Input id="price" type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="mt-2 rounded-sm border-input" data-testid="new-price-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)} className="rounded-sm border-border" data-testid="cancel-price-update">Cancel</Button>
            <Button onClick={handleUpdatePrice} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-price-update">Update Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border rounded-sm max-h-[90vh] overflow-y-auto" data-testid="add-product-dialog">
          <DialogHeader><DialogTitle className="font-heading text-xl">Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-id" className="text-sm font-medium">Product ID *</Label>
                <Input id="product-id" value={newProduct.id} onChange={(e) => setNewProduct({ ...newProduct, id: e.target.value })} placeholder="prod-001" className="mt-2 rounded-sm border-input" data-testid="product-id-input" />
              </div>
              <div>
                <Label htmlFor="product-name" className="text-sm font-medium">Product Name *</Label>
                <Input id="product-name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Fresh Tomatoes" className="mt-2 rounded-sm border-input" data-testid="product-name-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                  <SelectTrigger className="mt-2 rounded-sm border-input" style={{ backgroundColor: 'white' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                <Select value={newProduct.type} onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}>
                  <SelectTrigger className="mt-2 rounded-sm border-input" style={{ backgroundColor: 'white' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non-veg">Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price" className="text-sm font-medium">Price (₹) *</Label>
                <Input id="product-price" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" className="mt-2 rounded-sm border-input" data-testid="product-price-input" />
              </div>
              <div>
                <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                <Select value={newProduct.brand_id} onValueChange={(value) => setNewProduct({ ...newProduct, brand_id: value })}>
                  <SelectTrigger className="mt-2 rounded-sm border-input" style={{ backgroundColor: 'white' }}><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pack-sizes" className="text-sm font-medium">Pack Sizes (comma-separated)</Label>
              <Input id="pack-sizes" value={newProduct.pack_sizes.join(', ')} onChange={(e) => setNewProduct({ ...newProduct, pack_sizes: e.target.value.split(',').map(s => s.trim()) })} placeholder="1kg, 5kg, 10kg" className="mt-2 rounded-sm border-input" data-testid="pack-sizes-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-sm border-border">Cancel</Button>
            <Button onClick={handleAddProduct} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-add-product">Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
