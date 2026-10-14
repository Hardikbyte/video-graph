// Small constructors for curated board data.
// v = YouTube video (watch link or short), l = any other link, t = text note.

export const v = (url, title = "", notes = "") => ({ type: "video", url, title, notes });
export const l = (url, title = "", notes = "") => ({ type: "link", url, title, notes });
export const t = (title, text) => ({ type: "text", title, text });
