import { Injector, ValueEqualityFn, WritableSignal } from "@angular/core";

export type ResolverDef = {
  input: any;
  output: any;
  transformer: boolean;
  errorShape: any;
};

export type TrpcResourceOptions<TOutput> = {
  /**
   * Whether or not the request should be fetched reactively when the request updates.
   */
  autoRefresh?: boolean;

  /**
   * Optional computation that will be used in a `linkedSignal` definition of the `trpcResource` value.
   */
  valueComputation?: () => NoInfer<TOutput>;

  /**
   * Value that the `trpcResource` will take when in the Idle or Error states.
   *
   * If not set, the `trpcResource` will use `undefined` as its default value.
   */
  defaultValue?: NoInfer<TOutput> | undefined;

  /**
   * Value that the `trpcResource` will take when first initialized.
   *
   * If not set, the `trpcResource` will use `defaultValue` as its initial value.
   */
  initialValue?: NoInfer<TOutput> | undefined;

  /**
   * The `Injector` in which to create the `trpcResource`.
   *
   * If this is not provided, the current [injection context](https://angular.dev/guide/di/dependency-injection-context)
   * will be used instead (via `inject`).
   */
  injector?: Injector | undefined;

  /**
   * A comparison function which defines equality for the response value.
   */
  equal?: ValueEqualityFn<NoInfer<TOutput | undefined>> | undefined;
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type _TrpcResource<TDef extends ResolverDef> = {
  /**
   * Signal of the tRPC procedure output, when available.
   * This value will persist while the `trpcResource` is loading.
   */
  value: WritableSignal<TDef["output"] | undefined>;
  
  /**
   * Signal of the tRPC procedure error, when available.
   */
  error: WritableSignal<TDef['errorShape'] | undefined>;

  /**
   * Whether this `trpcResource` is loading a new value (or reloading the existing one).
   */
  isLoading: WritableSignal<boolean>;

  /**
   * Instructs the `trpcResource` to call the procedure with the current reactive dependencies.
   * @param abortSignal Optional abort signal to abort the procedure call.
   * @param keepLoadingThroughAbort Whether the `trpcResource` should maintain a loading state after an abort.
   * This is useful when another refresh is the cause of an abort so the resource appears to keep loading.
   * @returns void
   */
  refresh: (abortSignal?: AbortSignal, keepLoadingThroughAbort?: boolean) => Promise<void>;
}

/**
 * Represents the reactive result of an tRPC request.
 */
export type TrpcResource<TDef extends ResolverDef> = Expand<_TrpcResource<TDef>>;