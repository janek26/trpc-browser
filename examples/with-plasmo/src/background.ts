import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import SuperJSON from 'superjson';
import { z } from 'zod';

import { createChromeHandler } from '../../../adapter';

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
  transformer: SuperJSON,
});

const appRouter = t.router({
  openNewTab: t.procedure.input(z.object({ url: z.string().url() })).mutation(async ({ input }) => {
    await chrome.tabs.create({ url: input.url, active: true });
  }),
  subscribeToAnything: t.procedure.subscription(() => {
    return observable<string | undefined>((emit) => {
      const interval = setInterval(() => {
        emit.next(new Date().toISOString());
      }, 1000);
      return () => clearInterval(interval);
    });
  }),
});

export type AppRouter = typeof appRouter;

createChromeHandler({ router: appRouter });
