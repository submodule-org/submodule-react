import { provideObservable } from "@submodule/core";

export const [modalState, changeModalState] = provideObservable("view" as "view" | "edit")