(async () => {
  const toggleDevNode = document.getElementById("toggleDev");
  const toggleNetNode = document.getElementById("toggleNet");
  const toggleRuNode = document.getElementById("toggleRu");
  let currentApi = "dev";

  await Promise.all([
    loadContent("toggle/toggle.css", "Загружаем переключатель"),
    loadContent("toggle/toggle.js"),
  ]);

  const dev = generateToggle(toggleDevNode);
  const net = generateToggle(toggleNetNode);
  const ru = generateToggle(toggleRuNode);
  const toggles = { dev, net, ru };

  const getApiSettings = async () => {
    const loaderText = "Загружаем настройки API";
    addLoader(loaderText);
    let result;
    try {
      result = await getServerData("getApiSettings");
      removeLoader(loaderText);
    } catch (err) {
      console.error("error:", err);
      removeLoader(loaderText);
    }
    return result || "dev";
  };

  const setApiSettings = async (api) => {
    const loaderText = "Сохраняем настройки API";
    addLoader(loaderText);
    await getServerData("setApiSettings", [api]);
    removeLoader(loaderText);
  };

  currentApi = await getApiSettings();

  const handleToggleChange = async (value, key) => {
    if (key === value) {
      toggles[key].set(true, false); //Не даем снять значение повторным переключением
      return;
    }
    currentApi = key;
    await setApiSettings(key);
    syncCurrentApi();
  };

  //Здесь запускаем изменение с false вторым параметром, чтобы не вызывать событие change
  const syncCurrentApi = () => {
    Object.values(toggles).forEach((toggle) => toggle.set(false, false));
    toggles[currentApi].set(true, false);
  };

  syncCurrentApi();

  Object.keys(toggles).forEach((key) => {
    toggles[key].on("change", (value) => handleToggleChange(value, key));
  });
})();
