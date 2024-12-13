export { TodosSuspense };
import React, { useState, Suspense } from "react";
import { todoStream } from "./todo-app";
import { useResolve, useObservable } from "../lib/suspense";

function AddTodo() {
	const { controller } = useResolve(todoStream);
	const [text, setText] = useState("");

	return (
		<>
			<div>
				<input
					type="text"
					onChange={(e) => setText(e.target.value)}
					value={text}
				/>
				<button
					type="button"
					onClick={() => {
						console.log("adding todo");
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
	const [todos, api] = useObservable(todoStream);

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

function TodosSuspense() {
	return (
		<>
			<div>Suspense</div>
			<Suspense fallback={<div>Loading api...</div>}>
				<AddTodo />
			</Suspense>
			<Suspense fallback={<div>Loading todos...</div>}>
				<TodoList />
			</Suspense>
		</>
	);
}
