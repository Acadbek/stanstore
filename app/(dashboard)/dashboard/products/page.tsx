'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, toggleProductPublish } from './actions';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Product } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  isFrontStyleId,
  type FrontStyleId,
} from '@/lib/product-front-style';

const RichEditor = dynamic(() => import('@/components/editor/rich-editor'), {
  ssr: false,
});

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
};

type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type ProductFrontStyleOption = FrontStyleId | 'inherit';

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  const { mutate } = useSWRConfig();
  const getInitialStyle = (product?: Product): ProductFrontStyleOption => {
    if (!product?.frontStyle) return mode === 'create' ? 'cta' : 'inherit';
    if (product.frontStyle === 'inherit') return 'inherit';
    if (isFrontStyleId(product.frontStyle)) return product.frontStyle;
    return mode === 'create' ? 'cta' : 'inherit';
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [descriptionHtml, setDescriptionHtml] = useState(initialData?.description || '');
  const [price, setPrice] = useState(
    initialData?.price ? (initialData.price / 100).toFixed(2) : ''
  );
  const [type, setType] = useState<'digital' | 'booking' | 'link'>(
    (initialData?.type as 'digital' | 'booking' | 'link') || 'digital'
  );
  const [productUrl, setProductUrl] = useState(initialData?.productUrl || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [frontStyle, setFrontStyle] = useState<ProductFrontStyleOption>(
    getInitialStyle(initialData)
  );
  const [frontStylePrompt, setFrontStylePrompt] = useState(
    initialData?.frontStylePrompt || ''
  );

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setDescriptionHtml(initialData.description || '');
      setPrice(initialData.price ? (initialData.price / 100).toFixed(2) : '');
      setType((initialData.type as 'digital' | 'booking' | 'link') || 'digital');
      setProductUrl(initialData.productUrl || '');
      setImageUrl(initialData.imageUrl || '');
      setFrontStyle(getInitialStyle(initialData));
      setFrontStylePrompt(initialData.frontStylePrompt || '');
      return;
    }

    if (mode === 'create') {
      setTitle('');
      setDescriptionHtml('');
      setPrice('');
      setType('digital');
      setProductUrl('');
      setImageUrl('');
      setFrontStyle('cta');
      setFrontStylePrompt('');
    }
  }, [mode, initialData?.id]);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState: ActionState, formData: FormData) => {
      const action = mode === 'create' ? createProduct : updateProduct;
      formData.set('description', descriptionHtml);
      formData.set('frontStyle', frontStyle);
      formData.set('frontStylePrompt', frontStylePrompt || '');
      const result = await action(prevState, formData);
      if ('success' in result && result.success) {
        mutate('/api/products');
        onSuccess?.();
      }
      return result;
    },
    {}
  );

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Label htmlFor="title" className="mb-2">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="My Awesome Product"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label className="mb-2">Description</Label>
        <RichEditor
          content={descriptionHtml}
          onChange={setDescriptionHtml}
          placeholder="Describe your product in detail..."
          onYoutubeThumbnail={(url) => {
            if (!imageUrl) setImageUrl(url);
          }}
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
          value={price}
          onChange={(event) => setPrice(event.target.value)}
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
          value={type}
          onChange={(event) =>
            setType(event.target.value as 'digital' | 'booking' | 'link')
          }
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
          value={productUrl}
          onChange={(event) => setProductUrl(event.target.value)}
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
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />
      </div>
    </div>
  );

  const actionRow = (
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
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );

  return (
    <>
      {mode === 'edit' ? (
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-2 border-orange-100">
            <CardHeader>
              <CardTitle>Front Content</CardTitle>
              <CardDescription>
                Edit your product card details and save when you are happy with the preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={formAction}>
                {initialData && <input type="hidden" name="id" value={initialData.id} />}
                {formFields}
                {actionRow}
                {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
                {state.success && (
                  <p className="text-green-500 text-sm">{state.success}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <form className="space-y-4" action={formAction}>
            {formFields}
            {actionRow}
            {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
            {state.success && (
              <p className="text-green-500 text-sm">{state.success}</p>
            )}
          </form>
        </div>
      )}
    </>
  );
}

function DeleteProductButton({ productId }: { productId: number }) {
  const { mutate } = useSWRConfig();

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
  const { mutate } = useSWRConfig();

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
          <span className="text-xs text-gray-400 uppercase">
            {product.type}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductList({
  products,
  isLoading,
  error,
  onEdit,
}: {
  products: Product[];
  isLoading: boolean;
  error?: Error;
  onEdit: (product: Product) => void;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-red-500">
        Failed to load products. Please refresh.
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No products yet</p>
        <p className="text-sm">Add your first product to start selling.</p>
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

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useSWR<Product[]>(
    '/api/products',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const editProductIdParam = searchParams.get('editProductId');
  const isFormOpen = showForm || editingProduct !== null;

  return (
    <div className="flex flex-1">
      <section className="flex-1 overflow-y-auto lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
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

            <ProductList
              products={productsData || []}
              isLoading={isProductsLoading}
              error={productsError}
              onEdit={(product) => setEditingProduct(product)}
            />
          </div>
        </Suspense>
      </section>

      {isFormOpen && (
        <div className="hidden lg:block lg:shrink-0">
          <ChatPanel isOpen onClose={() => { }} />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}
