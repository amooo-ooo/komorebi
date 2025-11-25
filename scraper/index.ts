import OpenAI from 'openai';
import sizeOf from 'image-size';
import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';

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
    'https://i.pinimg.com/originals/c5/4b/06/c54b062244a598d0f65f7391b2d5304b.jpg'
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
"color_dominant": "", // hex
"color_palette": [], // [hex, hex, hex] (primary, secondary, accent)
"tags": [], // [str, str, str, str, str, str, str, str]
"rating": "", // safe | suggestive | explicit
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
            ...metadata,
        };
    } catch (error: any) {
        console.error("Error generating image description:", error);
        return `[Image description failed to generate: ${error.message}]`;
    }
}

export async function scrapeWallpapers(concurrency: number, outputFile: string) {
    console.log(`Starting scrape with concurrency: ${concurrency}`);
    const results: (ImageMetadata | string)[] = [];
    const queue = [...wallpapers];
    const workers = [];

    for (let i = 0; i < concurrency; i++) {
        workers.push((async () => {
            while (queue.length > 0) {
                const url = queue.shift();
                if (url) {
                    console.log(`Processing: ${url}`);
                    const result = await getImageMetadata(url);
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
    scrapeWallpapers(2, 'wallpapers.json');
}
