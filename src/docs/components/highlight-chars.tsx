import React from "react";

interface HighlightCharsProps {
  str: string;
  highlightIndices: Set<number>;
}

export const HighlightChars = (props: HighlightCharsProps) => {
  const strArr = props.str.split("");
  const nodes = strArr.map((v, i) => {
    if (props.highlightIndices.has(i)) {
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
