export default function ThemeScript() {
  const code = `
    (function() {
      try {
        var saved = localStorage.getItem('chroma-theme');
        var theme = saved || 'light';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
