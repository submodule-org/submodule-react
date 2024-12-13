export { TodosNonSuspense };
import React, { useState, Suspense, useCallback } from "react";
import { todoStream } from "./todo-app";
import { useResolve, useObservable, useSlice } from "../lib/non-suspense";

function AddTodo() {
	const [text, setText] = useState("");
	const resource = useResolve(todoStream);
	if (resource.state !== "ready") {
		return null;
	}

	const { controller } = resource.value;

	return (
		<>
			<div>
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				<button
					type="button"
					onClick={() => {
						setText("");
						controller.add({ text, completed: false });
					}}
				>
					Add
				</button>
			</div>
		</>
	);
}

function TodoList() {
	const stream = useObservable(todoStream);

	if (!stream) {
		return null;
	}

	const [todos, api] = stream;

	return (
		<>
			{todos.map((todo) => (
				<div key={todo.id}>
					<input
						type="checkbox"
						checked={todo.completed}
						onChange={() => api.toggle(todo.id)}
					/>
					<span>{todo.text}</span>
					<button type="button" onClick={() => api.remove(todo.id)}>
						Remove
					</button>
				</div>
			))}
		</>
	);
}

function TodosNonSuspense() {
	return (
		<>
			<div>Hello world</div>
			<AddTodo />
			<TodoList />
		</>
	);
}
