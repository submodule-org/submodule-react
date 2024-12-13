import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Page } from "./page";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Page />
	</StrictMode>,
);
