import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BrandsManagement() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBrand, setNewBrand] = useState({ id: '', name: '', slug: '' });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const limit = 50;

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

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
  }, [page, sortBy, sortOrder]);

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

  return (
    <div className="space-y-4" data-testid="brands-management">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading">
            Brands Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage product brands</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-primary hover:bg-[#1C2922] text-white rounded-sm"
          data-testid="add-brand-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={10} columns={5} />
          </div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No brands found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand ID</TableHead>
                    <SortableHeader column="name">Name</SortableHeader>
                    <SortableHeader column="slug">Slug</SortableHeader>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Products</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="border-b border-border hover:bg-muted/30" data-testid={`brand-row-${brand.id}`}>
                      <TableCell className="text-sm font-mono">{brand.id}</TableCell>
                      <TableCell className="text-sm font-medium">{brand.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{brand.slug}</TableCell>
                      <TableCell className="text-sm">{brand.products_count}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3"
                          data-testid={`delete-brand-${brand.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {page} • Showing {brands.length} brands
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={brands.length < limit}
                  className="rounded-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Brand Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="add-brand-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add New Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="brand-id" className="text-sm font-medium">Brand ID</Label>
              <Input
                id="brand-id"
                value={newBrand.id}
                onChange={(e) => setNewBrand({ ...newBrand, id: e.target.value })}
                placeholder="brand-001"
                className="mt-2 rounded-sm border-input"
                data-testid="brand-id-input"
              />
            </div>
            <div>
              <Label htmlFor="brand-name" className="text-sm font-medium">Brand Name</Label>
              <Input
                id="brand-name"
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                placeholder="Fresh Farms"
                className="mt-2 rounded-sm border-input"
                data-testid="brand-name-input"
              />
            </div>
            <div>
              <Label htmlFor="brand-slug" className="text-sm font-medium">Slug</Label>
              <Input
                id="brand-slug"
                value={newBrand.slug}
                onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                placeholder="fresh-farms"
                className="mt-2 rounded-sm border-input"
                data-testid="brand-slug-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="rounded-sm border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBrand}
              className="bg-primary hover:bg-[#1C2922] text-white rounded-sm"
              data-testid="confirm-add-brand"
            >
              Add Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
