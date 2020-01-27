import React from 'react';
import { useSFState } from '@sfstate/react';
import { MachineConfig } from '@sfstate/core';

type ImageState =
  | { status: 'idle'; context: {} }
  | { status: 'loading'; context: {} }
  | { status: 'loaded'; context: { imageUrl: string } }
  | { status: 'loadingFailed'; context: { error: string } };
type ImageEvent = { type: 'load' } | { type: 'cancel' };

const config: MachineConfig<ImageState, ImageEvent> = {
  initial: { status: 'idle', context: {} },
  states: {
    idle: {
      on: {
        load: () => ({ status: 'loading', context: {} }),
      },
    },
    loading: {
      invoke: () => {
        return new Promise(resolve => {
          // Simulating API call
          const imageUrl = 'https://picsum.photos/200/' + Math.floor(Math.random() * (300 - 200 + 1) + 200);
          setTimeout(() => resolve({ status: 'loaded', context: { imageUrl } }), 5000);
        });
      },
      on: {
        cancel: () => ({ status: 'idle', context: {} }),
      },
    },
    loaded: {
      on: {
        load: () => ({ status: 'loading', context: {} }),
      },
    },
    loadingFailed: {
      on: {
        load: () => ({ status: 'loading', context: {} }),
      },
    },
  },
};

export default function ApiImage() {
  const [current, send] = useSFState(config);

  const isLoading = current.status === 'loading';
  return (
    <div>
      {current.status === 'loaded' && <img src={current.context.imageUrl} alt="Random Image" />}
      {current.status === 'loading' && <p>Loading...</p>}
      {current.status === 'loadingFailed' && <p>{current.context.error}</p>}
      <button onClick={() => send({ type: isLoading ? 'cancel' : 'load' })}>{isLoading ? 'CANCEL' : 'LOAD'}</button>
    </div>
  );
}
