import { useEffect, useRef, useState } from 'react';
import { create, Event, StateManager, StateShape, MachineConfig } from '@sfstate/core';

export const useSFStateManager = <GenericState extends StateShape, GenericEvent extends Event>(
  manager: StateManager<GenericState, GenericEvent>,
): [
  GenericState,
  StateManager<GenericState, GenericEvent>['send'],
  StateManager<GenericState, GenericEvent>['listen'],
] => {
  const [current, setCurrent] = useState<GenericState>(manager.current);
  useEffect(() => manager.listen(setCurrent), [manager]);
  return [current, manager.send, manager.listen];
};

export const useSFState = <GenericState extends StateShape, GenericEvent extends Event>(
  config: MachineConfig<GenericState, GenericEvent>,
) => {
  const managerBox = useRef(create(config));
  useEffect(() => {
    managerBox.current.start();
    return managerBox.current.stop;
  }, []);
  return useSFStateManager(managerBox.current);
};
