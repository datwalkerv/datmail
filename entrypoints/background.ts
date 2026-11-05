// Content scripts cannot open the options page themselves.
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg) => {
    if (msg === 'open-options') browser.runtime.openOptionsPage();
    if (import.meta.env.DEV && msg === 'dev-reload') browser.runtime.reload();
  });
});
