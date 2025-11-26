import OpenAI from 'openai';
import sizeOf from 'image-size';
import { Buffer } from 'node:buffer';
import { writeFile, readFile } from 'node:fs/promises';

const wallpapers = [
    'https://i.pinimg.com/originals/89/61/94/8961942207903c314fd6b2f3cca72116.jpg',
    'https://i.pinimg.com/originals/f5/c8/9e/f5c89e16715d2c1cc24e6a23c5c7c161.jpg',
    'https://i.pinimg.com/originals/4e/14/fd/4e14fda7732654cc4c63a48586067ee0.jpg',
    'https://i.pinimg.com/originals/f2/d6/cc/f2d6cce779432878bb208b728de60d14.jpg',
    'https://i.pinimg.com/originals/25/83/2d/25832d4c996458ebe64ad194c0d47a74.jpg',
    'https://i.pinimg.com/originals/39/41/3d/39413d1937db964cc0c3413833a0cb22.jpg',
    'https://i.pinimg.com/originals/55/99/9e/55999e19bbadfb51b03e456a398eb3fb.jpg',
    'https://i.pinimg.com/originals/7f/2b/f0/7f2bf066d54eaf56e923c80c2c53e653.jpg',
    'https://i.pinimg.com/originals/cc/ff/67/ccff67c8473530b7bab571b65020732b.jpg',
    'https://i.pinimg.com/originals/98/9a/da/989adaabd27ad3bac03b52e39c6abb62.jpg',
    'https://i.pinimg.com/originals/31/14/6b/31146b22bb3f69e5c1d6c5dc933ce5b8.jpg',
    'https://i.pinimg.com/originals/6e/c5/63/6ec56368ec88118d57fa668e4812819d.jpg',
    'https://i.pinimg.com/originals/27/dd/e3/27dde3d35290177af71138a8731e09d8.jpg',
    'https://i.pinimg.com/originals/68/14/f7/6814f7a27632be084fd0932faf1eb2d0.jpg',
    'https://i.pinimg.com/originals/1a/11/db/1a11db1440e20ff9a675c8c7209271a4.jpg',
    'https://i.pinimg.com/originals/6c/36/14/6c36142ab814fac0477b45fdc53a76e1.jpg',
    'https://i.pinimg.com/originals/6c/d3/19/6cd319754baca4e42e00ecbb7d204967.jpg',
    'https://i.pinimg.com/originals/ef/01/df/ef01dfbf5ca2b1682ac27830895683b5.jpg',
    'https://i.pinimg.com/originals/c5/4b/06/c54b062244a598d0f65f7391b2d5304b.jpg',
    'https://i.pinimg.com/originals/e4/45/63/e445634a1037643542ed538fda6507c4.jpg',
    'https://i.pinimg.com/originals/a1/83/76/a183767608c263a91464835b91b53f3e.jpg',
    'https://i.pinimg.com/originals/de/81/01/de8101224c641a947edf4a1ba5c4bc6c.jpg',
    'https://i.pinimg.com/originals/1a/9e/50/1a9e50b11ba3e1ea98bcffa5f601c0f7.jpg',
    'https://i.pinimg.com/originals/ba/40/db/ba40dbaaac329e0bb33ecb931962049d.jpg',
    'https://i.pinimg.com/originals/ab/37/6a/ab376a94eb37044ded656c2883f95d06.jpg',
    'https://i.pinimg.com/originals/14/4c/74/144c740f5d8b3bb952e1c09cd58f387c.jpg',
    'https://images3.alphacoders.com/135/thumb-1920-1354889.jpeg',
    'https://i.pinimg.com/originals/df/50/be/df50be83823f019051f568140df63095.jpg',
    'https://i.pinimg.com/originals/33/34/92/33349277b1aa177314440b96c1ed3199.jpg',
    'https://i.pinimg.com/originals/45/45/bd/4545bd3497e06b37744fa6259c9a6c9b.jpg',
    'https://i.pinimg.com/originals/a6/9e/cc/a69eccbad8ea3540d2e28d2502bcd904.jpg',
    'https://i.pinimg.com/originals/1a/3e/cc/1a3eccaa46b7840aef63d4048041a5d8.jpg',
    'https://i.pinimg.com/originals/9a/5c/33/9a5c339cd0dfbe8f1069e731fff639cc.jpg',
    'https://i.pinimg.com/originals/5c/af/06/5caf06cf585e60fefb395eb610c9aa31.jpg',
    'https://i.pinimg.com/originals/54/66/2a/54662a5efd9419ab93f6fd9618eb47ef.jpg',
    'https://i.pinimg.com/originals/36/f0/85/36f085bf07558b09f8fe5ba9a8f17932.jpg',
    'https://i.pinimg.com/originals/6b/fa/80/6bfa801c77d49cd4173305631a5c8736.jpg',
    'https://i.pinimg.com/originals/35/c6/8d/35c68d0cf4837009da5742ca64b67711.jpg',
    'https://images4.alphacoders.com/891/thumb-1920-891121.jpg',
    'https://i.pinimg.com/originals/be/31/85/be3185df83c16bff39f1780a9c5e9a7c.jpg',
    'https://i.pinimg.com/originals/be/fa/b9/befab907cb59b70cacf38127dda118c1.jpg',
    'https://cdn.komorebi.orizuru.dev/cdn/1b6da91ba5fc2d42601cef4c4dab50f9.jpg',
    'https://cdn.komorebi.orizuru.dev/cdn/9ff8e6459f472cbc1d8b5029f173d1ef.png',
    'https://cdn.komorebi.orizuru.dev/cdn/3ba12d50abe49e7cedeeb97b10f7def3.png'
]

const openai = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
});

export interface ImageMetadata {
    url: string;
    width: number;
    height: number;
    size: number;
    color_dominant: string;
    color_palette: string[];
    tags: string[];
    rating: 'safe' | 'suggestive' | 'explicit';
    theme: 'dark' | 'light' | null;
    artist: string;
    source: string;
    id: number;
}

export async function getImageMetadata(url: string): Promise<ImageMetadata | string> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const imageArrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageArrayBuffer);
        const size = buffer.length;

        const dimensions = sizeOf(buffer);
        const width = dimensions.width || 0;
        const height = dimensions.height || 0;

        let apiBuffer = buffer;
        try {
            const lowResUrl = url.replace('/originals/', '/736x/');
            if (lowResUrl !== url) {
                // console.log(`Fetching low res image: ${lowResUrl}`);
                const lowResResponse = await fetch(lowResUrl);
                if (lowResResponse.ok) {
                    const lowResArrayBuffer = await lowResResponse.arrayBuffer();
                    apiBuffer = Buffer.from(lowResArrayBuffer);
                    // console.log(`Using low res image for API (${apiBuffer.length} bytes vs ${size} bytes)`);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch low res image, falling back to original", e);
        }

        const base64Image = apiBuffer.toString('base64');

        const completion = await openai.chat.completions.create({
            model: "meta/llama-4-maverick-17b-128e-instruct", temperature: 0.50, top_p: 1.00, max_tokens: 4096, stream: false,
            messages: [
                {
                    role: "system",
                    content: `Given the image, fill in the JSON. Do not include comments: {
"color_dominant": str, // hex
"color_palette": [str, str, str], // (primary, secondary, accent in hex)
"tags": [str, str, str, str, str, str, str, str],
"rating": "safe" | "suggestive" | "explicit", 
"theme": "light" | "dark" | null // (null means it works in both light and dark mode)
}`
                },
                {
                    role: "user",
                    content: `<img src="data:${contentType};base64,${base64Image}" />`
                }
            ],
        });

        let jsonContent = completion.choices[0]?.message?.content?.trim() || "{}";

        if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const metadata = JSON.parse(jsonContent);

        return {
            url,
            width,
            height,
            size,
            artist: null,
            source: null,
            ...metadata,
        };
    } catch (error: any) {
        console.error("Error generating image description:", error);
        return `[Image description failed to generate: ${error.message}]`;
    }
}

export async function scrapeWallpapers(concurrency: number, outputFile: string, check: boolean = true) {
    console.log(`Scraping ${wallpapers.length} wallpapers`);
    console.log(`Starting scrape with concurrency: ${concurrency}, check: ${check}`);

    const results: (ImageMetadata | string)[] = [];
    const queue = [...wallpapers];
    const workers = [];

    const existingMap = new Map<string, ImageMetadata>();
    let maxId = 0;
    if (check) {
        try {
            const data = await readFile(outputFile, 'utf-8');
            const existingWallpapers = JSON.parse(data);
            if (Array.isArray(existingWallpapers)) {
                existingWallpapers.forEach((item: ImageMetadata) => {
                    if (item.url) {
                        existingMap.set(item.url, item);
                    }
                    if (item.id && item.id > maxId) {
                        maxId = item.id;
                    }
                });
            }
            console.log(`Loaded ${existingMap.size} existing wallpapers for checking from ${outputFile}.`);
            console.log(`Max existing ID: ${maxId}`);
        } catch (e) {
            console.warn(`Failed to load existing wallpapers from ${outputFile} (might not exist yet)`, e);
        }
    }

    for (let i = 0; i < concurrency; i++) {
        workers.push((async () => {
            while (queue.length > 0) {
                const url = queue.shift();
                if (url) {
                    if (check && existingMap.has(url)) {
                        const existing = existingMap.get(url);
                        // TODO: schema validation
                        const isValid = true;

                        if (isValid) {
                            console.log(`Skipping ${url} (already exists)`);
                            results.push(existing);
                            continue;
                        } else {
                            console.log(`Re-scraping ${url} (invalid schema in existing data)`);
                        }
                    }

                    console.log(`Processing: ${url}`);
                    const result = await getImageMetadata(url);
                    if (typeof result !== 'string') {
                        result.id = ++maxId;
                    }
                    results.push(result);
                }
            }
        })());
    }

    await Promise.all(workers);

    console.log(`Writing results to ${outputFile}`);
    await writeFile(outputFile, JSON.stringify(results, null, 2));
    console.log("Done!");
}

if (import.meta.main) {
    scrapeWallpapers(3, 'wallpapers.json', true);
}
