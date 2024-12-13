import React, { Suspense, useState, useSyncExternalStore } from "react";
import { Todos } from "./todo";

class ErrorBoundary extends React.Component<
	{ hasError: boolean; children: React.ReactNode; fallback: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: {
		hasError: boolean;
		children: React.ReactNode;
		fallback: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: unknown) {
		// Update state so the next render will show the fallback UI.
		return { hasError: true };
	}

	componentDidCatch(error: unknown, info) {
		// Example "componentStack":
		//   in ComponentThatThrows (created by App)
		//   in ErrorBoundary (created by App)
		//   in div (created by App)
		//   in App
		console.log(error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return this.props.fallback;
		}

		return this.props.children;
	}
}

export function Page() {
	return (
		<>
			<ErrorBoundary
				hasError={false}
				fallback={<div>Something went wrong</div>}
			>
				<Todos />
			</ErrorBoundary>
		</>
	);
}
