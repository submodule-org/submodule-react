import { Suspense } from "react";
import {
	ScopeProvider,
	useObservable,
	usePipe,
	useResolve,
	type PipeDispatcher,
} from "@submodule/react";
import {
	counter,
	readConfig,
	onlyOddStream,
	configController,
} from "../subs/counter";

import { changeModalState, modalState } from "../subs/modals";

export default function App() {
	return (
		<>
			<ScopeProvider>
				<Suspense>
					<Counter />
				</Suspense>
				<Suspense>
					<OffTree />
					<Config />
				</Suspense>
			</ScopeProvider>
		</>
	);
}

const Config = () => {
	return (
		<>
			<Seed />
			<ChangeConfig />
			<CurrentConfig />
		</>
	);
};

const Seed = () => {
	const seed = usePipe(readConfig, (value, set) => set(value.seed), 0);

	return <h1>Seed: {seed}</h1>;
};

const CurrentConfig = () => {
	const config = useObservable(readConfig);
	const changeModal = useResolve(changeModalState);
	const viewState = useObservable(modalState);

	if (viewState === "edit") {
		return null;
	}

	return (
		<div>
			<div>Seed: {config.seed}</div>
			<div>Increment: {config.increment}</div>
			<div>Frequency: {config.frequency}</div>
			<div>
				<button type="button" onClick={() => changeModal((_) => "edit")}>
					Change
				</button>
			</div>
		</div>
	);
};

const ChangeConfig = () => {
	const controller = useResolve(configController);
	const config = useObservable(readConfig);
	const changeModal = useResolve(changeModalState);
	const viewState = useObservable(modalState);

	if (viewState === "view") {
		return null;
	}

	return (
		<div>
			<label htmlFor="seedInput">Seed</label>
			<input
				id="seedInput"
				type="number"
				value={config.seed}
				onChange={(e) => controller.setSeed(Number.parseInt(e.target.value))}
			/>
			<label htmlFor="incrementInput">Increment</label>
			<input
				id="incrementInput"
				type="number"
				value={config.increment}
				onChange={(e) =>
					controller.setIncrement(Number.parseInt(e.target.value))
				}
			/>
			<label htmlFor="frequencyInput">Frequency</label>
			<input
				id="frequencyInput"
				type="number"
				value={config.frequency}
				onChange={(e) =>
					controller.setFrequency(Number.parseInt(e.target.value))
				}
			/>
			<div>
				<button
					type="button"
					onClick={() =>
						changeModal((c) => {
							console.log(c);
							return "view";
						})
					}
				>
					Close
				</button>
			</div>
		</div>
	);
};

const includeEven: PipeDispatcher<number, number> = (value, set) => {
	if (value % 2 === 0) {
		set(value);
	}
};

function OffTree() {
	const onlyEven = usePipe(counter, includeEven, Number.NaN);

	if (Number.isNaN(onlyEven)) {
		return null;
	}

	return <div>only even: {onlyEven}</div>;
}

function Counter() {
	const controller = useResolve(configController);
	const counterValue = useObservable(readConfig);
	const counterApp = useObservable(counter);

	const onlyOdd = useObservable(onlyOddStream);

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
			</div>
		</>
	);
}
