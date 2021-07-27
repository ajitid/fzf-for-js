import { Fzf } from "../main";

test("filtering in extended match", () => {
  const list = ["package.json", "package-lock.json", "yarn.lock"];

  for (const algo of ["v2", "v1", null, undefined]) {
    const fzf = new Fzf(list, {
      extended: true,
      algo: algo as any,
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
  const fzf = new Fzf(list, { algo: null });
  const entries = fzf.find("aba");
  expect(entries.length).toBe(1);
  expect(entries[0].item).toBe("abacus");
  expect(new Set(entries[0].positions)).toMatchObject(new Set([0, 1, 2]));
});

test("maxResultItems", () => {
  const list = ["aabb", "AAbb", "ccaa"];

  let fzf = new Fzf(list, { maxResultItems: 1, casing: "case-insensitive" });
  const entries = fzf.find("aa");
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
