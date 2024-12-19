import React, { Suspense, useCallback, useState } from "react";
import {
	ScopeProvider,
	useController,
	useObservable,
	useObservableN,
	usePipe,
	type PipeDispatcher,
} from "@submodule/react";
import { counter, config, onlyOddStream } from "../subs/counter";

export default function App() {
	return (
		<>
			<ScopeProvider>
				<Suspense>
					<Counter />
				</Suspense>
			</ScopeProvider>
		</>
	);
}

const includeEven: PipeDispatcher<number, number> = (value, set) => {
	if (value % 2 === 0) {
		set(value);
	}
};

function Counter() {
	const counterValue = useObservable(config);
	const controller = useController(config);
	const counterApp = useObservable(counter);

	const onlyOdd = useObservableN(onlyOddStream, 1);
	const onlyEven = usePipe(counter, includeEven, 0);

	return (
		<>
			<div>
				<h2>Controller board</h2>
				<div>
					<label htmlFor="seedInput">Seed</label>
					<input
						id="seedInput"
						type="number"
						value={counterValue.seed}
						onChange={(e) =>
							controller.setSeed(Number.parseInt(e.target.value))
						}
					/>
				</div>

				<div>
					<label htmlFor="incrementInput">Increment</label>
					<input
						id="incrementInput"
						type="number"
						value={counterValue.increment}
						onChange={(e) =>
							controller.setIncrement(Number.parseInt(e.target.value))
						}
					/>
				</div>

				<div>
					<label htmlFor="frequencyInput">Frequency</label>
					<input
						id="frequencyInput"
						type="number"
						value={counterValue.frequency}
						onChange={(e) =>
							controller.setFrequency(Number.parseInt(e.target.value))
						}
					/>
				</div>
			</div>
			<div>
				<h2>Counter</h2>
				<div>{counterApp}</div>
				<div>only odd: {onlyOdd}</div>
				<div>only even: {onlyEven}</div>
			</div>
		</>
	);
}
