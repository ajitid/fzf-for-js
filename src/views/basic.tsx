import React, { useEffect, useState } from "react";

import { Fzf, FzfResultItem } from "../lib/main";
import wordList from "../lists/words.json";
import dateFnDirList from "../lists/date-fns-repo-folders.json";

let fzf = new Fzf(wordList);

export function Basic() {
  const [input, setInput] = useState("");

  const [result, setResult] = useState<FzfResultItem[]>([]);

  const handleInputChange = (input: string) => {
    setInput(input);
    if (input === "") {
      setResult([]);
      return;
    }

    let result = fzf.find(input);
    // limiting size of the result to avoid jank while rendering it
    result = result.slice(0, 32);
    setResult(result);
  };

  const [choice, setChoice] = useState("words");

  const selectChoice = (choice: string) => {
    switch (choice) {
      case "date-fns":
        fzf = new Fzf(dateFnDirList);
        setChoice("date-fns");
        break;
      case "words":
      default:
        fzf = new Fzf(wordList);
        setChoice("words");
    }

    setInput("");
    setResult([]);
  };

  useEffect(() => {
    document.body.classList.add("overflow-y-scroll");
    return () => document.body.classList.remove("overflow-y-scroll");
  });

  return (
    <div className="min-h-screen antialiased break-words px-6 py-4">
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
            {result.map((item, index) => (
              <li key={index} className="py-1">
                <HighlightChars
                  str={item.str}
                  highlightIndices={item.pos ?? []}
                />
                <span className="text-sm pl-4 italic text-gray-400">
                  {item.result.score}
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

interface HighlightCharsProps {
  str: string;
  highlightIndices: number[];
}

const HighlightChars = (props: HighlightCharsProps) => {
  const strArr = props.str.split("");
  const nodes = strArr.map((v, i) => {
    if (props.highlightIndices.includes(i)) {
      return (
        <span key={i} className="font-semibold">
          {v}
        </span>
      );
    } else {
      return v;
    }
  });

  return <>{nodes}</>;
};
