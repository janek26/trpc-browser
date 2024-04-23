import { createTRPCProxyClient } from '@trpc/client';
import type { PlasmoCSConfig } from 'plasmo';
import type { FC } from 'react';
import SuperJSON from 'superjson';
import { windowLink } from 'trpc-browser/link';
import type { AppRouter } from '~background';

console.log('inpage script loaded');

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  world: 'MAIN',
};

const windowClient = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [/* 👉 */ windowLink({ window })],
});

const ExtensionInpageUi: FC = () => {
  return (
    // a button to open google in a new tab
    <button
      style={{
        padding: 16,
        fontSize: 16,
        fontWeight: 'bold',
        borderRadius: 8,
        border: 'none',
        backgroundColor: '#000',
        color: '#fff',
        cursor: 'pointer',
      }}
      onClick={async () => {
        await windowClient.subscribeToAnything.subscribe(undefined, {
          onData(data) {
            console.log('data', data);
          },
        });
      }}
    >
      Open Google
    </button>
  );
};

export default ExtensionInpageUi;
