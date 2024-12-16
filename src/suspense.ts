import type { Observable, Slice } from "@submodule/core";
import { useResolve } from "./core";
import { useEffect, useState } from "react";

export function useController<P, API>(executor: Observable<P, API>): API {
  const resolved = useResolve(executor, { suspense: true });
  return resolved.controller as API
}

export function useObservable<P, API>(
  executor: Observable<P, API>,
): P {
  const resource = useResolve(executor, { suspense: true });
  const [value, setValue] = useState(() => resource.get());

  useEffect(() => {
    return resource.onValue(setValue)
  }, [resource])

  return value
}

export function useSlice<P, API, S>(
  executor: Observable<P, API>,
  slice: Slice<P, S>,
): S {
  const resource = useResolve(executor, { suspense: true });
  const [value, setValue] = useState(slice.slice(resource.get()));

  useEffect(() => {
    return resource.onSlice(slice, (next) => {
      setValue(next)
    })
  }, [resource, slice])

  return value
}

export { ScopeProvider, useScope } from "./core";
export type { Slice } from "@submodule/core";