import { createScope, type Scope } from "@submodule/core";
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
