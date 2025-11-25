import { Hono } from "hono";
import { renderer } from "./renderer";

import wallpapers from "../wallpapers.json";

const app = new Hono();

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <main>
      <h1 class="text-4xl text-center p-8 pb-4 font-[Instrument_Serif]">Komorebi Collection</h1>
      <section class="grid grid-cols-4 gap-4 p-4">
        {wallpapers.map((wallpaper, index) => (
          <div key={index} class="rounded-md border border-gray-200 overflow-hidden">
            <a href={wallpaper.url} class="relative block">
              <img
                src={wallpaper.url.replace("/originals/", "/736x/")}
                class="w-full aspect-video object-cover"
              />
              <div class="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded-full">
                {wallpaper.width} x {wallpaper.height} · {formatFileSize(wallpaper.size)}
              </div>
            </a>
            {/* <div class="p-2">
              <div class="flex flex-wrap gap-1.5">
                {wallpaper.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div> */}
          </div>
        ))}
      </section>
    </main>
  );
});

app.get("/image", async (c) => {
  const index = Math.floor(Math.random() * wallpapers.length);
  const wallpaper = wallpapers[index];

  const isJson = c.req.header("Accept")?.includes("application/json") ||
    c.req.query("format") === "json";
  if (isJson) return c.json(wallpaper);

  const response = await fetch(wallpaper.url);
  if (!response.ok || !response.body) {
    return c.json({ error: "Failed to fetch image" }, 500);
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
    },
  });
});

export default app;
