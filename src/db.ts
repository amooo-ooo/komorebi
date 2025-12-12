import { Wallpaper, DBWallpaper } from "./types";

export async function getWallpapers(db: D1Database, page: number = 1, pageSize: number = 16): Promise<Wallpaper[]> {
    const start = (page - 1) * pageSize;
    const { results } = await db.prepare("SELECT * FROM wallpapers LIMIT ? OFFSET ?")
        .bind(pageSize, start)
        .all<DBWallpaper>();

    return results.map(w => ({
        ...w,
        color_palette: JSON.parse(w.color_palette)
    }));
}

export async function getWallpaperCount(db: D1Database): Promise<number> {
    const result = await db.prepare("SELECT COUNT(*) as count FROM wallpapers").first<{ count: number }>();
    return result?.count || 0;
}

export async function getWallpaperById(db: D1Database, id: string): Promise<Wallpaper | null> {
    const result = await db.prepare("SELECT * FROM wallpapers WHERE id = ?").bind(id).first<DBWallpaper>();
    if (!result) return null;

    return {
        ...result,
        color_palette: JSON.parse(result.color_palette)
    };
}

export async function getWallpaperTags(db: D1Database, id: string): Promise<string[]> {
    const result = await db.prepare(
        "SELECT t.name FROM tags t JOIN wallpaper_tags wt ON t.id = wt.tag_id WHERE wt.wallpaper_id = ?"
    ).bind(id).all<{ name: string }>();

    return result.results.map(t => t.name);
}

export interface WallpaperFilter {
    id?: string;
    tag?: string;
    rating?: string;
    theme?: string;
}

export async function getRandomWallpaper(db: D1Database, filter: WallpaperFilter): Promise<Wallpaper | null> {
    let query = "SELECT w.* FROM wallpapers w";
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter.tag) {
        query += " JOIN wallpaper_tags wt ON w.id = wt.wallpaper_id JOIN tags t ON wt.tag_id = t.id";
        conditions.push("t.name = ?");
        params.push(filter.tag);
    }

    if (filter.id) {
        conditions.push("w.id = ?");
        params.push(filter.id);
    }

    if (filter.rating) {
        conditions.push("w.rating = ?");
        params.push(filter.rating);
    }

    if (filter.theme) {
        conditions.push("w.theme = ?");
        params.push(filter.theme);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY RANDOM() LIMIT 1";

    const result = await db.prepare(query).bind(...params).first<DBWallpaper>();
    if (!result) return null;

    return {
        ...result,
        color_palette: JSON.parse(result.color_palette)
    };
}
