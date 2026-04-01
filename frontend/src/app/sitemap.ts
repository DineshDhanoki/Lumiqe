import { MetadataRoute } from 'next';
import seasonsData from '@/data/seasons.json';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.lumiqe.in';

    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/analyze`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    ];

    const seasonPages: MetadataRoute.Sitemap = Object.keys(seasonsData).map(season => ({
        url: `${baseUrl}/seasons/${season.toLowerCase().replace(/\s+/g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticPages, ...seasonPages];
}
