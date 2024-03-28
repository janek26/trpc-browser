import type { TRPCLink } from '@trpc/client';
import { TransformerOptions } from '@trpc/client/dist/unstable-internals';
import type { AnyRouter, AnyTRPCRouter } from '@trpc/server';
import { inferClientTypes } from '@trpc/server/unstable-core-do-not-import';

import type { MinimalWindow, TRPCChromeMessage } from '../types';
import { createBaseLink } from './internal/base';

export type WindowLinkOptions<TRouter extends AnyTRPCRouter> = {
  window: MinimalWindow;
  postWindow?: MinimalWindow;
  postOrigin?: string;
} & TransformerOptions<inferClientTypes<TRouter>>;

export const windowLink = <TRouter extends AnyRouter>(
  opts: WindowLinkOptions<TRouter>,
): TRPCLink<TRouter> => {
  const handlerMap = new Map<
    (message: TRPCChromeMessage) => void,
    (ev: MessageEvent<TRPCChromeMessage>) => void
  >();

  const listenWindow = opts.window;
  const postWindow = opts.postWindow ?? listenWindow;

  return createBaseLink({
    postMessage(message) {
      postWindow.postMessage(message, {
        targetOrigin: opts.postOrigin,
      });
    },
    addMessageListener(listener) {
      const handler = (ev: MessageEvent<TRPCChromeMessage>) => {
        listener(ev.data);
      };
      handlerMap.set(listener, handler);
      listenWindow.addEventListener('message', handler);
    },
    removeMessageListener(listener) {
      const handler = handlerMap.get(listener);
      if (handler) {
        listenWindow.removeEventListener('message', handler);
      }
    },
    addCloseListener(listener) {
      listenWindow.addEventListener('beforeunload', listener);
    },
    removeCloseListener(listener) {
      listenWindow.removeEventListener('beforeunload', listener);
    },
    ...opts,
  });
};
