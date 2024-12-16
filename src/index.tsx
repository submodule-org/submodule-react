import type { Observable, Slice } from "@submodule/core";
import { useResolve } from "./core";
import type { ResultState } from "./core";
import { useEffect, useState } from "react";

export function useController<P, API>(
	executor: Observable<P, API>,
): ResultState<API> {
	const resolved = useResolve(executor, { suspense: false });
	if (resolved.state === "loading") {
		return resolved;
	}

	if (resolved.state === "error") {
		throw resolved.error;
	}

	return {
		state: "success",
		data: resolved.data.controller as API,
	};
}

export function useObservable<P, API>(
	executor: Observable<P, API>,
): ResultState<P> {
	const resolved = useResolve(executor, { suspense: false });
	const [state, setState] = useState<ResultState<P>>(() => ({
		state: "loading",
	}));

	useEffect(() => {
		if (resolved.state === "success") {
			setState({ state: "success", data: resolved.data.get() });

			return resolved.data.onValue((next) => {
				setState({ state: "success", data: next });
			});
		}
	}, [resolved]);

	return state;
}

export function useSlice<P, API, S>(
	executor: Observable<P, API>,
	slice: Slice<P, S>,
): ResultState<S> {
	const resolved = useResolve(executor, { suspense: false });
	const [state, setState] = useState<ResultState<S>>(() => ({
		state: "loading",
	}));

	useEffect(() => {
		if (resolved.state === "success") {
			setState({ state: "success", data: slice.slice(resolved.data.get()) });

			return resolved.data.onSlice(slice, (next) => {
				setState({ state: "success", data: next });
			});
		}
	}, [resolved, slice]);

	return state;
}

export { ScopeProvider, useScope } from "./core";
