import type { Executor, Observable, Scope } from "@submodule/core";
import { scopeContext } from "./shared";
import { use, useCallback, useRef, useSyncExternalStore, startTransition, useEffect } from "react";

export function useScope(): Scope {
  const scope = use(scopeContext);

  if (!scope) {
    throw new Error("useScope must be used within a ScopeProvider");
  }

  return scope;
}

export function useResolve<T>(executor: Executor<T>): T {
  const scope = useScope();
  return use(scope.resolve(executor))
}

export function useObservable<P, API>(
  executor: Observable<P, API>,
): [P, API] {
  const resource = useResolve(executor);
  const returnRef = useRef<[P, API]>([resource.get(), resource.controller] as [P, API]);

  const subs = useCallback(
    (cb: () => void) => {
      startTransition(() => {
        returnRef.current = [resource.get(), resource.controller] as [P, API];
      })

      return resource.onValue((next) => {
        returnRef.current = [next, resource.controller] as [P, API];
        cb();
      });
    }, [resource],
  );

  return useSyncExternalStore(subs, () => returnRef.current);
}

export function useSlice<P, API, S>(
  executor: Observable<P, API>,
  selector: (state: P) => S,
  equalityFn: (a: S, b: S) => boolean = (a, b) => a === b
): [S, API] {
  const resource = useResolve(executor);
  const selectedStateRef = useRef<S>(selector(resource.get()));
  const returnRef = useRef<[S, API]>([selectedStateRef.current, resource.controller] as [S, API]);

  const subs = useCallback(
    (cb: () => void) => {
      startTransition(() => {
        const nextState = selector(resource.get());
        if (!equalityFn(selectedStateRef.current, nextState)) {
          selectedStateRef.current = nextState;
          returnRef.current = [nextState, resource.controller] as [S, API];
        }
      });

      return resource.onValue((next) => {
        const nextState = selector(next);
        if (!equalityFn(selectedStateRef.current, nextState)) {
          selectedStateRef.current = nextState;
          returnRef.current = [nextState, resource.controller] as [S, API];
          cb();
        }
      });
    }, [resource, selector, equalityFn],
  );

  return useSyncExternalStore(subs, () => returnRef.current);
}