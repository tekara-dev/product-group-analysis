const tokenProp = "tkrtkn";

const apiProps = {
  dev: {
    key: "c91b0a673a2ddfe8b9c3f1ea6f9a43e0c5d2bca185e7f37a0ec4f5113f8ac312",
    csUrl: "https://cs-api.tkr.dev/api",
    offersUrl: "https://offers-moder-api.tkr.dev/api",
    env: "dev",
  },
  net: {
    key: "ff387ede901c3c854690a40476e70214c5ed0552c63cf3dcb6be3e21528a4d57",
    csUrl: "https://cs-api.tekara.net/api",
    offersUrl: "https://offers-moder-api.tekara.net/api",
    env: "net",
  },
  ru: {
    key: "ff387ede901c3c854690a40476e70214c5ed0552c63cf3dcb6be3e21528a4d57",
    csUrl: "https://cs-api.tekara.ru/api",
    offersUrl: "https://offers-moder-api.tekara.ru/api",
    env: "ru",
  },
};

/**
 * @param {"dev" | "net" | "ru"} env
 * @returns {key: string, csUrl: string, offersUrl: string} apiProps
 */
const getApiProps = (env = "dev") => {
  return apiProps[env];
};
const getActiveApiProps = () => {
  const env = getApiSettings();
  return getApiProps(env);
};

const getOffersApiPoint = (point, method = "get", data, noApiKey) => {
  return getApiPoint(point, method, data, noApiKey, "offers");
};

const getCsApiPoint = (point, method = "get", data, noApiKey) => {
  return getApiPoint(point, method, data, noApiKey, "cs");
};

const getApiPoint = (point, method = "get", data, noApiKey, apiType = "cs") => {
  var url = `${point}`;
  const env = getApiSettings();
  const apiProps = getApiProps(env);
  const apiUrl = apiProps[`${apiType}Url`];
  if (!url.startsWith("http")) {
    url = `${apiUrl}${
      url.startsWith("/") || apiUrl.endsWith("/") ? "" : "/"
    }${url}`;
  }

  let token = getUserProps(tokenProp);

  var options = {
    method,
    contentType: "application/json",
    headers: {
      ...(noApiKey ? {} : { "X-Api-Key": apiProps.key }),
      Authorization: token,
      Cookie: `tkr_token=${token}`,
    },
    payload: JSON.stringify(data),
  };

  try {
    var res = UrlFetchApp.fetch(url, options);
    const text = res.getContentText();
    Logger.log(`Point: ${point}`);
    Logger.log(text);
    const obj = JSON.parse(text);
    return obj;
  } catch (e) {
    Logger.log("Error!", point, e.message);
    throw e.message;
  }
  return undefined;
};
