import React, { useState } from "react";

import { HighlightChars } from "../components/highlight-chars";
import { Fzf, FzfResultEntry } from "../../lib/main";

interface Stuff {
  id: string;
  displayName: string;
}

const list: Stuff[] = [
  { id: "1", displayName: "abc" },
  { id: "2", displayName: "bcd" },
  { id: "3", displayName: "cde" },
  { id: "4", displayName: "def" },
];

const fzf = new Fzf(list, {
  selector: (v) => v.displayName,
  maxResultItems: 32,
});

export function Custom() {
  const [input, setInput] = useState("");

  const [entries, setEntries] = useState<FzfResultEntry<Stuff>[]>([]);

  const handleInputChange = (input: string) => {
    setInput(input);
    if (input === "") {
      setEntries([]);
      return;
    }

    let entries = fzf.find(input);
    setEntries(entries);
  };

  return (
    <div className="px-6">
      <div>
        <input
          autoFocus
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className="py-2 px-3 w-full border-b-2 border-gray-400 outline-none focus:border-purple-500"
          placeholder="Type to search"
        />
      </div>
      <div className="pt-2">
        {input !== "" ? (
          <ul>
            {entries.map((entry) => (
              <li key={entry.item.id} className="py-1">
                <HighlightChars
                  str={entry.item.displayName}
                  highlightIndices={entry.positions ?? []}
                />
                <span className="text-sm pl-4 italic text-gray-400">
                  {entry.score}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600 py-1">
            List MRU + contextual when query or in frequency (frequent +
            recency) when input is empty
          </div>
        )}
      </div>
    </div>
  );
}
