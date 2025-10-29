import type { Plugin } from 'vite';

export function cacheBustPlugin(): Plugin {
  return {
    name: 'cache-bust',
    transformIndexHtml(html) {
      const version = Date.now();
      // CSS와 JS 파일에 버전 쿼리 파라미터 추가
      return html
        .replace(
          /(<link[^>]*href=["']([^"'?]+\.css)[^"']*["'])/g,
          `$1?v=${version}`
        )
        .replace(
          /(<script[^>]*src=["']([^"'?]+\.js)[^"']*["'])/g,
          `$1?v=${version}`
        );
    },
  };
}
