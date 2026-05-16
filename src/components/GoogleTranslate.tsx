'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function GoogleTranslate() {
  useEffect(() => {
    // Thêm CSS để ẩn thanh công cụ mặc định của Google Translate
    // và ẩn các tooltip khi hover vào text đã dịch
    const style = document.createElement('style');
    style.innerHTML = `
      .skiptranslate iframe, .goog-te-banner-frame { display: none !important; }
      body { top: 0 !important; }
      #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    window.googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'vi',
          includedLanguages: 'vi,en',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}

// Thêm khai báo type cho window
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
  }
}
