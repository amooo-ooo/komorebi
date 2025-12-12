import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import wallpapers from '../wallpapers/wallpapers.json';

const escape = (str: string) => str.replace(/'/g, "''");

async function seed() {
    console.log('Generating seed SQL...');

    let sql = '-- Seed data generated from wallpapers.json\n\n';
    sql += 'BEGIN TRANSACTION;\n\n';

    // Insert wallpapers
    sql += '-- Wallpapers\n';
    for (const w of wallpapers) {
        const palette = escape(JSON.stringify(w.color_palette));
        const url = escape(w.url);
        const thumb = escape(w.thumbnail_url);
        const dominant = escape(w.color_dominant);
        const rating = escape(w.rating);
        const theme = escape(w.theme || 'light');

        // Use INSERT OR REPLACE or INSERT OR IGNORE depending on desired behavior.
        // Since we want to update if changed, REPLACE might be better, but user said "doesnt always attempt to add wallpapers already there"
        // implying efficiency. If we use INSERT OR IGNORE, it won't update existing.
        // If we want to update, we should use INSERT OR REPLACE.
        // However, user said "make it so it's efficient, so it doesnt always attempt to add wallpapers already there".
        // This usually means "skip if exists".
        sql += `INSERT OR IGNORE INTO wallpapers (id, url, thumbnail_url, width, height, size, color_dominant, color_palette, rating, theme) VALUES ('${w.id}', '${url}', '${thumb}', ${w.width}, ${w.height}, ${w.size}, '${dominant}', '${palette}', '${rating}', '${theme}');\n`;
    }

    // Insert tags
    sql += '\n-- Tags\n';
    const allTags = new Set<string>();
    for (const w of wallpapers) {
        if (w.tags) {
            for (const tag of w.tags) {
                allTags.add(tag);
            }
        }
    }

    for (const tag of allTags) {
        sql += `INSERT OR IGNORE INTO tags (name) VALUES ('${escape(tag)}');\n`;
    }

    // Insert relations
    // For relations, we might want to clear existing ones for the wallpapers we are processing?
    // Or just INSERT OR IGNORE.
    sql += '\n-- Wallpaper Tags\n';
    for (const w of wallpapers) {
        if (w.tags) {
            for (const tag of w.tags) {
                // We need to get the tag_id. In a real script we might query DB, but here we are generating SQL.
                // We can use a subquery to get the tag ID.
                sql += `INSERT OR IGNORE INTO wallpaper_tags (wallpaper_id, tag_id) SELECT '${w.id}', id FROM tags WHERE name = '${escape(tag)}';\n`;
            }
        }
    }

    sql += '\nCOMMIT;\n';

    const tempSeedPath = join(process.cwd(), 'temp_seed.sql');
    writeFileSync(tempSeedPath, sql);
    console.log(`Generated temporary seed file at ${tempSeedPath}`);

    try {
        console.log('Executing seed against D1...');
        // We assume the DB name is 'komorebi-db' as created earlier.
        // If the user hasn't set up wrangler.jsonc yet, this might fail if run locally without binding.
        // But assuming the user follows instructions or we update wrangler.jsonc.
        // We use 'komorebi-db' as the database name.
        execSync(`npx wrangler d1 execute komorebi-db --file=${tempSeedPath}`, { stdio: 'inherit' });
        console.log('Seed completed successfully.');
    } catch (error) {
        console.error('Failed to execute seed command.');
        // Don't delete the file so user can debug or run manually
        console.log(`Temporary seed file kept at ${tempSeedPath}`);
        process.exit(1);
    }

    try {
        unlinkSync(tempSeedPath);
        console.log('Cleaned up temporary seed file.');
    } catch (e) {
        // Ignore cleanup error
    }
}

seed();
