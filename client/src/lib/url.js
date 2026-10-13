export function normalizeUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  // "host:port" has a digit after the colon, any other "scheme:" is not http(s)
  const hasOtherScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:(?!\d|\/\/)/.test(trimmed);
  if (hasOtherScheme) return null;

  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
