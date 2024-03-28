import type { TRPCLink } from '@trpc/client';
import { TransformerOptions } from '@trpc/client/dist/unstable-internals';
import type { AnyRouter, AnyTRPCRouter } from '@trpc/server';
import { inferClientTypes } from '@trpc/server/unstable-core-do-not-import';

import { createBaseLink } from './internal/base';

export type ChromeLinkOptions<TRouter extends AnyTRPCRouter> = {
  port: chrome.runtime.Port;
} & TransformerOptions<inferClientTypes<TRouter>>;

export const chromeLink = <TRouter extends AnyRouter>(
  opts: ChromeLinkOptions<TRouter>,
): TRPCLink<TRouter> => {
  return createBaseLink({
    postMessage(message) {
      opts.port.postMessage(message);
    },
    addMessageListener(listener) {
      opts.port.onMessage.addListener(listener);
    },
    removeMessageListener(listener) {
      opts.port.onMessage.removeListener(listener);
    },
    addCloseListener(listener) {
      opts.port.onDisconnect.addListener(listener);
    },
    removeCloseListener(listener) {
      opts.port.onDisconnect.removeListener(listener);
    },
    ...opts,
  });
};
