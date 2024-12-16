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
	useState,
} from "react";

export const scopeContext = createContext<Scope | undefined>(undefined);

export function ScopeProvider({ children }: PropsWithChildren) {
	const [scope] = useState(() => createScope());

	return (
		<scopeContext.Provider value={scope}> {children} </scopeContext.Provider>
	);
}

export function useScope(): Scope {
	const scope = useContext(scopeContext);

	if (!scope) {
		throw new Error("useScope must be used within a ScopeProvider");
	}

	return scope;
}

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

export type ResolveOptions<B extends boolean> = {
	suspense: B;
};

type ResourceReturn<T, Suspense extends boolean> = Suspense extends true
	? T
	: ResultState<T>;

export function useResolve<T, Suspense extends boolean>(
	executor: Executor<T>,
	options: ResolveOptions<Suspense> = {
		suspense: false,
	} as ResolveOptions<Suspense>,
): ResourceReturn<T, Suspense> {
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
					},
				),
			},
		];
		cache.push(cacheEntry);

		if (options.suspense) {
			throw cacheEntry[2].promise;
		}
		return { state: "loading" } as ResourceReturn<T, Suspense>;
	}

	const result = entry[2].result ?? { state: "loading" };

	if (options.suspense) {
		if (result.state === "error") {
			throw result.error;
		}
		if (result.state === "success") {
			return result.data as ResourceReturn<T, Suspense>;
		}
		throw entry[2].promise;
	}

	return result as ResourceReturn<T, Suspense>;
}
