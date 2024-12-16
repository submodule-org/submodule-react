import type { Observable, Slice } from "@submodule/core";
import { useResource } from "./core";
import type { ResultState } from "./core";

export function useController<P, API>(
	executor: Observable<P, API>,
): ResultState<API> {
	return useResource(
		executor,
		{ suspense: false as const },
		(resource) => resource.controller as API,
	);
}

export function useObservable<P, API>(
	executor: Observable<P, API>,
): ResultState<P> {
	return useResource(executor, { suspense: false as const }, (resource) =>
		resource.get(),
	);
}

export function useSlice<P, API, S>(
	executor: Observable<P, API>,
	slice: Slice<P, S>,
): ResultState<S> {
	return useResource(executor, { suspense: false as const }, (resource) =>
		slice.slice(resource.get()),
	);
}

export { ScopeProvider, useScope } from "./shared";
