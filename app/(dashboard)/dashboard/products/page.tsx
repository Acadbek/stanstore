'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Eye, EyeOff, Trash2, Pencil, LayoutGrid, List } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, toggleProductPublish } from './actions';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Product } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('@/components/editor/rich-editor'), {
  ssr: false,
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

function ProductForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initialData?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [descriptionHtml, setDescriptionHtml] = useState(
    initialData?.description || ''
  );

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState: ActionState, formData: FormData) => {
      const action = mode === 'create' ? createProduct : updateProduct;
      formData.set('description', descriptionHtml);
      const result = await action(prevState, formData);
      if ('success' in result && result.success) {
        mutate('/api/products');
        onSuccess?.();
      }
      return result;
    },
    {}
  );

  return (
    <Card className="border-2 border-orange-100">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Add New Product' : 'Edit Product'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Add a digital product, link, or booking to your store.'
            : 'Update your product details.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          {mode === 'edit' && initialData && (
            <input type="hidden" name="id" value={initialData.id} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="title" className="mb-2">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="My Awesome Product"
                defaultValue={initialData?.title || ''}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2">Description</Label>
              <RichEditor
                content={descriptionHtml}
                onChange={setDescriptionHtml}
                placeholder="Describe your product in detail..."
              />
            </div>
            <div>
              <Label htmlFor="price" className="mb-2">
                Price ($)
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={
                  initialData?.price ? (initialData.price / 100).toFixed(2) : ''
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for free
              </p>
            </div>
            <div>
              <Label htmlFor="type" className="mb-2">
                Type
              </Label>
              <select
                id="type"
                name="type"
                defaultValue={initialData?.type || 'digital'}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="digital">Digital Product</option>
                <option value="link">Link</option>
                <option value="booking">Booking</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="productUrl" className="mb-2">
                Product URL
              </Label>
              <Input
                id="productUrl"
                name="productUrl"
                type="url"
                placeholder="https://example.com/product"
                defaultValue={initialData?.productUrl || ''}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="imageUrl" className="mb-2">
                Cover Image URL
              </Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                defaultValue={initialData?.imageUrl || ''}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === 'create' ? (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            {mode === 'edit' && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
          {state.success && (
            <p className="text-green-500 text-sm">{state.success}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteProductButton({ productId }: { productId: number }) {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const formData = new FormData();
    formData.append('id', String(productId));
    await deleteProduct({}, formData);
    mutate('/api/products');
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-gray-400 hover:text-red-500"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function TogglePublishButton({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('id', String(product.id));
    formData.append('isPublished', String(!product.isPublished));
    await toggleProductPublish({}, formData);
    mutate('/api/products');
    setIsLoading(false);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        product.isPublished
          ? 'text-green-500'
          : 'text-gray-400 hover:text-orange-500'
      }
      onClick={handleToggle}
      disabled={isLoading}
    >
      {product.isPublished ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </Button>
  );
}

function ProductCard({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: (product: Product) => void;
}) {
  return (
    <Card className={product.isPublished ? '' : 'opacity-60'}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {product.imageUrl ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 shrink-0 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {product.title[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-700"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <TogglePublishButton product={product} />
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-gray-900">
                {product.price
                  ? `$${(product.price / 100).toFixed(2)}`
                  : 'Free'}
              </span>
              <span className="text-xs text-gray-400 uppercase">
                {product.type}
              </span>
              {product.productUrl && (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-500 hover:underline"
                >
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductGridCard({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: (product: Product) => void;
}) {
  return (
    <Card className={`group ${product.isPublished ? '' : 'opacity-60'}`}>
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              {product.title[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white text-gray-400 hover:text-gray-700 h-7 w-7"
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <TogglePublishButton product={product} />
          <DeleteProductButton productId={product.id} />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 truncate">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-gray-900">
            {product.price ? `$${(product.price / 100).toFixed(2)}` : 'Free'}
          </span>
          <span className="text-xs text-gray-400 uppercase">{product.type}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductList({
  onEdit,
  viewMode,
}: {
  onEdit: (product: Product) => void;
  viewMode: 'list' | 'grid';
}) {
  const { data: products } = useSWR<Product[]>('/api/products', fetcher);

  if (!products?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No products yet</p>
        <p className="text-sm">Add your first product to start selling.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductGridCard key={product.id} product={product} onEdit={onEdit} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onEdit={onEdit} />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="flex-1 lg:p-8 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-[100px] bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-[100px] bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const isFormOpen = showForm || editingProduct !== null;

  return (
    <div className="flex flex-1">
      <section className="flex-1 overflow-y-auto lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Products
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-none ${viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-none ${viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {!showForm && !editingProduct && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        <Suspense fallback={<ProductSkeleton />}>
          <div className="space-y-6">
            {editingProduct && (
              <ProductForm
                mode="edit"
                initialData={editingProduct}
                onSuccess={() => setEditingProduct(null)}
                onCancel={() => setEditingProduct(null)}
              />
            )}

            {showForm && (
              <ProductForm
                mode="create"
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            )}

            <ProductList onEdit={(product) => setEditingProduct(product)} viewMode={viewMode} />
          </div>
        </Suspense>
      </section>

      {isFormOpen && (
        <div className="hidden lg:block lg:shrink-0">
          <ChatPanel isOpen onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
