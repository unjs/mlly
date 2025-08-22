import {
  fileURLToPath as _fileURLToPath,
  pathToFileURL as _pathToFileURL,
} from "node:url";
import { promises as fsp } from "node:fs";
import { normalizeSlash, BUILTIN_MODULES } from "./_utils";

/**
 * Converts a file URL to a local file system path with normalized slashes.
 *
 * @param {string | URL} id - The file URL or local path to convert.
 * @returns {string} A normalized file system path.
 */
export function fileURLToPath(id: string | URL): string {
  if (typeof id === "string" && !id.startsWith("file://")) {
    return normalizeSlash(id);
  }
  return normalizeSlash(_fileURLToPath(id));
}

/**
 * Converts a local file system path to a file URL.
 *
 * @param {string | URL} id - The file system path to convert.
 * @returns {string} The resulting file URL as a string.
 */
export function pathToFileURL(id: string | URL): string {
  return _pathToFileURL(fileURLToPath(id)).toString();
}

// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_RE = /[\u0000-\u001F"#$&*+,/:;<=>?@[\]^`{|}\u007F]+/g;

/**
 * Sanitises a component of a URI by replacing invalid characters.
 *
 * @param {string} name - The URI component to sanitise.
 * @param {string} [replacement="_"] - The string to replace invalid characters with.
 * @returns {string} The sanitised URI component.
 */
export function sanitizeURIComponent(name = "", replacement = "_"): string {
  return name
    .replace(INVALID_CHAR_RE, replacement)
    .replace(/%../g, replacement);
}

/**
 * Cleans a file path string by sanitising each component of the path.
 *
 * @param {string} filePath - The file path to sanitise.
 * @returns {string} The sanitised file path.
 */
export function sanitizeFilePath(filePath = "") {
  return filePath
    .replace(/\?.*$/, "") // remove query string
    .split(/[/\\]/g)
    .map((p) => sanitizeURIComponent(p))
    .join("/")
    .replace(/^([A-Za-z])_\//, "$1:/");
}

/**
 * Normalises a module identifier to ensure it has a protocol if missing, handling built-in modules and file paths.
 *
 * @param {string} id - The identifier to normalise.
 * @returns {string} The normalised identifier with the appropriate protocol.
 */
export function normalizeid(id: string): string {
  if (typeof id !== "string") {
    // @ts-ignore
    id = id.toString();
  }
  if (/(?:node|data|http|https|file):/.test(id)) {
    return id;
  }
  if (BUILTIN_MODULES.has(id)) {
    return "node:" + id;
  }
  return "file://" + encodeURI(normalizeSlash(id));
}

/**
 * Loads the contents of a file from a URL into a string.
 *
 * @param {string} url - The URL of the file to load.
 * @returns {Promise<string>} A promise that resolves to the content of the file.
 */
export async function loadURL(url: string): Promise<string> {
  const code = await fsp.readFile(fileURLToPath(url), "utf8");
  return code;
}

/**
 * Converts a string of code into a data URL that can be used for dynamic imports.
 *
 * @param {string} code - The string of code to convert.
 * @returns {string} The data URL containing the encoded code.
 */
export function toDataURL(code: string): string {
  const base64 = Buffer.from(code).toString("base64");
  return `data:text/javascript;base64,${base64}`;
}

/**
 * Checks if a module identifier matches a Node.js built-in module.
 *
 * @param {string} id - The identifier to check.
 * @returns {boolean} `true` if the identifier is a built-in module, otherwise `false`.
 */
export function isNodeBuiltin(id = "") {
  // node:fs/promises => fs
  id = id.replace(/^node:/, "").split("/", 1)[0];
  return BUILTIN_MODULES.has(id);
}

// 2+ letters, to exclude Windows drive letters
// "{2,}?" to make in ungreedy and dont take "file://C" as protocol
const ProtocolRegex = /^(?<proto>.{2,}?):.+$/;

/**
 * Extracts the protocol portion of a given identifier string.
 *
 * @param {string} id - The identifier from which to extract the log.
 * @returns {string | undefined} The protocol part of the identifier, or undefined if no protocol is present.
 */
export function getProtocol(id: string): string | undefined {
  const proto = id.match(ProtocolRegex);
  return proto ? proto.groups?.proto : undefined;
}
