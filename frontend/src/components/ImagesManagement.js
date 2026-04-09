import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon, Search, Link2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Skeleton from '@/components/ui/skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ImagesManagement() {
  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, assigned, unassigned
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [assignDialog, setAssignDialog] = useState(null); // image path to assign
  const [assignProductId, setAssignProductId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imagesRes, productsRes] = await Promise.all([
        axios.get(`${API}/storage/images`),
        axios.get(`${API}/products-simple`)
      ]);
      setImages(imagesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadForProduct = async () => {
    if (!uploadFile || !selectedProductId) {
      toast.error('Please select a product and image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await axios.post(`${API}/products/${selectedProductId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Image uploaded and assigned to product');
      setShowUploadDialog(false);
      setUploadFile(null);
      setSelectedProductId('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignImage = async () => {
    if (!assignDialog || !assignProductId) {
      toast.error('Please select a product');
      return;
    }

    try {
      await axios.patch(`${API}/products/${assignProductId}/assign-image?image_path=${encodeURIComponent(assignDialog)}`);
      toast.success('Image assigned to product');
      setAssignDialog(null);
      setAssignProductId('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign image');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredImages = images.filter(img => {
    if (filter === 'assigned' && !img.product_id) return false;
    if (filter === 'unassigned' && img.product_id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        img.name.toLowerCase().includes(q) ||
        img.path.toLowerCase().includes(q) ||
        (img.product_name && img.product_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6" data-testid="images-management">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground font-heading">Product Images</h2>
          <p className="text-sm text-muted-foreground mt-1">Images from Supabase storage bucket • {images.length} total</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="upload-image-button">
          <Upload className="h-4 w-4 mr-2" /> Upload for Product
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search images or products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-sm border-input" data-testid="images-search-input" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Filter</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="rounded-sm border-input" style={{ backgroundColor: 'white' }} data-testid="images-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                <SelectItem value="all">All Images ({images.length})</SelectItem>
                <SelectItem value="assigned">Assigned to Product ({images.filter(i => i.product_id).length})</SelectItem>
                <SelectItem value="unassigned">Unassigned ({images.filter(i => !i.product_id).length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-sm overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No images found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image.path} className="bg-card border border-border rounded-sm overflow-hidden hover:shadow-lg transition-shadow duration-200" data-testid={`image-card-${image.path}`}>
              {/* Image */}
              <div className="aspect-square bg-muted relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2ExYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                {/* Product badge */}
                {image.product_id ? (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-sm font-medium">
                    {image.product_id}
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-sm font-medium">
                    Unassigned
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-foreground truncate" title={image.path}>{image.path}</p>
                {image.product_name && (
                  <p className="text-xs text-primary font-medium truncate" title={image.product_name}>
                    Product: {image.product_name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-sm border-border hover:bg-muted text-xs" onClick={() => window.open(image.url, '_blank')} data-testid={`view-image-${image.path}`}>
                    <ImageIcon className="h-3 w-3 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-sm border-border hover:bg-muted text-xs" onClick={() => { setAssignDialog(image.path); setAssignProductId(image.product_id || ''); }} data-testid={`assign-image-${image.path}`}>
                    <Link2 className="h-3 w-3 mr-1" /> Assign
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload for Product Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="upload-product-image-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Upload Image for Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="upload-product-select" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }} className="max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.id} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Image File</Label>
              <Input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} className="mt-2 rounded-sm border-input" data-testid="upload-file-input" />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF • Max 5MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="rounded-sm border-border">Cancel</Button>
            <Button onClick={handleUploadForProduct} disabled={uploading || !uploadFile || !selectedProductId} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-upload-image">
              {uploading ? 'Uploading...' : 'Upload & Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Image Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="bg-card border-border rounded-sm" data-testid="assign-image-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Assign Image to Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Image Path</Label>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{assignDialog}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Select Product</Label>
              <Select value={assignProductId} onValueChange={setAssignProductId}>
                <SelectTrigger className="mt-2 rounded-sm border-input" data-testid="assign-product-select" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }} className="max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.id} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)} className="rounded-sm border-border">Cancel</Button>
            <Button onClick={handleAssignImage} disabled={!assignProductId} className="bg-primary hover:bg-[#1C2922] text-white rounded-sm" data-testid="confirm-assign-image">
              <Check className="h-4 w-4 mr-1" /> Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
