import React from "react";
import { Link } from "react-router-dom";

import { Seo } from "../components/seo";
import pkg from "../../../package.json";

interface Props {
  versions: string[];
}

export const DocsVersions = (props: Props) => {
  return (
    <div className="container mx-auto">
      <Seo title="Docs Versions" />
      <h1 className="text-2xl font-bold mb-3">FZF Docs Versions</h1>
      <ul>
        <Link to="/" className="text-blue-700">
          {pkg.version} (latest)
        </Link>
        {props.versions
          .sort()
          .reverse()
          .map((v) => (
            <li key={v}>
              <Link to={`${v.replaceAll(".", "-")}`} className="text-blue-700">
                {v}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};
