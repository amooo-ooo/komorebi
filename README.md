# Komorebi

A curated API and collection of high-quality anime splash wallpapers.

## Gallery

Visit the home page to browse the curated collection of wallpapers.

## API Reference

### Base URL

[https://komorebi.orizuru.dev](https://komorebi.orizuru.dev) or [https://owo.orizuru.dev](https://owo.orizuru.dev)

### Get Random Wallpaper

`GET /image`

Returns a random wallpaper image. You can filter the results using query parameters.

**Parameters:**

| Parameter | Description | Options |
| --- | --- | --- |
| `id` | Get a specific wallpaper by ID | e.g., `1` |
| `tag` | Filter by tag | e.g., `fantasy`, `flowers`, `clouds` |
| `rating` | Filter by safety rating | `safe`, `suggestive`, `explicit` |
| `theme` | Filter by color theme | `light`, `dark` |
| `format` | Response format | `json` (default is image binary) |

**Examples:**

- [https://komorebi.orizuru.dev/image?tag=fantasy](https://komorebi.orizuru.dev/image?tag=scenery) - Random scenery wallpaper
- [https://komorebi.orizuru.dev/image?rating=safe&theme=dark](https://komorebi.orizuru.dev/image?rating=safe&theme=dark) - Random safe, dark-themed wallpaper
- [https://komorebi.orizuru.dev/image?format=json](https://komorebi.orizuru.dev/image?format=json) - Get JSON metadata for a random wallpaper

**Response Example (JSON):**

```json
{
  "id": "1",
  "url": "https://i.pinimg.com/originals/89/61/94/8961942207903c314fd6b2f3cca72116.jpg",
  "thumbnail_url": "https://i.pinimg.com/736x/89/61/94/8961942207903c314fd6b2f3cca72116.jpg",
  "width": 2834,
  "height": 1595,
  "size": 747859,
  "color_dominant": "#8B9467",
  "color_palette": [
    "#C51077",
    "#3E8E41",
    "#964B00"
  ],
  "tags": [
    "anime",
    "girl",
    "forest",
    "rabbits",
    "flowers",
    "relaxing",
    "fantasy",
    "cute"
  ],
  "rating": "safe",
  "theme": "light"
}
```

## Local Development

1.  **Install dependencies:**

    ```bash
    bun install
    ```

2.  **Initialize Database:**

    ```bash
    npx wrangler d1 create komorebi-db
    # Update wrangler.jsonc with the new database_id
    npx wrangler d1 execute komorebi-db --file=src/wallpapers/schema.sql
    bun run seed
    ```

3.  **Run locally:**

    ```bash
    bun run dev
    ```

> [!NOTE]
> Requires [NVIDIA NIM API](https://build.nvidia.com/models) key (free) for AI powered tagging, rating, and theme detection. You can also manually add tags/metadata to `wallpapers.json`.

```txt
NVIDIA_API_KEY=your_api_key_here
```
## Contributing

We'd love to grow the collection with your help!

1.  Add your wallpaper URLs to the list in [scraper/index.ts](scraper/index.ts).
2.  Run the scraper to automatically fetch metadata and update the database:

    ```bash
    bun run scrape
    ```
3.  Submit a Pull Request with your changes to [wallpapers.json](src/wallpapers/wallpapers.json).
