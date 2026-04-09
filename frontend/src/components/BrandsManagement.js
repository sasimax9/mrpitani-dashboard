import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'id', label: 'Brand ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'products_count', label: 'Products' },
  { key: 'actions', label: 'Actions' },
];

export default function BrandsManagement() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBrand, setNewBrand] = useState({ id: '', name: '', slug: '' });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(['id', 'name', 'slug', 'products_count', 'actions']);
  const limit = 50;

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/brands?${params.toString()}`);
      setBrands(response.data);
    } catch (error) {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page, sortBy, sortOrder, searchQuery]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleAddBrand = async () => {
    if (!newBrand.id || !newBrand.name || !newBrand.slug) {
      toast.error('All fields are required');
      return;
    }
    try {
      await axios.post(`${API}/brands`, newBrand);
      toast.success('Brand created successfully');
      setShowAddDialog(false);
      setNewBrand({ id: '', name: '', slug: '' });
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create brand');
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await axios.delete(`${API}/brands/${brandId}`);
      toast.success('Brand deleted successfully');
      fetchBrands();
    } catch (error) {
      toast.error('Failed to delete brand');
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
    <div className="space-y-4" data-testid="brands-management">
      {/* Header + Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search brands..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 rounded-sm border-input" data-testid="brand-search-input" />
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={() => setShowAddDialog(true)} className="w-full bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="add-brand-button">
              <Plus className="h-4 w-4 mr-2" /> Add Brand
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
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No brands found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {visibleColumns.includes('id') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand ID</TableHead>}
                    {visibleColumns.includes('name') && <SortableHeader column="name">Name</SortableHeader>}
                    {visibleColumns.includes('slug') && <SortableHeader column="slug">Slug</SortableHeader>}
                    {visibleColumns.includes('products_count') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Products</TableHead>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`brand-row-${brand.id}`}>
                      {visibleColumns.includes('id') && <TableCell className="text-sm font-mono">{brand.id}</TableCell>}
                      {visibleColumns.includes('name') && <TableCell className="text-sm font-medium">{brand.name}</TableCell>}
                      {visibleColumns.includes('slug') && <TableCell className="text-sm text-muted-foreground">{brand.slug}</TableCell>}
                      {visibleColumns.includes('products_count') && <TableCell className="text-sm">{brand.products_count}</TableCell>}
                      {visibleColumns.includes('actions') && (
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBrand(brand.id)} className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3" data-testid={`delete-brand-${brand.id}`}>
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
              <div className="text-sm text-muted-foreground">Page {page} • Showing {brands.length} brands</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={brands.length < limit} className="rounded-sm">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Brand Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="add-brand-dialog">
          <DialogHeader><DialogTitle className="font-heading text-xl">Add New Brand</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="brand-id" className="text-sm font-medium">Brand ID</Label>
              <Input id="brand-id" value={newBrand.id} onChange={(e) => setNewBrand({ ...newBrand, id: e.target.value })} placeholder="brand-001" className="mt-2 rounded-sm border-input" data-testid="brand-id-input" />
            </div>
            <div>
              <Label htmlFor="brand-name" className="text-sm font-medium">Brand Name</Label>
              <Input id="brand-name" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} placeholder="Fresh Farms" className="mt-2 rounded-sm border-input" data-testid="brand-name-input" />
            </div>
            <div>
              <Label htmlFor="brand-slug" className="text-sm font-medium">Slug</Label>
              <Input id="brand-slug" value={newBrand.slug} onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })} placeholder="fresh-farms" className="mt-2 rounded-sm border-input" data-testid="brand-slug-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-sm border-border">Cancel</Button>
            <Button onClick={handleAddBrand} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-add-brand">Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
