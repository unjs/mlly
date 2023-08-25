/* eslint-disable unicorn/prefer-module */
export const isCrtAvailable = () => {
  try {
    if (
      typeof require === "function" &&
      typeof module !== "undefined" &&
      require("aws-crt")
    ) {
      return ["md/crt-avail"];
    }
  } catch {}
};
