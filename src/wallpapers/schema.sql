DROP TABLE IF EXISTS wallpaper_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS wallpapers;

CREATE TABLE wallpapers (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size INTEGER NOT NULL,
  color_dominant TEXT NOT NULL,
  color_palette TEXT NOT NULL, -- JSON array of strings
  rating TEXT NOT NULL,
  theme TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE wallpaper_tags (
  wallpaper_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (wallpaper_id, tag_id),
  FOREIGN KEY (wallpaper_id) REFERENCES wallpapers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallpapers_rating ON wallpapers(rating);
CREATE INDEX idx_wallpapers_theme ON wallpapers(theme);
CREATE INDEX idx_tags_name ON tags(name);
