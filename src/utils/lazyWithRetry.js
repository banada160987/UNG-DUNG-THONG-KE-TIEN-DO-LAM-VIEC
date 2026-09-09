import { lazy } from 'react';

/**
 * Smart lazy loader with automatic reload recovery for Vercel deployment chunk updates.
 * Automatically recovers when a new build is deployed and chunk hashes change.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem('cbq_page_refreshed_for_chunk') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('cbq_page_refreshed_for_chunk', 'false');
      return component;
    } catch (error) {
      console.warn("Phát hiện phiên bản mới trên Vercel - Đang tự động làm mới trang...", error);
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('cbq_page_refreshed_for_chunk', 'true');
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });
