export const isCrtAvailable = () => {
  try {
    if (
      typeof require === "function" &&
      typeof module !== "undefined" &&
      require("aws-crt") // eslint-disable-line @typescript-eslint/no-require-imports
    ) {
      return ["md/crt-avail"];
    }
  } catch {
    // Ignore error
  }
};
