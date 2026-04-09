import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown, Edit } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Variant ID' },
  { key: 'product_name', label: 'Product' },
  { key: 'brand_name', label: 'Brand' },
  { key: 'price', label: 'Price' },
  { key: 'actions', label: 'Actions' },
];

export default function ProductBrandVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariant, setNewVariant] = useState({ product_id: '', brand_id: '', price: '' });
  const [editingVariant, setEditingVariant] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'product_name', 'brand_name', 'price', 'actions']);
  const limit = 50;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const [variantsRes, productsRes, brandsRes] = await Promise.all([
        axios.get(`${API}/product-brand-variants?${params.toString()}`),
        axios.get(`${API}/products?page=1&limit=200`),
        axios.get(`${API}/brands?page=1&limit=200`)
      ]);
      setVariants(variantsRes.data);
      setProducts(productsRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleAddVariant = async () => {
    if (!newVariant.product_id || !newVariant.brand_id || !newVariant.price) {
      toast.error('All fields are required');
      return;
    }
    try {
      await axios.post(`${API}/product-brand-variants`, { ...newVariant, price: parseFloat(newVariant.price) });
      toast.success('Variant created successfully');
      setShowAddDialog(false);
      setNewVariant({ product_id: '', brand_id: '', price: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create variant');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      await axios.delete(`${API}/product-brand-variants/${variantId}`);
      toast.success('Variant deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete variant');
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
    <div className="space-y-4" data-testid="product-brand-variants">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search product or brand..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 rounded-sm border-input" data-testid="variants-search-input" />
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={() => setShowAddDialog(true)} className="w-full bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="add-variant-button">
              <Plus className="h-4 w-4 mr-2" /> Add Variant
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
          <div className="p-6"><TableSkeleton rows={10} columns={5} /></div>
        ) : variants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No variants found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Variant ID</TableHead>}
                    {visibleColumns.includes('product_name') && <SortableHeader column="product_name">Product</SortableHeader>}
                    {visibleColumns.includes('brand_name') && <SortableHeader column="brand_name">Brand</SortableHeader>}
                    {visibleColumns.includes('price') && <SortableHeader column="price">Price</SortableHeader>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`variant-row-${variant.id}`}>
                      {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{variant.id}</TableCell>}
                      {visibleColumns.includes('product_name') && <TableCell className="text-sm font-medium">{variant.product_name}</TableCell>}
                      {visibleColumns.includes('brand_name') && <TableCell className="text-sm">{variant.brand_name}</TableCell>}
                      {visibleColumns.includes('price') && <TableCell className="text-sm font-medium">₹{variant.price}</TableCell>}
                      {visibleColumns.includes('actions') && (
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteVariant(variant.id)} className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3" data-testid={`delete-variant-${variant.id}`}>
                            <Trash2 className="h-4 w-4" />
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
              <div className="text-sm text-muted-foreground">Page {page} • Showing {variants.length} variants</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={variants.length < limit} className="rounded-sm">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Variant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="add-variant-dialog">
          <DialogHeader><DialogTitle className="font-heading text-xl">Add Brand Variant</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="variant-product" className="text-sm font-medium">Product</Label>
              <Select value={newVariant.product_id} onValueChange={(value) => setNewVariant({ ...newVariant, product_id: value })}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="variant-product-select" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-brand" className="text-sm font-medium">Brand</Label>
              <Select value={newVariant.brand_id} onValueChange={(value) => setNewVariant({ ...newVariant, brand_id: value })}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="variant-brand-select" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-price" className="text-sm font-medium">Price (₹)</Label>
              <Input id="variant-price" type="number" step="0.01" value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })} placeholder="0.00" className="mt-2 rounded-sm border-input" data-testid="variant-price-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-sm border-border">Cancel</Button>
            <Button onClick={handleAddVariant} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-add-variant">Add Variant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
