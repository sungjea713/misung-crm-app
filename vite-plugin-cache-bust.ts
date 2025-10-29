import type { Plugin } from 'vite';

export function cacheBustPlugin(): Plugin {
  const version = Date.now().toString();

  return {
    name: 'cache-bust',

    transformIndexHtml(html) {
      // 개발 환경에서만 CSS/JS에 버전 쿼리 파라미터 추가
      if (process.env.NODE_ENV !== 'production') {
        return html
          .replace(
            /(<link[^>]*href=["']([^"'?]+\.css)[^"']*["'])/g,
            `$1?v=${version}`
          )
          .replace(
            /(<script[^>]*src=["']([^"'?]+\.js)[^"']*["'])/g,
            `$1?v=${version}`
          );
      }
      return html;
    },

    // Service Worker 파일에 버전 주입 (빌드 시)
    generateBundle(_options, bundle) {
      Object.keys(bundle).forEach((fileName) => {
        if (fileName === 'service-worker.js') {
          const file = bundle[fileName];
          if (file.type === 'asset' && typeof file.source === 'string') {
            file.source = file.source.replace(/__CACHE_VERSION__/g, version);
            console.log(`[cache-bust] Service Worker version: ${version}`);
          }
        }
      });
    },
  };
}
