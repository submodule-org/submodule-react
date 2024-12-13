import { observable, provide } from "@submodule/core"

export type Todo = {
  id: number;
  text: string;
  completed: boolean;
}

let id = 0

const nextId = () => {
  return id++
}

type TodoAPI = {
  add: (todo: Omit<Todo, 'id'>) => void;
  remove: (id: number) => void;
  update: (id: number, todo: Omit<Todo, "id">) => void;
  toggle: (id: number) => void;
}

export const todoStream = provide(async () => observable<Todo[], TodoAPI>((set) => {
  return {
    initialValue: [],
    controller: {
      add: (todo) => set(current => [...current, { ...todo, id: nextId() }]),
      remove: (id) => set(current => current.filter((t) => t.id !== id)),
      update: (id, todo) => set(current => current.map((t) => (t.id === id ? { ...t, ...todo } : t))),
      toggle: (id) => set(current => current.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ))
    }
  }
}))
