import type { Executor, Scope } from "@submodule/core";
import { useContext, useState } from "react";
import { scopeContext } from "./shared";

type LoadingState = { state: "loading" };
type ErrorState = { state: "error"; error: unknown };
type SuccessState<T> = { state: "success"; data: T };
export type ResultState<T> = LoadingState | ErrorState | SuccessState<T>;

type Cache = {
  promise: Promise<unknown>;
  result?: ResultState<unknown>;
};

type CacheEntry = [Scope, Executor<unknown>, Cache];

const cache = [] as CacheEntry[];

export type ResolveOptions = {
  suspense: boolean;
};

// Helper types for discriminating return types
type ResourceReturn<T, Suspense extends boolean> = Suspense extends true ? T : ResultState<T>;

export function useResolve<T>(
  executor: Executor<T>,
  options: ResolveOptions = {
    suspense: false
  }
): ResultState<T> | T {
  const scope = useContext(scopeContext);
  const [, forceUpdate] = useState({});

  if (!scope) {
    throw new Error("useScope must be used within a ScopeProvider");
  }

  const entry = cache.find(([s, e]) => s === scope && e === executor);

  if (!entry) {
    const cacheEntry: CacheEntry = [
      scope,
      executor,
      {
        promise: scope.resolve(executor).then(
          (resolved) => {
            cacheEntry[2].result = { state: "success", data: resolved };
            forceUpdate({});
          },
          (e) => {
            cacheEntry[2].result = { state: "error", error: e };
            forceUpdate({});
          }
        ),
      },
    ];
    cache.push(cacheEntry);

    if (options.suspense) {
      throw cacheEntry[2].promise;
    }
    return { state: "loading" };
  }

  const result = entry[2].result ?? { state: "loading" };

  if (options.suspense) {
    if (result.state === 'error') {
      throw result.error;
    }
    if (result.state === 'success') {
      return result.data as T;
    }
    throw entry[2].promise;
  }

  return result as ResultState<T>;
}

// Base implementation that other hooks will use
export function useResource<T, R, Suspense extends boolean>(
  executor: Executor<T>,
  options: { suspense: Suspense },
  transform: (data: T) => R
): ResourceReturn<R, Suspense> {
  const result = useResolve(executor, options);

  if (!options.suspense) {
    const typedResult = result as ResultState<T>;
    if (typedResult.state !== 'success') return typedResult as ResultState<R> as ResourceReturn<R, Suspense>;
    const transformed = transform(typedResult.data);
    return { state: 'success', data: transformed } as ResourceReturn<R, Suspense>;
  }

  const typedResult = result as T;
  return transform(typedResult) as ResourceReturn<R, Suspense>;
}
