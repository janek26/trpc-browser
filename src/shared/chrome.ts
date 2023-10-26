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
    3, // 3 retries
    (retry) => wait(retry * 150), // 150ms, 300ms, max total wait 450ms
  );
  console.log('Port connected');
  const cleanUp = onConnect(port);
  port.onDisconnect.addListener(() => {
    cleanUp?.();
    console.log('Port disconnected, reconnecting...');
    void autoConnect(browser, onConnect);
  });
}
