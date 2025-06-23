(async () => {
  var makerId = "";
  var categoryId = "";
  var modelId = "";

  var models = [];
  var categories = [];
  var makers = [];

  var cellValues = {};
  var lastPool = {};
  var firstPool = true;

  var makerDdl = document.getElementById("ddlMaker");
  var catDdl = document.getElementById("ddlCategory");
  var modelDdl = document.getElementById("ddlModel");
  var modelInput = document.getElementById("inputModel");

  var makerChoices = undefined;
  var categoryChoices = undefined;
  var modelChoices = undefined;

  const inputChangeDelay = 500;
  let inputChangeTimeout;

  const startDdlLoader = (ddl, loaderText) => {
    ddl.disable();
    if (loaderText) addLoader(loaderText);
  };

  const stopDdlLoader = (ddl, loaderText) => {
    ddl.enable();
    if (loaderText) removeLoader(loaderText);
  };

  const fillDdl = (data, ddl) => {
    //, selected) => {
    if (!ddl) return;

    // const notSelected =
    //   !selected || !data.some((x) => x.id === selected || x.name === selected);

    const toSet = [
      { name: "Не выбрано", id: "", selected: true }, // notSelected },
      ...(data || []).map(({ name, id }) => ({
        name,
        id,
        //selected: !notSelected && (id === selected || name === selected),
      })),
    ];

    ddl.setChoices(
      toSet,
      "id", //Откуда брать значение
      "name", //Откуда брать название
      true //Очистить предыдущие
    );
  };

  const handleMakerChange = async (ev, noServerSet) => {
    makerId = ev.target.value || "";
    makerId = makerId === "undefined" ? "" : makerId || "";

    fetchAndFillModels(noServerSet);

    const found = makers.find((x) => x.id === makerId);
    if (makerId && !found) return;

    if (noServerSet === true) return;

    startDdlLoader(makerChoices, "Синхронизуем производителя");
    await Promise.all([
      getServerData("setCellValue", ["CellMaker", makerId ? found.name : ""]),
      getServerData("storeSheetSettings", [makerId, undefined, undefined]),
    ]);
    stopDdlLoader(makerChoices, "Синхронизуем производителя");
  };

  const handleCatChange = async (ev, noServerSet) => {
    categoryId = ev.target.value || "";
    categoryId = categoryId === "undefined" ? "" : categoryId || "";

    fetchAndFillModels(noServerSet);

    const found = categories.find((x) => x.id === categoryId);
    if (categoryId && !found) return;

    if (noServerSet === true) return;

    startDdlLoader(categoryChoices, "Синхронизуем категорию");
    await Promise.all([
      getServerData("setCellValue", [
        "CellCategory",
        categoryId ? found.name : "",
      ]),
      getServerData("storeSheetSettings", [undefined, categoryId, undefined]),
    ]);
    stopDdlLoader(categoryChoices, "Синхронизуем категорию");
  };

  const handleModelChange = async (ev) => {
    modelId = ev.target.value;
    modelId = modelId === "undefined" ? "" : modelId || "";

    const found = models.find((x) => x.id === modelId);
    if (modelId && !found) return;

    startDdlLoader(modelChoices, "Синхронизуем модель");

    const nameToSet = modelId ? found.name : "";

    await Promise.all([
      getServerData("setCellValue", ["CellModel", nameToSet]),
      getServerData("storeSheetSettings", [undefined, undefined, modelId]),
      ...(modelId
        ? [getServerData("setCellValue", ["CellCustomModel", nameToSet])]
        : []),
    ]);

    stopDdlLoader(modelChoices, "Синхронизуем модель");

    if (modelId) {
      modelInput.value = found.name;
    }
  };

  const handleCustomModelChange = async (val) => {
    addLoader("Сихронизуем название модели");
    await getServerData("setCellValue", ["CellCustomModel", val || ""]);
    removeLoader("Сихронизуем название модели");
  };

  const fetchAndFillModels = async () => {
    startDdlLoader(modelChoices, "Получаем список моделей");

    const fill = (modelsArr) => {
      stopDdlLoader(modelChoices, "Получаем список моделей");

      fillDdl(modelsArr, modelChoices);

      const selected = cellValues.model;
      if (!selected) return;

      setModelValue({ name: selected, id: modelId });
    };

    makerId = makerId === "undefined" ? "" : makerId || "";
    categoryId = categoryId === "undefined" ? "" : categoryId || "";

    if (!makerId || !categoryId) return fill([]);

    const data = await getModels(makerId, categoryId); //await getServerData("getModels", [makerId, categoryId], true); //Из кеша, если возможно
    models = [...data];

    fill(models);
  };

  const setMakerValue = (val, noFire, noServerSet) => {
    console.log("setMakerValue", val, noServerSet);
    const _val =
      val === "undefined" ? { name: "", id: "" } : val || { name: "", id: "" };

    let found = makers.find((x) => x.id === _val.id);
    if (!found) found = makers.find((x) => x.name === _val.name.trim());

    if (_val && !found) return;

    makerId = _val ? found.id : "";
    makerChoices.setChoiceByValue(makerId);

    if (!noFire)
      handleMakerChange({ target: { value: found.id } }, noServerSet);
  };

  const setCatValue = (val, noFire, noServerSet) => {
    const _val =
      val === "undefined" ? { name: "", id: "" } : val || { name: "", id: "" };

    let found = categories.find((x) => x.id === _val.id);
    if (!found) found = categories.find((x) => x.name === _val.name.trim());

    if (_val && !found) return;

    categoryId = _val ? found.id : "";
    categoryChoices.setChoiceByValue(categoryId);

    if (!noFire) handleCatChange({ target: { value: found.id } }, noServerSet);
  };

  const setModelValue = (val) => {
    const _val =
      val === "undefined" ? { name: "", id: "" } : val || { name: "", id: "" };

    let found = models.find((x) => x.id === _val.id);
    if (!found) found = models.find((x) => x.name === _val.name.trim());

    if (_val && !found) return;

    modelId = _val ? found.id : "";
    modelChoices.setChoiceByValue(modelId);

    if (!modelInput.value.trim()) modelInput.value = found.name;
  };

  const syncMode = () => {
    if (!cellValues.isDataList) {
      [...document.getElementsByClassName("inputCnt")].map(
        (x) => (x.style.display = "none")
      );
      document.getElementById("notDataList").style.display = "";
      return false;
    }

    [...document.getElementsByClassName("inputCnt")].map(
      (x) => (x.style.display = "")
    );
    document.getElementById("notDataList").style.display = "none";
    return true;
  };

  const getMakers = () => makeOffersApiCall("/catalog/makers", "GET", undefined, true);
  const getCategories = () => makeOffersApiCall("/catalog/categories", "GET", undefined, true);
  const getModels = (makerId, categoryId) =>
    makeOffersApiCall(
      `/catalog/models?makerId=${makerId}&categoryId=${categoryId}`
    );

  const initMakers = async () => {
    startDdlLoader(makerChoices, "Получаем список производителей");

    const data = await getMakers();//await getServerData("getMakers", undefined, true); //Из кеша, если есть

    stopDdlLoader(makerChoices, "Получаем список производителей");

    makers = [...data];

    fillDdl(makers, makerChoices);

    const selected = cellValues.maker;
    if (!selected) return;

    setMakerValue({ name: selected, id: makerId }, false, true);
  };

  const initCategories = async () => {
    startDdlLoader(categoryChoices, "Получаем список категорий");

    const data = await getCategories();//await getServerData("getCategories", undefined, true); //Из кеша, если есть
    stopDdlLoader(categoryChoices, "Получаем список категорий");

    categories = [...data];

    fillDdl(categories, categoryChoices);

    const selected = cellValues.category;
    if (!selected) return;

    setCatValue({ name: selected, id: categoryId }, false, true);
  };

  const initFields = async () => {
    await Promise.all([initMakers(), initCategories()]);
    modelInput.value = (cellValues.modelCustom || "").trim();
  };

  const refreshSettings = async () => {
    addLoader("Обновляем данные о листе");
    startDdlLoader(makerChoices);
    startDdlLoader(categoryChoices);
    modelDdl.disabled = true;

    const [data, settings] = await Promise.all([
      getServerData("getSettings"),
      getServerData("getStoredSheetSettings"),
    ]);
    console.log("Настройки листа, refreshSettings", settings);

    modelId = settings.modelId;
    categoryId = settings.categoryId;
    makerId = settings.makerId;

    stopDdlLoader(makerChoices);
    stopDdlLoader(categoryChoices);
    removeLoader("Обновляем данные о листе");

    cellValues = { ...data };

    if (!syncMode()) return;

    await initFields();
  };

  const poolChanges = async () => {
    const data = await getServerData("getSelectionData");

    if (data.sheetName === lastPool.sheetName) return;
    lastPool = { ...data };

    if (firstPool) {
      firstPool = false;
      return;
    }

    cellValues = { ...data.settings };
    ids = { ...data.ids };

    if (!syncMode()) return;

    if (makers.length === 0) {
      initFields();
    } else {
      setMakerValue({ name: cellValues.maker, id: ids.makerId }, false, true);
      setCatValue(
        { name: cellValues.category, id: ids.categoryId },
        false,
        true
      );
      modelInput.value = cellValues.modelCustom;
    }
  };

  makerChoices = new Choices(makerDdl, {
    noResultsText: "Производители не найдены",
  });
  categoryChoices = new Choices(catDdl, {
    noResultsText: "Категории не найдены",
  });
  modelChoices = new Choices(modelDdl, {
    noResultsText: "Модели не найдены",
  });
  modelChoices.disable();

  makerDdl.addEventListener("change", handleMakerChange);
  catDdl.addEventListener("change", handleCatChange);
  modelDdl.addEventListener("change", handleModelChange);

  await refreshSettings();

  modelInput.addEventListener("input", () => {
    // Clear the previous timeout
    clearTimeout(inputChangeTimeout);

    // Set a new timeout
    inputChangeTimeout = setTimeout(() => {
      handleCustomModelChange(modelInput.value);
    }, inputChangeDelay);
  });

  setInterval(poolChanges, 300);
})();
