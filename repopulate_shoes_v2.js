
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://qdbvxznnzukdwooziqmd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Link Start! Error: SUPABASE_SERVICE_ROLE_KEY is missing. Please set it in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TEMP_DIR = './migration_temp';
const SHOES_BACKUP = path.join(TEMP_DIR, 'shoes_backup.json');
const WISHLISTS_BACKUP = path.join(TEMP_DIR, 'wishlists_backup.json');

async function compressImage(inputPath) {
    try {
        if (!fs.existsSync(inputPath)) return null;

        // Compress to WebP, max 1024x1024, quality 80 -> should be well under 100KB usually
        let quality = 80;
        let buffer = await sharp(inputPath)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

        while (buffer.length > 100 * 1024 && quality > 10) {
            quality -= 10;
            buffer = await sharp(inputPath)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality })
                .toBuffer();
        }

        return buffer;
    } catch (e) {
        console.error(`Error compressing ${inputPath}:`, e);
        return null;
    }
}

const LOCAL_GALLERY_DIR = path.join(__dirname, 'media', 'shoe gallary');
if (!fs.existsSync(LOCAL_GALLERY_DIR)) {
    fs.mkdirSync(LOCAL_GALLERY_DIR, { recursive: true });
}

async function uploadToSupabase(buffer, fileName) {
    const filePath = `optimized/${fileName}`; // Use a subfolder for cleanliness

    // SAVE LOCALLY AS REQUESTED
    const localPath = path.join(LOCAL_GALLERY_DIR, fileName);
    try {
        fs.writeFileSync(localPath, buffer);
        console.log(`Saved locally: ${localPath}`);
    } catch (e) {
        console.error(`Failed to save locally to ${localPath}:`, e);
    }

    const { error } = await supabase.storage
        .from('shoe-images')
        .upload(filePath, buffer, {
            contentType: 'image/webp',
            upsert: true
        });

    if (error) {
        console.error("Upload error:", error);
        return null;
    }

    const { data } = supabase.storage
        .from('shoe-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

async function main() {
    console.log("Starting Repopulation Process (UPSERT Mode)...");

    // 0. Verify Backups
    if (!fs.existsSync(SHOES_BACKUP)) {
        console.error("Shoes backup not found!");
        return;
    }

    // 1. Backup Wishlists (Still good to have backup)
    console.log("Backing up wishlists (just in case)...");
    const { data: wishlists, error: wishError } = await supabase.from('wishlists').select('*');
    if (wishError) {
        console.error("Failed to backup wishlists:", wishError);
        return;
    }
    fs.writeFileSync(WISHLISTS_BACKUP, JSON.stringify(wishlists, null, 2));
    console.log(`Backed up ${wishlists.length} wishlists.`);

    // 2. SKIP Delete (using UPSERT instead to preserve Foreign Keys like order_items)
    console.log("Skipping delete to preserve Foreign Keys due to order_items constraint.");
    console.log("Using UPSERT to update existing records with optimized images.");

    // 3. Process Images and Prepare New Data
    const shoes = JSON.parse(fs.readFileSync(SHOES_BACKUP, 'utf8'));
    const files = fs.readdirSync(TEMP_DIR);

    // We will collect new shoe records here
    const newShoes = [];

    for (const shoe of shoes) {
        console.log(`Processing ${shoe.name}...`);

        let mainImageUrl = shoe.image_url; // Default to old if fail
        let additionalImages = [];

        // Main Image
        // Pattern: {id}_main.png (from fetch script)
        const mainFile = files.find(f => f.startsWith(`${shoe.id}_main`));
        if (mainFile) {
            console.log(`  Optimizing Main Image...`);
            const buffer = await compressImage(path.join(TEMP_DIR, mainFile));
            if (buffer) {
                const url = await uploadToSupabase(buffer, `${shoe.id}_main.webp`);
                if (url) mainImageUrl = url;
            }
        }

        // Gallery Images
        // Pattern: {id}_gallery_{i}
        // NOTE: We are NOT checking for generated images as generation quota was exhausted.
        const galleryFiles = files.filter(f => f.startsWith(`${shoe.id}_gallery`));

        for (const gf of galleryFiles) {
            console.log(`  Optimizing Gallery Image: ${gf}...`);
            const buffer = await compressImage(path.join(TEMP_DIR, gf));
            if (buffer) {
                const url = await uploadToSupabase(buffer, gf.replace(path.extname(gf), '.webp'));
                if (url) additionalImages.push(url);
            }
        }

        // Construct new shoe record
        newShoes.push({
            id: shoe.id, // PRESERVE ID
            name: shoe.name,
            brand: shoe.brand,
            price: shoe.price,
            sizes: shoe.sizes,
            status: shoe.status,
            created_at: shoe.created_at,
            image_url: mainImageUrl, // NEW URL
            additional_images: additionalImages.length > 0 ? additionalImages : null // NEW URLS
        });
    }

    // 4. Upsert Shoes
    console.log("Upserting updated shoes...");
    const { error: insertError } = await supabase.from('shoes').upsert(newShoes);
    if (insertError) {
        console.error("Failed to upsert shoes:", insertError);
        return;
    }
    console.log("Shoes upserted successfully.");

    // 5. Skip Wishlist Restore
    console.log("Wishlist restore skipped (data preserved via upsert).");

    console.log("Repopulation Complete!");
}

main();
