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
    addLoader("Обновляем информацию об авторизации...");

    const meRes = await authMe();
    if (meRes.id) {
      cntForm.style.display = "none";
      cntInfo.style.display = "";

      const { firstName = "", lastName = "" } = meRes.contact || {};
      const nameToShow = firstName || lastName ? `${firstName} ${lastName}` : meRes.username || meRes.email || "неизвестный пользователь";
      cntInfo.getElementsByTagName("span")[0].innerHTML = nameToShow;

      if (pageData && pageData.from) {
        redirect(pageData.from);
      }
    } else {
      cntForm.style.display = "";
      cntInfo.style.display = "none";
    }

    removeLoader("Обновляем информацию об авторизации...");
  };

  const login = async () => {
    const res = await getServerData("postAuth", [
      inputEmail.value,
      inputPassword.value,
    ]);
    console.log(res);
    return res;
  };

  const authMe = async () => {
    const res = await getServerData("postAuthMe");
    console.log(res);
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
