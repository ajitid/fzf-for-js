const isProd = process.env.NODE_ENV === "production";

export const invariant = (condition: boolean, message: string) => {
  if (!isProd && condition) throw new Error(message);
};
