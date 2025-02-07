const getDocProps = (key) => {
  let raw = PropertiesService.getDocumentProperties().getProperty(key);
  try {
    const js = JSON.parse(raw);
    return js;
  } catch {
    return raw;
  }
};

const setDocProps = (key, value) => {
  const toSet = typeof value === "string" ? value : JSON.stringify(value);
  PropertiesService.getDocumentProperties().setProperty(key, toSet);
};

const getUserProps = (key) => {
  let raw = PropertiesService.getUserProperties().getProperty(key);
  try {
    const js = JSON.parse(raw);
    return js;
  } catch {
    return raw;
  }
};

const setUserProps = (key, value) => {
    const toSet = typeof value === "string" ? value : JSON.stringify(value);
    PropertiesService.getUserProperties().setProperty(key, toSet);
  };
  