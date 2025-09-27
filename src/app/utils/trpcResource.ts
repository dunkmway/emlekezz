import { computed, effect, inject, Injector, linkedSignal, signal } from "@angular/core";
import { isTRPCClientError, Resolver } from "@trpc/client";
import { ResolverDef, TrpcResource, TrpcResourceOptions } from "./trpcResource.types";

function trpcResource<TDef extends ResolverDef>(procedure: Resolver<TDef>, input: () => TDef['input'], options?: TrpcResourceOptions<TDef['output']>): TrpcResource<TDef> {
  const currentInput = computed(input);

  const value = linkedSignal<TDef['output'] | undefined>(options?.valueComputation ?? (() => options?.initialValue ?? options?.defaultValue), { equal: options?.equal });
  const error = signal<TDef['errorShape'] | undefined>(undefined);
  const isLoading = signal<boolean>(false);

  if (options?.autoRefresh) {
    effect((onCleanup) => {
      // pass abort signal to refresh on cleanup of effect
      const controller = new AbortController();
      onCleanup(() => controller.abort());

      // call refresh with this abort controller
      // refresh reads currentInput which triggers the effect
      refresh(controller.signal, true);
    }, { injector:  options?.injector || inject(Injector)});
  }

  const refresh = async (
    abortSignal?: AbortSignal,
    keepLoadingThroughAbort: boolean = true,
  ) => {
    // Reset signals for a fresh request.
    isLoading.set(true);
    error.set(undefined);

    try {
      value.set(await procedure(currentInput(), {
        signal: abortSignal
      }));
      error.set(undefined)
    } catch (err) {
      if (isTRPCClientError(err)) {
        // if the trpc request was aborted
        // we check if we would like to continue loading (the next request)
        // if so then we just leave this refresh in an undefined state
        // else we error as usual
        if (err.cause?.name === 'AbortError' && keepLoadingThroughAbort) {
          return;
        }
        error.set(err);
      } else {
        // Fallback for non-Error values
        console.error("A non-tRPC error has occured on this trpcResource: ", String(err));
      }
      value.set(options?.defaultValue);
    }
    isLoading.set(false);
  }

  return {
    value,
    error,
    isLoading,
    refresh
  };
}

function debugTrpcResource<TDef extends ResolverDef>(_trpcResource: TrpcResource<TDef>) {
  return {
    value: _trpcResource.value(),
    error: _trpcResource.error(),
    isLoading: _trpcResource.isLoading(),
  }
}

export { debugTrpcResource, trpcResource };