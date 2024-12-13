import React from "react";
import { ScopeProvider } from "../lib/shared";

import { TodosNonSuspense } from "./todo-non-suspense";
import { TodosSuspense } from "./todo-suspense";

export function Todos() {
	return (
		<>
			<ScopeProvider>
				<TodosNonSuspense />
				<TodosSuspense />
			</ScopeProvider>
		</>
	);
}
