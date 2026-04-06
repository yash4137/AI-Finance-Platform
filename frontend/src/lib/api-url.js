const normalizeApiUrl = (value) => {
  if (!value) {
    return "";
  }

  const trimmed = value.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

export {
  API_URL,
  normalizeApiUrl
};