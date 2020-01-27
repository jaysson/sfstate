import produce from 'immer';

export type StateShape = {
  status: string;
  context: object;
};
export type Event = {
  type: string;
};
export type StateConfig<GenericStateShape extends StateShape, GenericEvent extends Event> = {
  invoke?: (state: GenericStateShape, event: GenericEvent) => Promise<GenericStateShape>;
  onEntry?: () => any;
  onExit?: () => any;
  on?: { [event in GenericEvent['type']]?: (state: GenericStateShape, event: GenericEvent) => GenericStateShape };
};
export type MachineConfig<GenericStateShape extends StateShape, GenericEvent extends Event> = {
  initial: GenericStateShape;
  states: {
    [key in GenericStateShape['status']]: StateConfig<GenericStateShape, GenericEvent>;
  };
};
export type Listener<S extends StateShape> = (state: S) => any;
export type StateManager<GenericStateShape extends StateShape, GenericEvent extends Event> = {
  start: () => void;
  stop: () => void;
  send: (event: GenericEvent) => Promise<void>;
  listen: (handler: Listener<GenericStateShape>) => () => void;
  current: GenericStateShape
};

/**
 * Creates the state manager
 *
 * @param config
 */
export const create = <GenericStateShape extends StateShape, GenericEvent extends Event>(
  config: MachineConfig<GenericStateShape, GenericEvent>,
): StateManager<GenericStateShape, GenericEvent> => {
  // The state is mutable, but the supplied config will not be touched.
  // This can be used to create multiple service managers from same config object.
  let state = produce(config.initial, () => config.initial) as GenericStateShape;
  const listeners = new Map<Symbol, Listener<GenericStateShape>>();
  let currentService: Symbol | null;
  let isRunning = false;

  const start = () => {
    isRunning = true;
    broadcast();
  };
  const stop = () => (isRunning = false);
  const listen = (handler: Listener<GenericStateShape>) => {
    const id = Symbol();
    listeners.set(id, handler);
    return () => listeners.delete(id);
  };
  const broadcast = () => {
    if (!isRunning) return;
    listeners.forEach(listener => listener(state));
  };

  /**
   * Responsible for going to new state and executing any associated services there
   *
   * @param newState
   * @param event
   */
  const transitionTo = (newState: GenericStateShape, event: GenericEvent) => {
    state = newState;
    // Only one promise can be invoked at a time in a machine
    // If we move to a new state, we stop caring about whatever happens to the old promise
    currentService = null;
    broadcast();
    const newStateStatus = state.status as keyof MachineConfig<GenericStateShape, GenericEvent>['states'];
    if (config.states[newStateStatus].invoke) {
      const serviceId = Symbol();
      currentService = serviceId;
      config.states[newStateStatus].invoke!(state, event).then(nextState => {
        // Only use the result if we are still in the same state
        if (currentService === serviceId) {
          transitionTo(nextState, event);
        }
      });
    }
  };

  /**
   * The event handler exposed for outside world
   *
   * @param event
   */
  const send = async (event: GenericEvent) => {
    if (!isRunning) return;

    const currentState = state.status as keyof MachineConfig<GenericStateShape, GenericEvent>['states'];
    const currentStateConfig = config.states[currentState];
    const eventType = event.type as GenericEvent['type'];
    if (currentStateConfig.on && currentStateConfig.on[eventType]) {
      transitionTo(currentStateConfig.on[eventType]!(state, event), event);
    }
  };

  return {
    start,
    stop,
    send,
    listen,
    get current() {
      return state;
    }
  };
};
