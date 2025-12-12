import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import wallpapers from '../wallpapers/wallpapers.json';

const escape = (str: string) => str.replace(/'/g, "''");

async function seed() {
    console.log('Generating seed SQL...');

    let sql = '-- Seed data generated from wallpapers.json\n\n';
    // sql += 'BEGIN TRANSACTION;\n\n'; // Removed to avoid remote execution error

    // Insert wallpapers
    sql += '-- Wallpapers\n';
    for (const w of wallpapers) {
        const palette = escape(JSON.stringify(w.color_palette));
        const url = escape(w.url);
        const thumb = escape(w.thumbnail_url);
        const dominant = escape(w.color_dominant);
        const rating = escape(w.rating);
        const theme = escape(w.theme || 'light');

        // Use INSERT OR REPLACE to update existing entries
        sql += `INSERT OR REPLACE INTO wallpapers (id, url, thumbnail_url, width, height, size, color_dominant, color_palette, rating, theme) VALUES ('${w.id}', '${url}', '${thumb}', ${w.width}, ${w.height}, ${w.size}, '${dominant}', '${palette}', '${rating}', '${theme}');\n`;
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
    sql += '\n-- Wallpaper Tags\n';
    // We need to clear existing tags for the wallpapers we are updating to avoid stale relations if tags were removed
    // But since we are doing a bulk seed, maybe we just DELETE FROM wallpaper_tags WHERE wallpaper_id IN (...)?
    // For simplicity, let's just INSERT OR IGNORE. If we want to support removing tags, we'd need more complex logic.
    // Given the user just edited JSON, let's assume they might have added/changed tags.
    // To be safe for updates, we should probably delete existing relations for these wallpapers first.

    for (const w of wallpapers) {
        sql += `DELETE FROM wallpaper_tags WHERE wallpaper_id = '${w.id}';\n`;
        if (w.tags) {
            for (const tag of w.tags) {
                sql += `INSERT OR IGNORE INTO wallpaper_tags (wallpaper_id, tag_id) SELECT '${w.id}', id FROM tags WHERE name = '${escape(tag)}';\n`;
            }
        }
    }

    // sql += '\nCOMMIT;\n'; // Removed to avoid remote execution error

    const tempSeedPath = join(process.cwd(), 'temp_seed.sql');
    writeFileSync(tempSeedPath, sql);
    console.log(`Generated temporary seed file at ${tempSeedPath}`);

    try {
        console.log('Executing seed against D1...');
        const args = process.argv.slice(2).join(' ');
        // Add --yes to avoid prompts
        execSync(`npx wrangler d1 execute komorebi-db --file=${tempSeedPath} --yes ${args}`, { stdio: 'inherit' });
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
