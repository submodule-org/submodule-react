import { map, provide } from "@submodule/core"
import type { Pokemon } from "pokenode-ts"

export const pokeCache = provide(() => {
  const store = {
    list: {} as Record<string, string>,
    cache: {} as Record<string, Pokemon>,
  }

  return store
});

type PokeListResponse = {
  name: string;
  url: string;
};

const pokeDex = map(pokeCache, async (cache) => {
  function groupByName(list: PokeListResponse[]) {
    return list.reduce(
      (acc, { name, url }) => {
        acc[name] = url;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  if (Object.entries(cache.list).length === 0) {
    // retrieve list from pokedex api
    const list = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500")
      .then((res) => res.json())
      .then((data) => data.results);

    cache.list = groupByName(list as PokeListResponse[]);
    return groupByName(list as PokeListResponse[]);
  }

  return cache
});

export const searchPokemon = map({ pokeDex, pokeCache }, async ({ pokeCache, pokeDex }) => async (name: string): Promise<Pokemon | null> => {
  const cached = pokeCache.cache[name];
  if (cached) {
    return cached;
  }

  const url = pokeDex[name];
  if (!url) {
    return null;
  }

  const pokemon = await fetch(url).then(async (res) => await res.json() as Pokemon);
  pokeCache.cache[name] = pokemon;
  return pokemon;
})