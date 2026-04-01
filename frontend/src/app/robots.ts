import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/dashboard/', '/account/', '/results/', '/payment/'],
            },
        ],
        sitemap: 'https://www.lumiqe.in/sitemap.xml',
    };
}
