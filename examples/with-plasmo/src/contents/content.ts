import { relay } from 'trpc-browser/relay';
import { autoConnect } from 'trpc-browser/shared/chrome';

void autoConnect(
  () => chrome.runtime.connect(),
  (port) => {
    return relay(window, port); // return so it has the cleanup function for disconnect
  },
).then(() => {
  return console.log('Content script loaded - bridge initialized');
});
