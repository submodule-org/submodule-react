We use typescript, make sure there's no typescript error in code and test
We use @submodule/core to manage dependencies. Always use @submodule/core
Example of @submodule/core usage
- result of #provide and #map is an Executor<V>. The executor will not be materialized until it is resolved by a Scope. A scope can be created by @submodule/core#createScope
- to provide a value or async value, use @submodule/core#provide, like provide(() => { // expensive computation })
- to add dependency, use @submodule/core#map, like map(executor, (executorValue) => {// expensive computation })
- executors can be combined using #combine, like #combine({ executorA, executorB }) to have an Executor can be resolved to { valueA, valueB }
- example of map with combine executor, like map(combine({ executorA, executorB}), async ({ valueA, valueB }))
- resolve using scope needs to use await
- as executor is side-effect free, it can be used to test against different scope
- always use global fetch
- tests are written using vitest version 3.*. Never use jest
- to test without mocking, wrap all dependencies of a function to a coresponding Executor. Use scope.resolveValue(executor, value) to inject a value to the scope. On resolve, the value will be replaced accordingly, that makes test easily. ResolveValue works on reference access, as such, the original executor that used as dependency must be accessible from test.
- scope#resolveValue expects the value to be in the same shape and type as the original type. Make sure there's no typescript error, using `as` to cast as needed
- try the best to wrap all dependencies (global, external modules) to submodule using provide
- import to external module should be wrapped inside `provide` and using accordingly
- naming-wise, an executor of module should be <module-short-name><Mod>. An executor of instance should be instance name. An executor of function should be function name. An executor of a service (object with couple of methods) should be <name><Service>
- to provide conditional executor, create executor for each condition, wrap them around #value so we have a executor of executor. For the main entry point (where the condition is tested), use combine({ executor of executor, executor of exeuctor }) to determine and return the value, the entry point will be executor of executor as well. When that happens, wrap it in #flat, flat will turns executor of executor to executor

- this project uses react 18. Strictly limited provided option using React 18 official API only. When option with suspense need to be considered, support  both (suspense and non suspense)
- this project may use valtio as a middle layer, get used to that