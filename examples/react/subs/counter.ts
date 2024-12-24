import { provideObservable, createPipe, map, combine, scoper } from "@submodule/core"
import { createObservable } from "@submodule/core/observables"

export const config = provideObservable({
  seed: 0,
  increment: 1,
  frequency: 1000
})

export const configController = map(
  config,
  (config) => ({
    setFrequency(frequency: number) {
      config.setValue(prev => ({ ...prev, frequency }))
    },
    setIncrement(increment: number) {
      config.setValue((prev) => ({ ...prev, increment }))
    },
    setSeed(seed: number) {
      config.setValue((prev) => ({ ...prev, seed }))
    }
  })
)

export const counter = map(
  combine({ scoper, config, configController }),
  ({ scoper, config }) => {

    let seed = config.value.seed
    let increment = config.value.increment
    let frequency = config.value.frequency

    const counterObservable = createObservable(config.value.seed)

    let currentTimeout: number

    function createTimeout(): number {
      return setTimeout(() => {
        seed += increment
        counterObservable.setValue(seed)

        currentTimeout = createTimeout()
      }, frequency)
    }

    currentTimeout = createTimeout()

    const cleanup = config.onValue(next => {
      if (next.seed !== seed) {
        seed = next.seed
      }

      if (next.increment !== increment) {
        increment = next.increment
      }

      if (next.frequency !== frequency) {
        frequency = next.frequency
        clearInterval(currentTimeout)
        currentTimeout = createTimeout()
      }
    })

    scoper.addDefer(() => {
      cleanup()
      clearInterval(currentTimeout)
    })

    return counterObservable
  })

export const onlyOddStream = createPipe(counter, (v, set) => {
  if (v % 2 !== 0) {
    set(v)
  }
}, Number.NaN)