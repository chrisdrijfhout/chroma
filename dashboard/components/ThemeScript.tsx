export default function ThemeScript() {
  const code = `
    (function() {
      try {
        var match = document.cookie.match(/(?:^|; )chroma-theme=([^;]*)/);
        var theme = match ? decodeURIComponent(match[1]) : 'light';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
