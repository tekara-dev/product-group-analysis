///<reference path="../lib/api.js" />

const testPostAuth = () => {
  return postAuth("admin@tekara.ru", "YBjbe85Fw26gUKfs");
};

const postAuth = (login, password) => {
  const env = getApiSettings();
  const apiProps = getApiProps(env);
  var url = `${apiProps.csUrl}/v1/auth/login`;
  var options = {
    muteHttpExceptions: true,
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Api-Key": apiProps.key,
    },
    payload: JSON.stringify({ email: login, password }),
  };

  var response = UrlFetchApp.fetch(url, options);

  let res = "";
  try {
    res = response.getContentText();
    const obj = JSON.parse(res);
    setUserProps(tokenProp, obj.token);
    return obj;
  } catch (e) {
    console.log(res);
    return { error: e.message, response: res };
  }
};

const setLoginToken = (token) => {
    setUserProps(tokenProp, token);
};
const getLoginToken = () => {
  return getUserProps(tokenProp);
};

const postAuthMe = () => {
  try {
    return getCsApiPoint(`/v2/auth/me`) || {};
  } catch {
    return {};
  }
};

const logout = () => {
  setUserProps(tokenProp, "");
  setDocProps(tokenProp, "");
};
