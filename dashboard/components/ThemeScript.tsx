export default function ThemeScript() {
  const code = `
    (function() {
      try {
        var saved = localStorage.getItem('chroma-theme');
        var theme = saved || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
