const ApiKey =
  "e60a06672d8e6eccf9facee4ebd183d1f1def9026b03ace616e4d4398d4e7160";
const ApiUrl = "https://cs-api.tkr.dev/api";

const tokenProp = "tkrtkn";

const testAuth = () => {
  postAuth("tek@tkr.dev", "Diana2000");
};

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

  Logger.log(response.getContentText());

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
  var url = `${ApiUrl}/v2/auth/me`;
  let token = getUserProps(tokenProp);

  Logger.log("token", token);

  var options = {
    method: "get",
    contentType: "application/json",
    headers: {
      "X-Api-Key": ApiKey,
      Cookie: `tkr_token=${token}`,
    },
  };

  try {
    var res = UrlFetchApp.fetch(url, options);
    const obj = JSON.parse(res);
    return obj;
  } catch {
    //;
  }

  return {};
};

const logout = () => {
  setUserProps(tokenProp, "");
  setDocProps(tokenProp, "");
};
