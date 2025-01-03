import {
	createScope,
	type Executor,
	type Scope,
	type ObservableGet,
	provideObservable,
	combineObservables,
	combine,
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

export function useObservable<P, V>(
	executor: Executor<ObservableGet<P>>,
	transform: (value: P) => V,
): V;

export function useObservable<P>(executor: Executor<ObservableGet<P>>): P;

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
export function useObservable<P, V>(
	executor: Executor<ObservableGet<P>>,
	transform?: (value: P) => V,
): P | V {
	const observable = useResolve(executor);

	const subs = useCallback(
		(cb: () => void) => {
			return observable.onValue((next) => {
				queueMicrotask(cb);
			});
		},
		[observable],
	);

	return useSyncExternalStore(
		subs,
		() => (transform ? transform(observable.value) : observable.value),
		() => (transform ? transform(observable.value) : observable.value),
	);
}

export function useCombines<Upstreams extends Record<string, unknown>, Value>(
	upstreams: {
		[K in keyof Upstreams]: Executor<ObservableGet<Upstreams[K]>>;
	},
	transform: (upstreams: Upstreams, prev: Value) => Value,
	intialValue: Value,
): Value;

export function useCombines<Upstreams extends Record<string, unknown>>(
	upstreams: {
		[K in keyof Upstreams]: Executor<ObservableGet<Upstreams[K]>>;
	},
): Upstreams;

export function useCombines<Upstreams extends Record<string, unknown>, Value>(
	upstreams: {
		[K in keyof Upstreams]: Executor<ObservableGet<Upstreams[K]>>;
	},
	transform?: (upstreams: Upstreams, prev: Value) => Value,
	initialValue?: Value,
): Value | Upstreams {
	const observable = useMemo(() => {
		return combineObservables(
			upstreams,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			transform as any,
			initialValue as Value,
		);
	}, [upstreams, transform, initialValue]);

	return useObservable(observable);
}
