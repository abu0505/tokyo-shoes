

## Fix: iOS WhatsApp Link Preview Image - HTML Entity Escaping

### Root Cause
The previous wsrv.nl proxy fix was correct in concept, but the generated HTML contains **unescaped `&` characters** inside meta tag `content` attributes:

```html
<!-- CURRENT (broken on iOS) -->
<meta property="og:image" content="https://wsrv.nl/?url=...&output=jpg&w=1200&q=80">
```

In valid HTML, `&` inside attributes must be `&amp;`. iOS's WebKit parser is strict about this and truncates the URL at the first bare `&`, so the actual URL iOS reads becomes just `https://wsrv.nl/?url=...` (missing the conversion parameters). Android's parser is more lenient and handles it fine, which is why it works there.

### Solution
In `supabase/functions/share-product/index.ts`, create a helper function to escape `&` as `&amp;` for URLs used in HTML attributes. Apply it to all meta tag URLs (og:image, og:image:secure_url, twitter:image).

### Changes

**File: `supabase/functions/share-product/index.ts`**

1. Add a helper function to escape URLs for HTML attributes:
   ```typescript
   function escapeHtmlAttr(str: string): string {
       return str.replace(/&/g, '&amp;')
   }
   ```

2. Use it when embedding URLs in meta tags. The `imageUrl` variable stays the same for any non-HTML use, but inside the HTML template, all URL references use `escapeHtmlAttr(imageUrl)`:
   ```html
   <meta property="og:image" content="${escapeHtmlAttr(imageUrl)}">
   ```

3. Also escape the `redirectUrl` in meta tags (it currently doesn't have `&` but future-proofing).

This is a one-line helper + updating ~5 meta tag references in the HTML template. No other files change.

### Why This Works
- iOS WebKit sees `&amp;output=jpg&amp;w=1200&amp;q=80` and correctly decodes it to `&output=jpg&w=1200&q=80` when making the HTTP request
- Android already works and will continue to work (both escaped and unescaped `&` are handled)
- The wsrv.nl proxy itself is functioning correctly (verified: it returns valid JPEG binary data)

