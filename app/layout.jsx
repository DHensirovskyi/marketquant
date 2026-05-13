import './globals.css';

export const metadata = {
  title: 'Trading Analytics — Дашборд аналітики ринків',
  description: 'Сесійна аналітика валютних ринків: ASR, пробої, кореляції, Inside Bar, NY Midnight.',
};

// Inline script: apply persisted theme BEFORE React hydrates to avoid FOUC.
const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('ta-theme') || 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
