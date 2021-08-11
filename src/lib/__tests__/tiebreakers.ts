import { Fzf, byLengthAsc, byStartAsc } from "../main";

test("byLengthAsc", () => {
  const list = ["aaaaa", "caaaaaaaa", "baaaaa"];

  const fzf = new Fzf(list, {
    tiebreakers: [byLengthAsc],
  });

  expect(fzf.find("aa").map((entry) => entry.item)).toMatchObject([
    "aaaaa",
    "baaaaa",
    "caaaaaaaa",
  ]);
});

test("byStartAsc", () => {
  const list = ["aaaa", "ccaaaa", "baaa"];

  const fzf = new Fzf(list, {
    tiebreakers: [byStartAsc],
  });

  expect(fzf.find("aa").map((entry) => entry.item)).toMatchObject([
    "aaaa",
    "baaa",
    "ccaaaa",
  ]);
});
