import React, { useEffect, useRef, useState } from "react";
import { Fzf, FzfResultItem } from "../lib/main";
import list from "../lists/words.json";

const type = (str: string) => {
  const WAIT_FOR = 170;

  return str.split("").reduce<TimelineItem[]>((prev, curr) => {
    const prevStr = prev[prev.length - 1]?.[0];
    if (typeof prevStr !== "string" && typeof prevStr !== "undefined") {
      return prev;
    }

    prev.push([(prevStr ?? "") + curr, WAIT_FOR]);
    return prev;
  }, []);
};

const backspace = (str: string) => {
  const WAIT_FOR = 70;
  const arr: TimelineItem[] = [];

  for (let i = str.length - 1; i >= 0; i--) {
    arr.push([str.substring(0, i), WAIT_FOR]);
  }

  return arr;
};

const timelineSymbols = {
  keepPrevious: Symbol("keep-prev"),
};
const keepPrevious = (waitFor: WaitFor): [Symbol, WaitFor] => [
  timelineSymbols.keepPrevious,
  waitFor,
];

type QueryString = string;
type WaitFor = number;
type TimelineItem = [QueryString, WaitFor] | [Symbol, WaitFor];

// const timeline: TimelineItem[] = [
//   ...type("abacus"),
//   keepPrevious(1200),
//   ...backspace("abacus"),
// ];

const ITEMS = 1200;
const timeline: TimelineItem[] = new Array(ITEMS)
  .fill(0)
  .map(() => Math.floor(Math.random() * list.length))
  .map((v) => {
    return [...type(list[v]), keepPrevious(1200), ...backspace(list[v])];
  })
  .flat();

const useTimeline = (
  timeline: TimelineItem[],
  callback: (str: string) => unknown
) => {
  const lastIdRef = useRef(0);

  useEffect(() => {
    const execute = (prevIdx: number = -1) => {
      const idx = (prevIdx + 1) % timeline.length;
      let [str, waitFor] = timeline[idx];

      lastIdRef.current = setTimeout(() => {
        if (typeof str === "string") {
          callback(str);
        } else if (typeof str === "symbol") {
          switch (str) {
            case timelineSymbols.keepPrevious:
              break;
          }
        }

        execute(idx);
      }, waitFor);
    };

    execute();

    return () => {
      clearTimeout(lastIdRef.current);
    };
  }, []);

  return {
    stop: () => {
      clearTimeout(lastIdRef.current);
    },
  };
};

const fzf = new Fzf(list, {
  maxResultItems: 32,
});

export const Dunno = () => {
  const [input, setInput] = useState("");

  const [entries, setEntries] = useState<FzfResultItem[]>([]);

  const searchFor = (query: string) => {
    setInput(query);
    if (query === "") {
      setEntries([]);
      return;
    }

    let entries = fzf.find(query);
    setEntries(entries);
  };

  const { stop } = useTimeline(timeline, searchFor);

  return (
    <div className="px-6">
      <div>
        <input
          autoFocus
          value={input}
          onChange={(e) => {
            stop();
            searchFor(e.target.value);
          }}
          className="py-2 px-3 w-full border-b-2 border-gray-400 outline-none focus:border-purple-500"
          placeholder="Type to search"
        />
      </div>
      <div className="pt-2">
        {input !== "" ? (
          <ul>
            {entries.map((entry, index) => (
              <li key={index} className="py-1">
                {entry.item}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-600 py-1">
            {list.length}
            items
            {/* can put last selected items here */}
          </div>
        )}
      </div>
    </div>
  );
};
