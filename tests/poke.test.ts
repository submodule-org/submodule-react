import { describe, expect, test } from "bun:test"
import { createScope } from "@submodule/core"
import { pokeCache, searchPokemon } from "../src/poke"

describe("poke", () => {

  test("poke search should work", async () => {
    const scope = createScope()

    const result = await scope.safeRun(searchPokemon, async (search) => {
      return await search('pikachu')
    })

    const store = await scope.resolve(pokeCache)

    expect(result.type).toBe("ok")
    expect(store.cache.pikachu.name).toBe("pikachu")
  })

})
