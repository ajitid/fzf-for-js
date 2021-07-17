import React, { useEffect, useState } from "react";

import { Fzf, FzfResultItem } from "../lib/main";
import { HighlightChars } from "../components/highlight-chars";
import wordList from "../lists/words.json";
import dateFnDirList from "../lists/date-fns-repo-folders.json";
import dogsObj from "../lists/dogs.json";

// taken from https://dog.ceo/dog-api/documentation/ (List all breeds)
const dogsList: string[] = [];
for (const breed of Object.entries(dogsObj)) {
  const breedStr = breed[0][0].toUpperCase() + breed[0].substring(1);
  if (breed[1].length === 0) dogsList.push(breedStr);
  else {
    for (const subBreed of breed[1]) {
      const subBreedStr = subBreed[0].toUpperCase() + subBreed.substring(1);
      dogsList.push(`${subBreedStr} ${breedStr}`);
    }
  }
}

const options = {
  // limiting size of the result to avoid jank while rendering it
  maxResultItems: 32,
};

let fzf = new Fzf(wordList, options);

export function Basic() {
  const [listLen, setListLen] = useState(wordList.length);
  const [choice, setChoice] = useState("words");
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<FzfResultItem[]>([]);

  const [dogImage, setDogImage] = useState("");
  const [lastDogBreed, setLastDogBreed] = useState("");

  // resetting for fast refresh
  useEffect(() => {
    fzf = new Fzf(wordList, options);
    setChoice("words");
    setListLen(wordList.length);
  }, []);

  useEffect(() => {
    handleInputChange(input);
  }, [input]);

  const handleInputChange = (input: string) => {
    setInput(input);
    if (input === "") {
      setEntries([]);
      setLastDogBreed("");
      setDogImage("");
      return;
    }

    let entries = fzf.find(input);
    setEntries(entries);

    if (
      entries.length > 0 &&
      choice === "dog-breeds" &&
      entries[0].item !== lastDogBreed
    ) {
      const breed = entries[0].item;
      setLastDogBreed(breed);
      const pathPart = breed.toLowerCase().split(" ").reverse().join("/");
      fetch(`https://dog.ceo/api/breed/${pathPart}/images/random`)
        .then((res) => res.json())
        .then((res) => setDogImage(res.message));
    } else {
      if (entries.length === 0 || choice !== "dog-breeds") {
        setLastDogBreed("");
        setDogImage("");
      }
    }
  };

  const selectChoice = (choice: string) => {
    switch (choice) {
      case "date-fns":
        fzf = new Fzf(dateFnDirList, options);
        setChoice("date-fns");
        setListLen(dateFnDirList.length);
        break;
      case "dog-breeds":
        fzf = new Fzf(dogsList, options);
        setChoice("dog-breeds");
        setListLen(dogsList.length);
        break;
      case "words":
      default:
        fzf = new Fzf(wordList, options);
        setChoice("words");
        setListLen(wordList.length);
    }

    setInput("");
    setEntries([]);
  };

  useEffect(() => {
    document.body.classList.add("overflow-y-scroll");
    return () => document.body.classList.remove("overflow-y-scroll");
  });

  const choiceOnChangeHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    selectChoice(evt.target.value);
  };

  return (
    <div className="px-6">
      <div className="flex justify-end items-center">
        <input
          type="radio"
          id="words"
          name="list"
          value="words"
          checked={choice === "words"}
          onChange={choiceOnChangeHandler}
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
          onChange={choiceOnChangeHandler}
          className="mr-1"
        />
        <label htmlFor="date-fns" className="mr-3">
          date-fns repo directories
        </label>
        <input
          type="radio"
          id="dog-breeds"
          name="list"
          value="dog-breeds"
          checked={choice === "dog-breeds"}
          onChange={choiceOnChangeHandler}
          className="mr-1"
        />
        <label htmlFor="dog-breeds" className="mr-3">
          Dog breeds
        </label>
      </div>
      <div>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="py-2 px-3 w-full border-b-2 border-gray-400 outline-none focus:border-purple-500"
          placeholder="Type to search"
        />
      </div>
      <div className="pt-2">
        {input !== "" ? (
          <div className="flex">
            <ul className="w-full">
              {entries.map((entry, index) => (
                <li key={index} className="py-1">
                  <HighlightChars
                    str={entry.item}
                    highlightIndices={entry.positions ?? []}
                  />
                  <span className="text-sm pl-4 italic text-gray-400">
                    {entry.result.score}
                  </span>
                </li>
              ))}
            </ul>
            {choice === "dog-breeds" && (
              <div className="flex justify-end items-start">
                <img
                  className="object-contain"
                  src={dogImage}
                  alt={lastDogBreed}
                  style={{ width: "440px" }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 py-1">
            {listLen} items
            {/* can put recently selected items here */}
          </div>
        )}
      </div>
    </div>
  );
}
