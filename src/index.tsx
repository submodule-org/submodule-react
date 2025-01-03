import {
	createScope,
	type Executor,
	type Scope,
	type ObservableGet,
	combineObservables,
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
 * @param executor - The executor to resolve within the current scope.
 * @returns The resolved value of the executor.
 * @throws {Promise} If the executor is not yet resolved, a promise is thrown to suspend the component.
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
 * Subscribes to an observable and returns its current value.
 * Optionally transforms the value using the provided transform function.
 *
 * @param executor - The executor to resolve the observable.
 * @param transform - Optional transform function to apply to the observable value.
 * @param params - Additional parameters to pass to the transform function.
 * @returns The current value of the observable, optionally transformed.
 */
export function useObservable<P, V, Params extends Array<unknown>>(
	executor: Executor<ObservableGet<P>>,
	transform: (value: P, ...params: Params) => V,
	...params: Params
): V;

export function useObservable<P>(executor: Executor<ObservableGet<P>>): P;

export function useObservable<P, V, Params extends Array<unknown>>(
	executor: Executor<ObservableGet<P>>,
	transform?: (nextvalue: P, ...params: Params) => V,
	...params: Params
): P | V {
	const observable = useResolve(executor);

	const subs = useCallback(
		(cb: () => void) => {
			return observable.onValue(() => {
				queueMicrotask(cb);
			});
		},
		[observable],
	);

	return useSyncExternalStore(
		subs,
		() =>
			transform ? transform(observable.value, ...params) : observable.value,
		() =>
			transform ? transform(observable.value, ...params) : observable.value,
	);
}

/**
 * An utility hook to wrap a transform function inside a useCallback. Supposed to use with useObservable.
 * @param transform Specifies the transform function to use
 * @param params Additional params can be added
 * @returns function that wrapped inside useCallback
 */
export function useTransformFn<P, V, Params extends Array<unknown>>(
	transform: (nextValue: P, ...params: Params) => V,
	...params: Params
): (value: P, ...params: Params) => V {
	return useCallback(
		(value: P, ...params: Params) => transform(value, ...params),
		[transform, ...params],
	);
}

/**
 * Combines multiple observables into a single value.
 * Optionally transforms the combined value using the provided transform function.
 *
 * @param upstreams - An object containing the executors for the observables to combine.
 * @param transform - Optional transform function to apply to the combined value.
 * @param initialValue - Optional initial value for the combined value.
 * @returns The combined value of the observables, optionally transformed.
 */
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
