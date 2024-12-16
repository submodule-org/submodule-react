import type { Observable, Slice } from "@submodule/core";
import { useResource } from "./core";

export function useController<P, API>(executor: Observable<P, API>): API {
  return useResource(
    executor,
    { suspense: true as const },
    (resource) => resource.controller as API
  );
}

export function useObservable<P, API>(executor: Observable<P, API>): P {
  return useResource(
    executor,
    { suspense: true as const },
    (resource) => resource.get(),
  );
}

export function useSlice<P, API, S>(
  executor: Observable<P, API>,
  slice: Slice<P, S>
): S {
  return useResource(
    executor,
    { suspense: true as const },
    (resource) => slice.slice(resource.get()),
  );
}

export { ScopeProvider, useScope } from "./shared";