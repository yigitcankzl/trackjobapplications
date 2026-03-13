import { Helmet } from 'react-helmet-async';
import { createElement } from 'react';

const BASE_URL = 'https://www.trackjobapplications.com';
const SITE_NAME = 'TrackJobs';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function useSEO({ title, description, path = '/', ogImage, noIndex }: SEOProps) {
  const canonicalUrl = `${BASE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return createElement(Helmet, null,
    createElement('title', null, title),
    createElement('meta', { name: 'description', content: description }),
    createElement('link', { rel: 'canonical', href: canonicalUrl }),

    // Open Graph
    createElement('meta', { property: 'og:title', content: title }),
    createElement('meta', { property: 'og:description', content: description }),
    createElement('meta', { property: 'og:url', content: canonicalUrl }),
    createElement('meta', { property: 'og:image', content: image }),
    createElement('meta', { property: 'og:type', content: 'website' }),
    createElement('meta', { property: 'og:site_name', content: SITE_NAME }),

    // Twitter Card
    createElement('meta', { name: 'twitter:card', content: 'summary_large_image' }),
    createElement('meta', { name: 'twitter:title', content: title }),
    createElement('meta', { name: 'twitter:description', content: description }),
    createElement('meta', { name: 'twitter:image', content: image }),

    // Robots
    ...(noIndex ? [createElement('meta', { name: 'robots', content: 'noindex, nofollow' })] : []),
  );
}
