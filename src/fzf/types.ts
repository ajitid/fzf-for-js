export enum Case {
  Smart,
  Ignore,
  Respect,
}

export enum SortCriterion {
  ByScore,
  ByLength,
  ByBegin,
  ByEnd,
}

export interface Options {
  query: string;
  list: string[];
  fuzzy: boolean;
  case: Case;
  // TODO later
  sort: boolean;
  sortCriteria: SortCriterion;
  // TODO later
  ansi: false;
}

// interface ChunkList {
//     chunks []*Chunk
//       mutex  sync.Mutex
//         trans  ItemBuilder
// }
