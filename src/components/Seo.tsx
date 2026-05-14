import { useEffect } from 'react';
import { absoluteUrl } from '../lib/site';

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  jsonLd?: object;
  noIndex?: boolean;
}

const DEFAULT_DESC = 'AI-powered movie discovery. Get personalised picks, track your watchlist, and watch trailers.';
const DEFAULT_IMAGE = absoluteUrl('/og-image.png');

function resolveUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : absoluteUrl(value);
}

function upsertMeta(attr: string, value: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: object) {
  let el = document.querySelector(`script[data-seo="${id}"]`) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} | FilmFlare` : 'FilmFlare - Discover Your Next Favourite Film';
  const desc = description ?? DEFAULT_DESC;
  const img = image ? resolveUrl(image) : DEFAULT_IMAGE;
  const url = absoluteUrl(path);

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:image:alt', fullTitle);
    upsertMeta('property', 'og:site_name', 'FilmFlare');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', img);
    upsertMeta('name', 'twitter:image:alt', fullTitle);
    upsertLink('canonical', url);

    if (jsonLd) {
      upsertJsonLd('page', jsonLd);
    } else {
      document.querySelector('script[data-seo="page"]')?.remove();
    }
  }, [fullTitle, desc, img, type, url, jsonLd, noIndex]);

  return null;
}
