import { observable, map, flatMap, pipe } from "@submodule/core"

type CounterConfig = {
  seed: number
  increment: number
  frequency: number
}

type ChangeConfig = {
  setSeed: (seed: number) => void
  setIncrement: (increment: number) => void
  setFrequency: (frequency: number) => void
}

export const config = observable<CounterConfig, ChangeConfig>(set => ({
  initialValue: {
    seed: 0,
    increment: 1,
    frequency: 1000
  },
  controller: {
    setFrequency(frequency) {
      set(prev => ({ ...prev, frequency }))
    },
    setIncrement(increment) {
      set(prev => ({ ...prev, increment }))
    },
    setSeed(seed) {
      set(prev => ({ ...prev, seed }))
    }
  }
}))

export const counter = flatMap(config, config => {
  return observable<number>(set => {
    const currentConfig = config.get()

    let seed = currentConfig.seed
    let increment = currentConfig.increment
    let frequency = currentConfig.frequency

    let timer = setTimeout(function tick() {
      seed += increment
      set(() => seed)

      timer = setTimeout(tick, frequency)
    }, frequency)

    config.pipe<number>(
      (v, set) => set(v.seed),
      next => {
        seed = next
      }
    )

    config.pipe<number>((v, set) => set(v.seed), newSeed => { seed = newSeed })
    config.pipe<number>((v, set) => set(v.increment), newIncrement => { increment = newIncrement })
    config.pipe<number>((v, set) => set(v.frequency), newFrequency => {
      clearTimeout(timer)

      frequency = newFrequency
      timer = setTimeout(function tick() {
        seed += increment
        set(() => seed)

        timer = setTimeout(tick, frequency)
      }, frequency)
    })

    return {
      initialValue: seed,
      cleanup: () => {
        clearTimeout(timer)
      }
    }
  })

})