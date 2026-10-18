import { lazy, createElement } from 'react';

/**
 * Smart lazy loader with automatic reload recovery for Vercel deployment chunk updates.
 * Automatically recovers when a new build is deployed and chunk hashes change.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    let pageHasBeenRefreshed = false;
    try {
      pageHasBeenRefreshed = window.sessionStorage?.getItem('cbq_page_refreshed_for_chunk') === 'true';
    } catch (e) {
      // Ignore sessionStorage access errors in incognito/restricted mode
    }

    try {
      const component = await componentImport();
      try {
        window.sessionStorage?.setItem('cbq_page_refreshed_for_chunk', 'false');
      } catch (e) {}
      return component;
    } catch (error) {
      console.warn("Phát hiện phiên bản mới trên Vercel - Đang tự động làm mới trang...", error);
      if (!pageHasBeenRefreshed) {
        try {
          window.sessionStorage?.setItem('cbq_page_refreshed_for_chunk', 'true');
        } catch (e) {}
        window.location.reload();
        // Return a temporary placeholder while page reloads
        return {
          default: () => createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                color: '#64748b',
                fontFamily: 'Inter, sans-serif'
              }
            },
            createElement('div', {
              style: {
                width: '36px',
                height: '36px',
                border: '3px solid #0284c7',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '12px'
              }
            }),
            createElement('p', {
              style: { fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }
            }, 'Đang nạp phiên bản mới nhất...')
          )
        };
      }
      throw error;
    }
  });
