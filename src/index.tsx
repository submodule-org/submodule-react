import {
	createScope,
	type Executor,
	type Scope,
	type Observable,
	type PipeDispatcher,
	createPipe,
} from "@submodule/core";

import React, {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
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

/**
 * Core functionality of submodule. Resolves an executor within the current scope.
 *
 * @param executor
 * @returns
 */
export function useResolve<T>(executor: Executor<T>): T {
	const scope = useContext(scopeContext);

	if (!scope) {
		throw new Error("useScope must be used within a ScopeProvider");
	}

	for (const [s, e, c] of cache) {
		if (s === scope && e === executor && c.result) {
			if ("error" in c.result) {
				throw c.result.error;
			}

			return c.result.data as T;
		}
	}

	const cacheEntry: CacheEntry = [
		scope,
		executor,
		{
			promise: scope.resolve(executor).then(
				(resolved) => {
					cacheEntry[2].result = { data: resolved };
				},
				(e) => {
					cacheEntry[2].result = { error: e };
				},
			),
		},
	];

	cache.push(cacheEntry);
	throw cacheEntry[2].promise;
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
export function useObservable<P>(executor: Executor<Observable<P>>): P {
	const observable = useResolve(executor);

	const subs = useCallback(
		(cb: () => void) => {
			return observable.onValue(cb);
		},
		[observable],
	);

	return useSyncExternalStore(subs, () => {
		return observable.value;
	});
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
export function usePipe<Value, Upstream>(
	pupstream: Executor<Observable<Upstream>>,
	ppipe: PipeDispatcher<Value, Upstream>,
	initialValue: Value,
) {
	const upstream = useResolve(pupstream);

	const [value, setValue] = React.useState(initialValue);

	React.useEffect(() => {
		const unsub = upstream.onValue((upstreamValue) => {
			ppipe(upstreamValue, setValue);
		});

		return unsub;
	}, [upstream, ppipe]);

	return value;
}

export type { PipeDispatcher } from "@submodule/core";
