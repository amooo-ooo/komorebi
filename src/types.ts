export type Bindings = {
    DB: D1Database;
};

export interface DBWallpaper {
    id: string;
    url: string;
    thumbnail_url: string;
    width: number;
    height: number;
    size: number;
    color_dominant: string;
    color_palette: string; // JSON string in DB
    rating: string;
    theme: string;
    tags?: string[];
}

export interface Wallpaper extends Omit<DBWallpaper, 'color_palette'> {
    color_palette: string[]; // Parsed array in App
}
