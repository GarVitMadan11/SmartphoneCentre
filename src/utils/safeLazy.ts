import { lazy, ComponentType } from 'react';

/**
 * Resilient `lazy` import wrapper that automatically handles dynamic module fetch errors
 * (e.g. when an app redeployment invalidates old hashed chunk filenames).
 */
export function safeLazy<T extends ComponentType<any> = ComponentType<any>>(
  factory: () => Promise<any>,
  namedExport?: string
) {
  return lazy(async () => {
    const RELOAD_KEY = 'rex_chunk_reload_attempts';
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await factory();
        // Clear reload tracking flag on successful component load
        sessionStorage.removeItem(RELOAD_KEY);

        let Component: any;
        if (namedExport) {
          Component = module[namedExport] || module.default;
        } else {
          Component = module.default || module;
        }

        return { default: Component as T };
      } catch (error: any) {
        console.warn(`[safeLazy] Attempt ${attempt + 1} failed for module:`, error);
        
        const isChunkFetchError =
          error instanceof TypeError ||
          /failed to fetch/i.test(error?.message || '') ||
          /loading chunk/i.test(error?.message || '') ||
          /dynamically imported module/i.test(error?.message || '');

        if (!isChunkFetchError && attempt === maxRetries) {
          throw error;
        }

        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, 300 * (attempt + 1)));
        } else if (isChunkFetchError) {
          const attempts = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10);
          if (attempts < 2) {
            sessionStorage.setItem(RELOAD_KEY, String(attempts + 1));
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
          throw error;
        }
      }
    }

    throw new Error('Failed to load dynamic component after retries.');
  });
}
