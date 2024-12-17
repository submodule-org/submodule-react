import {
	createScope,
	type Executor,
	type Observable,
	type Scope,
	type Slice,
} from "@submodule/core";
import React, {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const scopeContext = createContext<Scope | undefined>(undefined);

/**
 * Provides a scope context for managing dependencies and their lifecycle.
 * All hooks must be used within this provider.
 *
 * @example
 * ```tsx
 * <ScopeProvider>
 *   <App />
 * </ScopeProvider>
 * ```
 */
export function ScopeProvider({
	children,
	scopes,
}: PropsWithChildren<{ scopes?: Scope[] }>) {
	const parentScope = useContext(scopeContext);
	const scope = useMemo(() => {
		return createScope(
			...[...(scopes ?? []), ...(parentScope ? [parentScope] : [])],
		);
	}, [parentScope, scopes]);

	useEffect(() => {
		return () => {
			scope.dispose();
			cache = cache.filter(([s]) => s !== scope);
		};
	}, [scope]);

	return (
		<scopeContext.Provider value={scope}> {children} </scopeContext.Provider>
	);
}

/**
 * Returns the current scope instance.
 * Must be used within a ScopeProvider.
 *
 * @throws {Error} If used outside of a ScopeProvider
 * @returns {Scope} The current scope instance
 */
export function useScope(): Scope {
	const scope = useContext(scopeContext);

	if (!scope) {
		throw new Error("useScope must be used within a ScopeProvider");
	}

	return scope;
}

type Cache = {
	promise: Promise<unknown>;
	result?: { data: unknown } | { error: unknown };
};

type CacheEntry = [Scope, Executor<unknown>, Cache];

let cache = [] as CacheEntry[];

function useResolve<T>(executor: Executor<T>): T {
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
						cacheEntry[2].result = { data: resolved };
						forceUpdate({});
					},
					(e) => {
						cacheEntry[2].result = { error: e };
						forceUpdate({});
					},
				),
			},
		];
		cache.push(cacheEntry);
		throw cacheEntry[2].promise;
	}

	if (!entry[2].result) {
		throw entry[2].promise;
	}

	if ("error" in entry[2].result) {
		throw entry[2].result.error;
	}

	return entry[2].result.data as T;
}

/**
 * Returns the controller API from an Observable.
 * Uses Suspense for loading states.
 *
 * @template P The payload type
 * @template API The controller API type
 * @param executor The Observable instance
 * @returns The controller API
 * @throws {Promise} During initial load (for Suspense)
 * @throws {Error} If used outside of a ScopeProvider
 */
export function useController<P, API>(executor: Observable<P, API>): API {
	const resolved = useResolve(executor);
	return resolved.controller as API;
}

/**
 * Subscribes to an Observable and returns its current value.
 * Uses Suspense for loading states.
 *
 * @template P The payload type
 * @template API The controller API type
 * @param executor The Observable instance
 * @returns The current value of the Observable
 * @throws {Promise} During initial load (for Suspense)
 * @throws {Error} If used outside of a ScopeProvider
 */
export function useObservable<P, API>(executor: Observable<P, API>): P {
	const resource = useResolve(executor);
	const [value, setValue] = useState(() => resource.get());

	useEffect(() => {
		return resource.onValue(setValue);
	}, [resource]);

	return value;
}

/**
 * Subscribes to a slice of an Observable's value.
 * Uses Suspense for loading states.
 *
 * @template P The payload type
 * @template API The controller API type
 * @template S The slice type
 * @param executor The Observable instance
 * @param slice The slice selector
 * @returns The current value of the selected slice
 * @throws {Promise} During initial load (for Suspense)
 * @throws {Error} If used outside of a ScopeProvider
 */
export function useSlice<P, API, S>(
	executor: Observable<P, API>,
	slice: Slice<P, S>,
): S {
	const resource = useResolve(executor);
	const [value, setValue] = useState(slice.slice(resource.get()));

	useEffect(() => {
		return resource.onSlice(slice, (next) => {
			setValue(next);
		});
	}, [resource, slice]);

	return value;
}

export type { Slice } from "@submodule/core";
