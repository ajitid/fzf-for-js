import { useEffect } from "react";

interface Props {
  title: string;
}

export const Seo = ({ title }: Props) => {
  useEffect(() => {
    document.title = title ? `${title} | FZF for JavaScript` : "FZF for JavaScript";

    return () => {
      document.title = "FZF for JavaScript";
    };
  }, [title]);

  return null;
};
