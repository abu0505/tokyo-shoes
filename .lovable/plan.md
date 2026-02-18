

## Fix: Product Images Not Showing in iOS WhatsApp Link Previews

### Problem
The `share-product` edge function serves product images in WebP format via `og:image` meta tags. While Android and desktop WhatsApp handle WebP fine, **iOS WhatsApp's link preview crawler does not reliably render WebP images**. This is a well-documented platform limitation.

### Solution
Use a free image proxy service (`wsrv.nl`) to convert the WebP image to JPEG on-the-fly when generating OG meta tags for crawlers. This service is widely used, fast, and requires no API key.

### Changes

**File: `supabase/functions/share-product/index.ts`**

1. Create a helper function that wraps the original Supabase storage image URL through `wsrv.nl` to convert it to JPEG format:
   - URL pattern: `https://wsrv.nl/?url={encoded_original_url}&output=jpg&w=1200&q=80`
   - This ensures the image served to crawlers is always JPEG, which all platforms support

2. Update the OG meta tags in the HTML response:
   - Change `og:image` and `og:image:secure_url` to use the proxied JPEG URL
   - Change `og:image:type` from `image/webp` to `image/jpeg`
   - Update `twitter:image` to also use the proxied JPEG URL

3. Keep the rest of the function unchanged (crawler detection, redirect logic, etc.)

### Technical Details

The only file modified is `supabase/functions/share-product/index.ts`. The key change is roughly:

```
// Before
const imageUrl = product.image_url || ''

// After  
const rawImageUrl = product.image_url || ''
const imageUrl = rawImageUrl 
  ? `https://wsrv.nl/?url=${encodeURIComponent(rawImageUrl)}&output=jpg&w=1200&q=80`
  : ''
```

And updating `og:image:type` from `image/webp` to `image/jpeg`.

This approach requires no additional infrastructure, no paid plans, and no stored duplicate images. The edge function will be redeployed automatically after the change.

