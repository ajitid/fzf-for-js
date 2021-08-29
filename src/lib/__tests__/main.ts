import "jest-expect-message";

import { Fzf, AsyncFzf } from "../main";
import { basicMatch, extendedMatch, asyncExtendedMatch } from "../main";
import { BaseOptions } from "../types";

test("filtering in extended match", () => {
  const list = ["package.json", "package-lock.json", "yarn.lock"];

  const algos: BaseOptions<string>["fuzzy"][] = ["v1", "v2", false];

  for (const algo of [...algos, undefined]) {
    const fzf = new Fzf(list, {
      match: extendedMatch,
      fuzzy: algo,
    });
    let entries = fzf.find("!lock");
    expect(entries.length).toBe(1);
    expect(entries[0].item).toBe("package.json");

    entries = fzf.find("lock$");
    expect(entries.length).toBe(1);
    expect(entries[0].item).toBe("yarn.lock");
  }
});

test("case sensitivity in basic match", () => {
  const list = ["aabb", "AAbb"];

  {
    const fzf = new Fzf(list, { casing: "smart-case" });

    let entries = fzf.find("aabb");
    expect(entries.length).toBe(2);

    entries = fzf.find("AAbb");
    expect(entries.length).toBe(1);
    expect(entries[0].item).toBe("AAbb");
  }

  {
    const fzf = new Fzf(list, { casing: "case-insensitive" });
    const entries = fzf.find("aabb");
    expect(entries.length).toBe(2);
  }

  {
    const fzf = new Fzf(list, { casing: "case-sensitive" });
    const entries = fzf.find("AA");
    expect(entries.length).toBe(1);
    expect(entries[0].item).toBe("AAbb");
  }
});

test("basic match + exact", () => {
  const list = ["cadabra", "abacus"];
  const fzf = new Fzf(list, { fuzzy: false });
  const entries = fzf.find("aba");
  expect(entries.length).toBe(1);
  expect(entries[0].item).toBe("abacus");
  expect(entries[0].positions).toMatchObject(new Set([0, 1, 2]));
});

test("limit", () => {
  const list = ["aabb", "AAbb", "ccaa"];

  let fzf = new Fzf(list, { limit: 1, casing: "case-insensitive" });
  let entries = fzf.find("aa");
  expect(entries.length).toBe(1);

  fzf = new Fzf(list, {
    limit: 1,
    casing: "case-insensitive",
    match: extendedMatch,
  });
  entries = fzf.find("aa");
  expect(entries.length).toBe(1);
});

test("normalization", () => {
  const list = ["jalapeño", "à la carte", "café", "papier-mâché", "à la mode"];

  let fzf = new Fzf(list, { normalize: false });
  let entries = fzf.find("papae");
  expect(entries.length).toBe(0);
  entries = fzf.find("papâé");
  expect(entries.length).toBe(1);
  expect(entries[0].item).toBe("papier-mâché");

  fzf = new Fzf(list, { normalize: true });
  entries = fzf.find("papae");
  expect(entries.length).toBe(1);
  expect(entries[0].item).toBe("papier-mâché");
  entries = fzf.find("papâé");
  expect(entries.length).toBe(1);
  expect(entries[0].item).toBe("papier-mâché");
});

test("forward", () => {
  const list = ["/breeds/pyrenees"];

  let fzf = new Fzf(list, { forward: true });
  let positions = fzf.find("re")[0].positions;
  expect(positions).toMatchObject(new Set([2, 3]));

  fzf = new Fzf(list, { forward: true, match: extendedMatch });
  positions = fzf.find("re")[0].positions;
  expect(positions).toMatchObject(new Set([2, 3]));

  fzf = new Fzf(list, { forward: false });
  positions = fzf.find("re")[0].positions;
  expect(positions).toMatchObject(new Set([10, 11]));

  fzf = new Fzf(list, { forward: false, match: extendedMatch });
  positions = fzf.find("re")[0].positions;
  expect(positions).toMatchObject(new Set([10, 11]));
});

test("sort", () => {
  const list = [
    "go",
    "javascript",
    "python",
    "rust",
    "swift",
    "kotlin",
    "elixir",
    "java",
    "lisp",
    "v",
    "zig",
    "nim",
    "rescript",
    "d",
    "haskell",
  ];

  for (const match of [basicMatch, extendedMatch]) {
    for (const sort of [true, false]) {
      const fzf = new Fzf(list, { match, sort });
      const expected = sort ? "lisp, kotlin, elixir" : "kotlin, elixir, lisp";
      expect(
        fzf
          .find("li")
          .map((v) => v.item)
          .join(", "),
        `failed on\n\tmatch type=${
          match === basicMatch ? "basic" : "extended"
        }\n\tsort=${sort}`
      ).toBe(expected);
    }
  }
});

test("large result set", () => {
  const list = new Array(510000).fill("hello");
  const fzf = new Fzf(list);
  expect(fzf.find("he").length).toBe(list.length);
});

test("previous search is cancelled when a new one created", () => {
  const list = new Array(10000).fill("hellooooooooooooooooooooooooooooo");
  const fzf = new AsyncFzf(list);

  const p = fzf.find("oo");
  fzf.find("ooooooo");

  return expect(p).rejects.toMatch("search cancelled");
});

test("async search gives correct result", () => {
  const FILL_LENGTH = 10000;
  const list = new Array(FILL_LENGTH).fill("hellooooooooooooooooooooooooooooo");
  list.push("heya");
  const QUERY = "oo he";

  expect(new Fzf(list, { match: extendedMatch }).find(QUERY)).toHaveLength(
    FILL_LENGTH
  );

  const fzf = new AsyncFzf(list, { match: asyncExtendedMatch });
  fzf.find("zz").catch(() => {});
  const p = fzf.find(QUERY);
  return expect(p).resolves.toHaveLength(FILL_LENGTH);
});
