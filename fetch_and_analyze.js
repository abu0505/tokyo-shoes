
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';

const SUPABASE_URL = "https://qdbvxznnzukdwooziqmd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYnZ4em5uenVrZHdvb3ppcW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjQ3MTIsImV4cCI6MjA4NDY0MDcxMn0.Wx9whOkBYmMdGzj1u3VKZyXtcr77H-rM3i4PViASf4c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEMP_DIR = './migration_temp';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log("Fetching shoes...");
    const { data: shoes, error } = await supabase.from('shoes').select('*, shoe_sizes(*)');

    if (error) {
        console.error("Error fetching shoes:", error);
        return;
    }

    console.log(`Found ${shoes.length} shoes.`);

    fs.writeFileSync(path.join(TEMP_DIR, 'shoes_backup.json'), JSON.stringify(shoes, null, 2));

    const missingGallery = [];

    for (const shoe of shoes) {
        console.log(`Processing ${shoe.name}...`);

        // Download main image
        if (shoe.image_url) {
            const ext = path.extname(shoe.image_url.split('?')[0]) || '.png';
            const dest = path.join(TEMP_DIR, `${shoe.id}_main${ext}`);
            try {
                await downloadFile(shoe.image_url, dest);
            } catch (e) {
                console.error(`Failed to download main image for ${shoe.name}:`, e);
            }
        }

        // Check gallery
        if (!shoe.additional_images || shoe.additional_images.length === 0) {
            missingGallery.push({
                id: shoe.id,
                name: shoe.name,
                brand: shoe.brand,
                main_image_path: path.join(TEMP_DIR, `${shoe.id}_main.png`) // Assuming png for generation prompt reference mostly
            });
        } else {
            // Download existing gallery images
            for (let i = 0; i < shoe.additional_images.length; i++) {
                const url = shoe.additional_images[i];
                const ext = path.extname(url.split('?')[0]) || '.png';
                const dest = path.join(TEMP_DIR, `${shoe.id}_gallery_${i}${ext}`);
                try {
                    await downloadFile(url, dest);
                } catch (e) {
                    console.error(`Failed to download gallery image ${i} for ${shoe.name}:`, e);
                }
            }
        }
    }

    fs.writeFileSync(path.join(TEMP_DIR, 'missing_gallery.json'), JSON.stringify(missingGallery, null, 2));
    console.log("Done. Backup and analysis complete.");
}

main();
