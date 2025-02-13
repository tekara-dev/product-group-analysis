var getCached = (key, def) => {
  const res = sessionStorage.getItem(key);
  try {
    return JSON.parse(res);
  } catch {
    return def;
  }
};
var setCached = (key, data) => {
  const toSet = JSON.stringify(data);
  sessionStorage.setItem(key, toSet);
};
var clearCached = (key) => {
  if (!key) {
    sessionStorage.clear();
    return;
  }
  sessionStorage.removeItem(key);
};
