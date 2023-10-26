import { retry, wait } from './retry';

type AllowCleanUpFunction = void | (() => void);

/**
 * Creates a port and recreates a new port if the old one disconnects
 *
 * @param chrome - chrome API
 * @param onConnect - callback when connected
 */
export async function autoConnect(
  browser: typeof chrome,
  onConnect: (port: chrome.runtime.Port) => AllowCleanUpFunction,
) {
  const port = await retry(
    () => browser.runtime.connect(),
    3, // 3 retries plus the initial try, so 4 total tries
    (retry) => wait(retry * 100), // 100ms, 200ms, 300ms, max total wait 600ms
  );
  console.log('Port connected');
  const cleanUp = onConnect(port);
  port.onDisconnect.addListener(() => {
    cleanUp?.();
    console.log('Port disconnected, reconnecting...');
    void autoConnect(browser, onConnect);
  });
}
