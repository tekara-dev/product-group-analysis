///<reference path="../lib/api.js" />

const postAuth = (login, password) => {
  const env = getApiSettings();
  const apiProps = getApiProps(env);
  var url = `${apiProps.csUrl}/v1/auth/login`;
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Api-Key": apiProps.key,
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
    return getCsApiPoint(`/v2/auth/me`) || {};
  } catch {
    return {};
  }
};

const logout = () => {
  setUserProps(tokenProp, "");
  setDocProps(tokenProp, "");
};
