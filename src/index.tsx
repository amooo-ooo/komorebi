import { Hono } from "hono";
import { renderer } from "./renderer";

import wallpapers from "../wallpapers.json";

const app = new Hono();

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

function shuffle<T>(array: T[]): T[] {
  const length = array.length;
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

app.use(renderer);

app.get("/api/wallpapers", (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = 16;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return c.json(wallpapers.slice(start, end));
});

app.get("/", (c) => {
  const initialWallpapers = wallpapers.slice(0, 16);
  return c.render(
    <main>
      <h1 class="text-4xl text-center p-8 pb-4 font-[Instrument_Serif]">Komorebi Wallpaper Collection</h1>
      <div class="flex justify-center flex-wrap gap-1.5">
        <div class="bg-black/75 text-white text-xs px-2 py-1 rounded-full">{wallpapers.length} images</div>
        <div id="latency" class="bg-black/75 text-white text-xs px-2 py-1 rounded-full">...</div>
      </div>
      <section id="wallpaper-grid" class="grid grid-cols-4 gap-4 p-4">
        {initialWallpapers.map((wallpaper, index) => (
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
      <div id="sentinel" class="h-10"></div>
      <script dangerouslySetInnerHTML={{
        __html: `
          const formatFileSize = (bytes) => {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
            if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
          };

          window.addEventListener("load", () => {
            const latency = Math.round(performance.now());
            document.getElementById("latency").innerText = latency + "ms latency";

            let page = 1;
            const observer = new IntersectionObserver(async (entries) => {
              if (entries[0].isIntersecting) {
                page++;
                try {
                  const res = await fetch("/api/wallpapers?page=" + page);
                  const data = await res.json();
                  
                  if (data.length === 0) {
                    observer.disconnect();
                    return;
                  }

                  const grid = document.getElementById("wallpaper-grid");
                  data.forEach(w => {
                    const div = document.createElement('div');
                    div.className = "rounded-md border border-gray-200 overflow-hidden";
                    div.innerHTML = \`
                      <a href="\${w.url}" class="relative block">
                        <img
                          src="\${w.url.replace("/originals/", "/736x/")}"
                          class="w-full aspect-video object-cover"
                          loading="lazy"
                        />
                        <div class="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded-full">
                          \${w.width} x \${w.height} · \${formatFileSize(w.size)}
                        </div>
                      </a>
                    \`;
                    grid.appendChild(div);
                  });
                } catch (e) {
                  console.error("Failed to load more wallpapers", e);
                }
              }
            });
            
            const sentinel = document.getElementById("sentinel");
            if (sentinel) observer.observe(sentinel);
          });
        `
      }} />
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
    // return c.redirect(wallpaper.url)
    return c.json({ error: "Failed to fetch image" }, 500);
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
    },
  });
});

export default app;
