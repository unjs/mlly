import { fileURLToPath as _fileURLToPath } from "node:url";
import { promises as fsp } from "node:fs";
import { normalizeSlash, BUILTIN_MODULES } from "./_utils";

export function fileURLToPath(id: string): string {
  if (typeof id === "string" && !id.startsWith("file://")) {
    return normalizeSlash(id);
  }
  return normalizeSlash(_fileURLToPath(id));
}

// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_RE = /[\u0000-\u001F"#$&*+,/:;<=>?@[\]^`{|}\u007F]+/g;

export function sanitizeURIComponent(name = "", replacement = "_"): string {
  return name
    .replace(INVALID_CHAR_RE, replacement)
    .replace(/%../g, replacement);
}

export function sanitizeFilePath(filePath = "") {
  return filePath
    .replace(/\?.*$/, "") // remove query string
    .split(/[/\\]/g)
    .map((p) => sanitizeURIComponent(p))
    .join("/")
    .replace(/^([A-Za-z])_\//, "$1:/");
}

export function normalizeid(id: string): string {
  if (typeof id !== "string") {
    // @ts-ignore
    id = id.toString();
  }
  if (/(node|data|http|https|file):/.test(id)) {
    return id;
  }
  if (BUILTIN_MODULES.has(id)) {
    return "node:" + id;
  }
  return "file://" + encodeURI(normalizeSlash(id));
}

export async function loadURL(url: string): Promise<string> {
  const code = await fsp.readFile(fileURLToPath(url), "utf8");
  return code;
}

export function toDataURL(code: string): string {
  const base64 = Buffer.from(code).toString("base64");
  return `data:text/javascript;base64,${base64}`;
}

export function isNodeBuiltin(id = "") {
  // node:fs/promises => fs
  id = id.replace(/^node:/, "").split("/")[0];
  return BUILTIN_MODULES.has(id);
}

// 2+ letters, to exclude Windows drive letters
// "{2,}?" to make in ungreedy and dont take "file://C" as protocol
const ProtocolRegex = /^(?<proto>.{2,}?):.+$/;

export function getProtocol(id: string): string | undefined {
  const proto = id.match(ProtocolRegex);
  return proto ? proto.groups.proto : undefined;
}
