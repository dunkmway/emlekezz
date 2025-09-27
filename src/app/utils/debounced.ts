import { effect, signal, Signal } from "@angular/core";

export const debounced = <T>(inputSignal: Signal<T>, wait: number = 400) => {
  const debouncedSignal = signal<T>(inputSignal());
  const setSignal = debounce((value) => debouncedSignal.set(value), wait);

  effect(() => {
    setSignal(inputSignal())
  })

  return debouncedSignal;
}

const debounce = (callback: (...args: any[]) => void, wait: number) => {
  let timeoutId: number | undefined;
  return (...args: any[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}