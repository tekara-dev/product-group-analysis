const ApiKey =
  "e60a06672d8e6eccf9facee4ebd183d1f1def9026b03ace616e4d4398d4e7160";
const ApiUrl = "https://cs-api.tkr.dev/api";

const tokenProp = "tkrtkn";

const postAuth = (login, password) => {
  var url = `${ApiUrl}/v1/auth/login`;
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Api-Key": ApiKey,
    },
    payload: JSON.stringify({ email: login, password }),
  };

  var response = UrlFetchApp.fetch(url, options);

  try {
    const res = response.getContentText();
    const obj = JSON.parse(res);
    setUserProps(tokenProp, obj.token);
    return obj;
  } catch {
    //;
  }
  return {};
};

const postAuthMe = () => {
  try {
    return getApiPoint(`${ApiUrl}/v2/auth/me`) || {};
  } catch {
    return {};
  }
};

const getApiPoint = (point, method = "get", data, noApiKey) => {
  var url = `${point}`;
  let token = getUserProps(tokenProp);

  var options = {
    method,
    contentType: "application/json",
    headers: {
      ...(noApiKey ? {} : { "X-Api-Key": ApiKey }),
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

const logout = () => {
  setUserProps(tokenProp, "");
  setDocProps(tokenProp, "");
};
