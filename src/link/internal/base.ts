import { OperationResultEnvelope, TRPCClientError, TRPCLink } from '@trpc/client';
import {
  CoercedTransformerParameters,
  TransformerOptions,
} from '@trpc/client/dist/unstable-internals';
import type { AnyRouter, CombinedDataTransformer } from '@trpc/server';
import { observable } from '@trpc/server/observable';

import { isTRPCResponse } from '../../shared/trpcMessage';
import type { MessengerMethods, TRPCChromeRequest } from '../../types';

export const createBaseLink = <TRouter extends AnyRouter>(
  opts: MessengerMethods<TRouter>,
): TRPCLink<TRouter> => {
  return () => {
    return ({ op }) => {
      return observable((observer) => {
        const listeners: (() => void)[] = [];

        const { id, type, path } = op;
        const transformer = getTransformer(opts.transformer);

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const input = transformer.input.serialize(op.input);

          const onDisconnect = () => {
            observer.error(new TRPCClientError('Port disconnected prematurely'));
          };

          opts.addCloseListener(onDisconnect);
          listeners.push(() => opts.removeCloseListener(onDisconnect));

          const onMessage = (message: unknown) => {
            if (!isTRPCResponse(message)) return;
            const { trpc } = message;
            if (id !== trpc.id) return;

            if ('error' in trpc) {
              return observer.error(TRPCClientError.from(trpc));
            }

            observer.next({
              result: {
                ...trpc.result,
                ...((!trpc.result.type || trpc.result.type === 'data') && {
                  type: 'data',
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  data: transformer.output.deserialize(trpc.result.data),
                }),
              },
            } as OperationResultEnvelope<TRouter>);

            if (type !== 'subscription' || trpc.result.type === 'stopped') {
              observer.complete();
            }
          };

          opts.addMessageListener(onMessage);
          listeners.push(() => opts.removeMessageListener(onMessage));

          opts.postMessage({
            trpc: {
              id,
              jsonrpc: undefined,
              method: type,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              params: { path, input },
            },
          } as TRPCChromeRequest);
        } catch (cause) {
          observer.error(
            new TRPCClientError(cause instanceof Error ? cause.message : 'Unknown error'),
          );
        }

        return () => {
          if (type === 'subscription') {
            opts.postMessage({
              trpc: {
                id,
                jsonrpc: undefined,
                method: 'subscription.stop',
              },
            } as TRPCChromeRequest);
          }
          listeners.forEach((unsub) => unsub());
        };
      });
    };
  };
};

/**
 * @internal
 */
export function getTransformer(
  transformer:
    | TransformerOptions<{ transformer: false }>['transformer']
    | TransformerOptions<{ transformer: true }>['transformer']
    | undefined,
): CombinedDataTransformer {
  const _transformer = transformer as CoercedTransformerParameters['transformer'];
  if (!_transformer) {
    return {
      input: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        serialize: (data) => data,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        deserialize: (data) => data,
      },
      output: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        serialize: (data) => data,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        deserialize: (data) => data,
      },
    };
  }
  if ('input' in _transformer) {
    return _transformer;
  }
  return {
    input: _transformer,
    output: _transformer,
  };
}
