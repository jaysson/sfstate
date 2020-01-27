# Simple F\*\*king State

This is yet another state management library inspired by xstate, written in typescript. This is not well tested yet. Use
at your own risk.

## Principles

- `state` is made of `status` and `context`
- `context` will always have the same shape for the same `status`. Enforced only if you use `typescript`
- `state` can change based on current `status` and the `event`
- When you enter a `status`, a `Promise` can be invoked to get the next `state`. If an `event` is fired while in such
  `status`, results from that `Promise` will be ignored
- `service manager` accepts the config for this whole process
- You can `create`, `start`, `listen`, and `stop` as many such `state managers` as you wish. Feel free to create and put
  multiple `state managers` in `data` and communicate with them however you want
- You can specify `onEntry` and `onExit` callbacks for each state. These are side effects and not used by the
  `state manager`

## Examples
See `packages/examples` directory
