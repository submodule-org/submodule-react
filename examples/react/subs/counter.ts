import { provide, observable, map } from "@submodule/core"

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

export const config = provide(() => observable<CounterConfig, ChangeConfig>(set => ({
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
})))

export const counter = map(config, config => {
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

    config.onSlice({ slice: p => p.seed }, newSeed => { seed = newSeed })
    config.onSlice({ slice: p => p.increment }, newIncrement => { increment = newIncrement })
    config.onSlice({ slice: p => p.frequency }, newFrequency => {
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