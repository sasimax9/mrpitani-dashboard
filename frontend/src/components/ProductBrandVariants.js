import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductBrandVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariant, setNewVariant] = useState({ product_id: '', brand_id: '', price: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [variantsRes, productsRes, brandsRes] = await Promise.all([
        axios.get(`${API}/product-brand-variants`),
        axios.get(`${API}/products`),
        axios.get(`${API}/brands`)
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
  }, []);

  const handleAddVariant = async () => {
    if (!newVariant.product_id || !newVariant.brand_id || !newVariant.price) {
      toast.error('All fields are required');
      return;
    }

    try {
      await axios.post(`${API}/product-brand-variants`, {
        ...newVariant,
        price: parseFloat(newVariant.price)
      });
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

  return (
    <div className="space-y-4" data-testid="product-brand-variants">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading">
            Product Brand Variants
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage brand-specific product pricing</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-primary hover:bg-[#1C2922] text-white rounded-sm"
          data-testid="add-variant-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading variants...</div>
        ) : variants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No variants found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Product</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Price</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id} className="border-b border-border" data-testid={`variant-row-${variant.id}`}>
                  <TableCell className="text-sm font-medium">{variant.product_name}</TableCell>
                  <TableCell className="text-sm">{variant.brand_name}</TableCell>
                  <TableCell className="text-sm font-medium">₹{variant.price}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-8 px-3"
                      data-testid={`delete-variant-${variant.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Variant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="add-variant-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add Brand Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="variant-product" className="text-sm font-medium">Product</Label>
              <Select value={newVariant.product_id} onValueChange={(value) => setNewVariant({ ...newVariant, product_id: value })}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="variant-product-select">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-brand" className="text-sm font-medium">Brand</Label>
              <Select value={newVariant.brand_id} onValueChange={(value) => setNewVariant({ ...newVariant, brand_id: value })}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="variant-brand-select">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-price" className="text-sm font-medium">Price (₹)</Label>
              <Input
                id="variant-price"
                type="number"
                step="0.01"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                placeholder="0.00"
                className="mt-2 rounded-sm border-input"
                data-testid="variant-price-input"
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
              onClick={handleAddVariant}
              className="bg-primary hover:bg-[#1C2922] text-white rounded-sm"
              data-testid="confirm-add-variant"
            >
              Add Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}