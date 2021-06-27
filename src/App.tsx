import React, { useState } from "react";
import "./App.css";
import { fzf } from "./lib/main";
import list from "./files.json";

function App() {
  const [input, setInput] = useState("");

  const [result, setResult] = useState<ReturnType<typeof fzf>>([]);

  const handleInputChange = (input: string) => {
    setInput(input);
    let result = fzf(list, input);
    result = result.filter((v) => v.result.score !== 0);
    result.sort((a, b) => b.result.score - a.result.score);
    setResult(result);
  };

  return (
    <div>
      <div>
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>
      <div>
        <ul>
          {result.map((item) => (
            <li key={item.item}>
              {item.item} -- {item.result.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
