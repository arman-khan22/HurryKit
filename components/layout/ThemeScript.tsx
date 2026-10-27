/**
 * Inline theme script — runs before first paint to prevent flash of wrong theme.
 * Must not import any client code; only ever inlined as raw JS.
 */
export function ThemeScript() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('hurrykit-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
