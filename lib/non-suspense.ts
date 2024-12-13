import type { Executor, inferProvide, Observable, Scope } from "@submodule/core";
import { useState, useRef, useEffect, useCallback, useSyncExternalStore, useContext, startTransition } from "react";

import { scopeContext } from "./shared";

export function useScope(): Scope {
  const scope = useContext(scopeContext);
  if (!scope) {
    throw new Error("useScope must be used within a ScopeProvider");
  }

  return scope;
}

export type ResolveState<P> =
  | { state: "not ready"; value: undefined }
  | { state: "ready"; value: P }
  | { state: "error"; error: unknown };

const defaultResourceState = {
  state: "not ready",
  value: undefined,
} satisfies ResolveState<unknown>;

function noOpsCb() { }

export function useResolve<
  P,
>(executor: Executor<P>): ResolveState<P> {
  const scope = useScope();
  const promiseRef = useRef<Promise<unknown> | undefined>(undefined);
  const [, setResolved] = useState<boolean>(false);

  const returnRef = useRef<ResolveState<P>>(defaultResourceState);

  useEffect(() => {
    promiseRef.current = scope
      .resolve(executor)
      .then((resolved) => {
        startTransition(() => {
          setResolved(true);
          returnRef.current = { state: "ready", value: resolved };
        })

      })
      .catch((e) => {
        startTransition(() => {
          setResolved(true);
          returnRef.current = { state: "error", error: e };
        })
      });

    return () => {
      setResolved(false);
      returnRef.current = defaultResourceState;
    };
  }, [scope, executor]);

  return returnRef.current;
}

export function useObservable<P, API>(
  executor: Observable<P, API>,
): [P, API] | undefined {
  const resource = useResolve(executor);
  const returnRef = useRef<[P, API] | undefined>(undefined);

  const subs = useCallback(
    (cb: () => void) => {
      if (resource.state === "ready") {
        startTransition(() => {
          returnRef.current = [resource.value.get(), resource.value.controller] as [P, API];
        })

        return resource.value.onValue((next) => {
          returnRef.current = [next, resource.value.controller] as [P, API];
          cb();
        });
      }

      return noOpsCb;
    },
    [resource],
  );

  return useSyncExternalStore(subs, () => returnRef.current);
}