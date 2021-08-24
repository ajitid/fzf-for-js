import React, { useEffect, useState } from "react";

import { Fzf, FzfResultItem, FzfOptions, extendedMatch } from "../../lib/main";
import { Seo } from "../components/seo";
import { HighlightChars } from "../components/highlight-chars";
import list from "../lists/data.json";
import dateFnDirList from "../lists/date-fns-repo-folders.json";

const options: FzfOptions = {
  // limiting size of the result to avoid jank while rendering it
  limit: 32,
  match: extendedMatch,
};

const wordList = list as string[];

let fzf = new Fzf(wordList, { ...options, casing: "case-insensitive" });

export function Basic() {
  const [input, setInput] = useState("");

  const [entries, setEntries] = useState<FzfResultItem[]>([]);

  const handleInputChange = (input: string) => {
    setInput(input);
    if (input === "") {
      setEntries([]);
      return;
    }

    let syncLen = fzf.find(input).length;
    fzf
      .asyncFind(input)
      .then((x) => x.length)
      .then((x) => console.log(syncLen, x === syncLen))
      .catch(() => {
        return;
      });
    // many linter configs. don't allow empty funtion so putting an explicit return
    // makes the problem go away.

    // console.time(input);
    // fzf
    //   .asyncFind(input)
    //   .then(setEntries)
    //   .catch(() => {});
    // console.timeEnd(input);
  };

  const [choice, setChoice] = useState("words");

  const selectChoice = (choice: string) => {
    switch (choice) {
      case "date-fns":
        fzf = new Fzf(dateFnDirList, options);
        setChoice("date-fns");
        break;
      case "words":
      default:
        fzf = new Fzf(wordList, { ...options, casing: "case-insensitive" });
        setChoice("words");
    }

    setInput("");
    setEntries([]);
  };

  useEffect(() => {
    document.body.classList.add("overflow-y-scroll");
    return () => document.body.classList.remove("overflow-y-scroll");
  });

  return (
    <div className="px-6">
      <Seo title="Basic example" />
      <div className="flex justify-end items-center">
        <input
          type="radio"
          id="words"
          name="list"
          value="words"
          checked={choice === "words"}
          onChange={() => selectChoice("words")}
          className="mr-1"
        />
        <label htmlFor="words" className="mr-3">
          English words
        </label>
        <input
          type="radio"
          id="date-fns"
          name="list"
          value="date-fns"
          checked={choice === "date-fns"}
          onChange={() => selectChoice("date-fns")}
          className="mr-1"
        />
        <label htmlFor="date-fns" className="mr-3">
          date-fns repo directories
        </label>
      </div>
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
            {entries.map((entry, index) => (
              <li key={index} className="py-1">
                <HighlightChars str={entry.item} indices={entry.positions} />
                <span className="text-sm pl-4 italic text-gray-400">
                  {entry.score}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600 py-1">
            {choice === "date-fns" ? dateFnDirList.length : wordList.length}{" "}
            items
            {/* can put last selected items here */}
          </div>
        )}
      </div>
    </div>
  );
}
