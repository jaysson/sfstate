# Simple F\*\*king State

This is yet another state management library inspired by xstate, written in typescript. This is not well tested yet. Use
at your own risk.

## Features

- Guarded transitions
- Typestates
- Derive state from a promise based on current state
- Derive state from event and current state

## Required reading

- https://dev.to/davidkpiano/no-disabling-a-button-is-not-app-logic-598i
- https://dev.to/davidkpiano/redux-is-half-of-a-pattern-1-2-1hd7

## Principles

- `state` is made of `status` and `context`
- `context` will always have the same shape for the same `status`. Enforced only if you use `typescript`
- `state` can change based on current `status` and the `event`
- When you enter a `status`, a `Promise` can be invoked to get the next `state`. If an `event` is fired while in such
  `status`, results from that `Promise` will be ignored
- `service manager` accepts the config for this whole process
- You can `create`, `start`, `listen`, and `stop` as many such `state managers` as you wish. Feel free to create and put
  multiple `state managers` in `context` and communicate with them however you want
- You can specify `onEntry` and `onExit` callbacks for each state. These are side effects and not used by the
  `state manager`

## Installation

The core library: `npm i @sfstate/core`

To use react hooks: `npm i @sfstate/react`

## Usage

Following is the general usage of `@sfstate/core`.

```typescript
import { MachineConfig, create } from '@sfstate/core';

// Describe your state as a union of types which have a string status and any context.
type ImageState =
  | { status: 'idle'; context: {} }
  | { status: 'loading'; context: {} }
  | { status: 'loaded'; context: { imageUrl: string } }
  | { status: 'loadingFailed'; context: { error: string } };

// Describe your events as a union of types which have a string `type`.
// You can have any additional data you want
// For ex. { type: 'input', value: string }
type ImageEvent = { type: 'load' } | { type: 'cancel' };

// Describe and the state manager and associate the state and event types
const config: MachineConfig<ImageState, ImageEvent> = {
  // This is the state we start with
  initial: { status: 'idle', context: {} },

  // You must describe all the possible states from your state union type
  // Every key corresponds to a `value` in the state union type
  states: {
    idle: {
      // Key of `on` corresponds to a `type` in event union type
      // Only specify the events you want to handle for this specific status
      // The function you specify here for the event will be called when the state manager receives that event
      // The function is passed current status and event. You must return the next state synchronously.
      // This is similar to a redux reducer. You can put all your conditional logic here
      on: {
        load: (currentStatus, event) => ({ status: 'loading', context: {} }),
      },
    },
    loading: {
      // When the state reaches `loading` status, the invoke function is called
      // It must return a promise which always resolves the next state
      // Handle the errors inside the function itself, and return an error state
      invoke: (currentStatus, event) => {
        return new Promise(resolve => {
          try {
            // Simulating API call
            const imageUrl = 'https://picsum.photos/200/' + Math.floor(Math.random() * (300 - 200 + 1) + 200);
            setTimeout(() => resolve({ status: 'loaded', context: { imageUrl } }), 5000);
          } catch (e) {
            resolve({ status: 'loadingFailed', error: e.message ?? 'Something went wrong' });
          }
        });
      },

      // Any event that is specified here and received when in this status makes state manager ignore the invoked promise
      on: {
        cancel: () => ({ status: 'idle', context: {} }),
      },

      // You can use this callback to log/send analytics
      // It will be called when we are moving away from this status
      onExit: console.log,
    },
    loaded: {
      // You can use this callback to log/send analytics
      // It will be called when we are entering this status
      onEntry: console.log,
      on: {
        load: () => ({ status: 'loading', context: {} }),
      },
    },
    loadingFailed: {
      onEntry: console.log,
      on: {
        load: () => ({ status: 'loading', context: {} }),
      },
    },
  },
};

// Create the state manager
const manager = create(config);
// Manager won't do anything until it's started
manager.start();
// Listen to state changes and run side effects such as updating the UI
manager.listen(currentState => console.log(currentState));
// Manager won't do anything when it's stopped
manager.stop();
```

Usage with react hooks:

```typescript
import { useSFState, useSFStateManager } from '@sfstate/react';

// See above for config. This creates a new state manager for the component.
const [currentState, send, manager] = useSFState(config);

// This requires you to handle creation, starting, and stopping the manager
// You can use it to reuse same state manager from multiple components
const [currentState, send] = useSFStateManager(manager);
```

## Comparison with xstate

`sfstate` does not have most features you can find in `xstate`. This is a much simpler, and less ambitious library. It
doesn't conform to state chart specification(SCXML). However, most of your app logic can be written with what's available in
`sfstate`.

- No nested states. If you want to mark something as nested, name the state value that way. For ex.
  `traffic.walk.walking`
- No nested state managers. Put them in `context` if you want. You can also listen to state changes and start other
  state managers
- No parallel state managers. Just create multiple state managers with appropriate config
- Only Promises can be invoked. If you want streams or actors or anything that can send multiple events to parent state
  manager, keep them out of the machine
- No conditional transitions. Put your conditional logic in the event `reducer`
- No activities. May be added in future if there is demand
- No delayed events & transitions. Keep that logic where the event originates

## Examples

See `packages/examples` directory
