import { createScope, type Scope } from "@submodule/core";
import React, { createContext, type PropsWithChildren, useState } from "react";

export const scopeContext = createContext<Scope | undefined>(undefined);

export function ScopeProvider({ children }: PropsWithChildren) {
	const [scope] = useState(() => createScope());

	return (
		<scopeContext.Provider value={scope}> {children} </scopeContext.Provider>
	);
}
