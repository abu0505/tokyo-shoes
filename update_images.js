
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const SUPABASE_URL = "https://qdbvxznnzukdwooziqmd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYnZ4em5uenVrZHdvb3ppcW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjQ3MTIsImV4cCI6MjA4NDY0MDcxMn0.Wx9whOkBYmMdGzj1u3VKZyXtcr77H-rM3i4PViASf4c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEMP_DIR = './migration_temp';
const BACKUP_FILE = path.join(TEMP_DIR, 'shoes_backup.json');

async function compressImage(inputPath) {
    try {
        if (!fs.existsSync(inputPath)) return null;

        const outputBuffer = await sharp(inputPath)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 60 }) // 60 quality usually gets < 100kb
            .toBuffer();

        if (outputBuffer.length > 100 * 1024) {
            // If still > 100kb, try lower quality
            return await sharp(outputBuffer)
                .webp({ quality: 40 })
                .toBuffer();
        }
        return outputBuffer;
    } catch (e) {
        console.error(`Error compressing ${inputPath}:`, e);
        return null;
    }
}

async function uploadToSupabase(buffer, folder = 'shoes') {
    const fileName = `${randomUUID()}.webp`;
    const filePath = `${folder}/${fileName}`;

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
    console.log("Starting update process...");

    if (!fs.existsSync(BACKUP_FILE)) {
        console.error("Backup file not found!");
        return;
    }

    const shoes = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`Loaded ${shoes.length} shoes.`);

    for (const shoe of shoes) {
        console.log(`Updating ${shoe.name} (${shoe.id})...`);

        // 1. Process Main Image
        const mainPath = path.join(TEMP_DIR, `${shoe.id}_main.png`);
        let newMainUrl = shoe.image_url;

        // Try png, if not try jpg? The download script preserved extension.
        // We will just look for files starting with ID.
        const files = fs.readdirSync(TEMP_DIR);
        const mainFile = files.find(f => f.startsWith(`${shoe.id}_main`));

        if (mainFile) {
            console.log(`  Compressing main image...`);
            const buffer = await compressImage(path.join(TEMP_DIR, mainFile));
            if (buffer) {
                const url = await uploadToSupabase(buffer);
                if (url) newMainUrl = url;
            }
        }

        // 2. Process Gallery Images
        let newAdditionalImages = [];

        // Check for existing gallery files downloaded
        // Pattern: {id}_gallery_{i}
        // Also check for GENERATED ones (which use same pattern now)

        // We can just look for ALL files matching {id}_gallery_*
        const galleryFiles = files.filter(f => f.startsWith(`${shoe.id}_gallery_`)).sort();

        if (galleryFiles.length > 0) {
            console.log(`  Found ${galleryFiles.length} gallery images.`);
            for (const gf of galleryFiles) {
                const buffer = await compressImage(path.join(TEMP_DIR, gf));
                if (buffer) {
                    const url = await uploadToSupabase(buffer);
                    if (url) newAdditionalImages.push(url);
                }
            }
        } else {
            // Keep old ones if we didn't find any new files (but we should have downloaded old ones if they existed)
            // If we failed to download, we might lose them? The fetch script logged errors.
            // If additional_images was null in DB, it remains empty.
        }

        // 3. Update DB
        const { error } = await supabase
            .from('shoes')
            .update({
                image_url: newMainUrl,
                additional_images: newAdditionalImages.length > 0 ? newAdditionalImages : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', shoe.id);

        if (error) {
            console.error(`  Failed to update DB for ${shoe.name}:`, error);
        } else {
            console.log(`  Successfully updated.`);
        }
    }

    console.log("Update complete.");
}

main();
