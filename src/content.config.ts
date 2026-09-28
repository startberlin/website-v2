import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Curated LinkedIn posts for the homepage news section. Image paths are
// relative to src/data/news.json.
const news = defineCollection({
	loader: file('src/data/news.json'),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			url: z.string().url(),
			image: image().optional(),
		}),
});

export const collections = { news };
