import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const defaultSEO = {
  title: 'Warungin - Sistem Kasir Modern untuk UMKM | Aplikasi Kasir Warung & Toko',
  description: 'Kelola warung dan toko Anda dengan mudah menggunakan sistem kasir modern. Mulai dari Rp 200rb/bulan dengan trial gratis 14 hari. Fitur lengkap: transaksi, inventori, laporan, dan multi-outlet.',
  image: 'https://pos.faiznute.site/og-image.jpg',
  url: 'https://pos.faiznute.site',
  type: 'website',
  keywords: 'sistem kasir, warung, toko, UMKM, inventori, laporan penjualan, aplikasi kasir, sistem toko, software toko, aplikasi warung, sistem kasir online, aplikasi kasir Indonesia, aplikasi kasir murah',
};

function updateMetaTag(name: string, content: string, attribute: string = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function updateScriptTag(id: string, content: string) {
  let element = document.getElementById(id) as HTMLScriptElement;
  if (element) {
    element.textContent = content;
  } else {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    element.textContent = content;
    document.head.appendChild(element);
  }
}

export function useSEO(config: SEOConfig = {}) {
  const route = useRoute();
  
  const seoConfig = {
    title: config.title || defaultSEO.title,
    description: config.description || defaultSEO.description,
    image: config.image || defaultSEO.image,
    url: config.url || `${defaultSEO.url}${route.path}`,
    type: config.type || defaultSEO.type,
    keywords: config.keywords || defaultSEO.keywords,
  };

  const updateSEO = () => {
    // Update title
    document.title = seoConfig.title;
    
    // Basic Meta Tags
    updateMetaTag('description', seoConfig.description);
    updateMetaTag('keywords', seoConfig.keywords);
    updateMetaTag('author', 'Warungin');
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('theme-color', '#2563EB');
    
    // Open Graph Tags - Complete
    updateMetaTag('og:title', seoConfig.title, 'property');
    updateMetaTag('og:description', seoConfig.description, 'property');
    updateMetaTag('og:image', seoConfig.image, 'property');
    updateMetaTag('og:url', seoConfig.url, 'property');
    updateMetaTag('og:type', seoConfig.type, 'property');
    updateMetaTag('og:site_name', 'Warungin', 'property');
    updateMetaTag('og:locale', 'id_ID', 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:image:alt', seoConfig.title, 'property');
    
    // Twitter Card Tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoConfig.title);
    updateMetaTag('twitter:description', seoConfig.description);
    updateMetaTag('twitter:image', seoConfig.image);
    
    // Canonical URL - Always use HTTPS and remove trailing slash
    let canonicalUrl = seoConfig.url;
    // Remove trailing slash except for root
    if (canonicalUrl !== 'https://pos.faiznute.site' && canonicalUrl.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
    }
    // Ensure canonical is always set
    updateLinkTag('canonical', canonicalUrl);
    
    // Update Google Analytics page view
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-EJJJLD8YNQ', {
        'page_path': route.path + (route.query ? '?' + new URLSearchParams(route.query).toString() : ''),
        'page_title': seoConfig.title
      });
    }
    
    // Structured Data (JSON-LD) - Enhanced
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Warungin',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '200000',
        priceCurrency: 'IDR',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      description: seoConfig.description,
      url: seoConfig.url,
      screenshot: seoConfig.image,
      featureList: [
        'Sistem Kasir',
        'Manajemen Inventori',
        'Laporan Penjualan',
        'Multi-Outlet',
        'Dashboard Real-time',
      ],
      applicationSubCategory: 'Sistem Kasir',
      softwareVersion: '1.1.0',
    };
    updateScriptTag('structured-data', JSON.stringify(structuredData));
  };

  onMounted(() => {
    updateSEO();
  });

  watch(() => route.path, () => {
    updateSEO();
  });
}

