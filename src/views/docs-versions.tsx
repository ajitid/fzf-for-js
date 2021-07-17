import React from "react";
import { Link } from "react-router-dom";

interface Props {
  versions: string[];
}

export const DocsVersions = (props: Props) => {
  return (
    <div>
      <h1>FZF Docs Versions</h1>
      <ul>
        {props.versions.map((v) => (
          <li key={v}>
            <Link to={`${v.replaceAll(".", "-")}`}>{v}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
