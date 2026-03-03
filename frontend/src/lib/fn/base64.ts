const base64WithPadding =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;

export const isBase64 = (str: string): boolean => {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }

  if (str === "") return true;

  const regex = base64WithPadding;

  return regex.test(str);
};

const MAX_BASE64_DECODE_SIZE = 100 * 1024; // 100KB

export const SECRET_METADATA_ENCODING_KEY = "encoding";
export const SECRET_METADATA_ENCODING_BASE64 = "base64";

export const hasBase64Encoding = (secretMetadata?: { key: string; value: string }[]): boolean =>
  secretMetadata?.some(
    (m) => m.key === SECRET_METADATA_ENCODING_KEY && m.value === SECRET_METADATA_ENCODING_BASE64
  ) ?? false;

type Base64DecodeResult =
  | { ok: true; value: string }
  | { ok: false; error: "invalid-base64" | "binary-content" | "too-large" };

export const safeBase64Decode = (encoded: string): Base64DecodeResult => {
  if (encoded.length > MAX_BASE64_DECODE_SIZE) {
    return { ok: false, error: "too-large" };
  }

  if (!isBase64(encoded)) {
    return { ok: false, error: "invalid-base64" };
  }

  try {
    const decoded = atob(encoded);

    const hasBinary = /[^\x20-\x7E\t\n\r]/.test(decoded);
    if (hasBinary) {
      return { ok: false, error: "binary-content" };
    }

    return { ok: true, value: decoded };
  } catch {
    return { ok: false, error: "invalid-base64" };
  }
};

export const base64Encode = (decoded: string): string => btoa(decoded);
