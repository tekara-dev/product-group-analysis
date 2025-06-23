(async () => {
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");
  const cntInfo = document.getElementById("info");
  const cntForm = document.getElementById("form");
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const errorP = document.getElementById("error");

  const redirect = async (to) => {
    addLoader("Перенаправляем...");
    await getServerData("showBaseMenu", [to]);
    removeLoader("Перенаправляем...");
  };

  const refresh = async () => {
    const meRes = await authMe();

    if (meRes.id) {
      //Если есть куда перенаправлять, то перенаправляем
      if (pageData && pageData.from) {
        redirect(pageData.from);
      } else {
        //Если нет куда перенаправлять, то показываем информацию об авторизации
        cntForm.style.display = "none";
        cntInfo.style.display = "";

        const { firstName = "", lastName = "" } = meRes.contact || {};
        const nameToShow =
          firstName || lastName
            ? `${firstName} ${lastName}`
            : meRes.username || meRes.email || "неизвестный пользователь";
        cntInfo.getElementsByTagName("span")[0].innerHTML = nameToShow;
      }
    } else {
      //Если нет авторизации, то показываем форму авторизации
      cntForm.style.display = "";
      cntInfo.style.display = "none";
    }
  };

  const login = async () => {
    errorP.style.display = "none";
    errorP.innerHTML = "";

    try {
      const res = await makeCsApiCall(
        "/v1/auth/login",
        "POST",
        {
          email: inputEmail.value,
          password: inputPassword.value,
        },
        true
      );

      await getServerData("setLoginToken", [res.token]);
      return res;
    } catch (e) {
      errorP.innerHTML = `Ошибка авторизации. ${e.message}`;
      errorP.style.display = "";
      return { error: e.message };
    }
  };

  const authMe = async () => {
    addLoader("Обновляем информацию об авторизации...");
    const res = await makeCsApiCall("/v2/auth/me");
    removeLoader("Обновляем информацию об авторизации...");
    return res;
  };

  btnLogin.addEventListener("click", async () => {
    addLoader("Пробуем авторизоваться...");
    btnLogin.disabled = true;

    const res = await login();

    removeLoader("Пробуем авторизоваться...");

    if (!res.token) {
      errorP.innerHTML = "Скорее всего, E-mail или пароль не верны.";
    } else {
      await refresh();
    }

    btnLogin.disabled = false;
  });

  btnLogout.addEventListener("click", async () => {
    addLoader("Выходим...");
    btnLogout.disabled = true;

    await getServerData("logout");
    await refresh();

    btnLogout.disabled = false;
    removeLoader("Выходим...");
  });

  refresh();
})();
