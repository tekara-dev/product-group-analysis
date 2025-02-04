(() => {
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
  var btnAnal = document.getElementById("btnAnal");

  var makerChoices = undefined;
  var categoryChoices = undefined;
  var modelChoices = undefined;

  const inputChangeDelay = 500;
  let inputChangeTimeout;

  const startDdlLoader = (ddl, noReset) => {
    ddl.disable();
  };

  const stopDdlLoader = (ddl) => {
    ddl.enable();
  };

  const fillDdl = (data, ddl, selected) => {
    if (!ddl) return;

    const toSet = [
      { name: "Не выбрано", id: "", selected: !selected },
      ...(data || []).map(({ name, id }) => ({
        name,
        id,
        selected: id === selected || name === selected,
      })),
    ];

    console.log(toSet);

    ddl.setChoices(
      toSet,
      "id", //Откуда брать значение
      "name", //Откуда брать название
      true //Очистить предыдущие
    );
  };

  const handleMakerChange = (ev) => {
    makerId = ev.target.value || "";
    makerId = makerId === "undefined" ? "" : makerId || "";

    fetchAndFillModels();

    const found = makers.find((x) => x.id === makerId);
    if (makerId && !found) return;

    startDdlLoader(makerChoices, true);
    google.script.run
      .withSuccessHandler(() => {
        stopDdlLoader(makerChoices);
      })
      .setCellValue("CellMaker", makerId ? found.name : "");
  };

  const handleCatChange = (ev) => {
    categoryId = ev.target.value || "";
    categoryId = categoryId === "undefined" ? "" : categoryId || "";

    fetchAndFillModels();

    const found = categories.find((x) => x.id === categoryId);
    if (categoryId && !found) return;

    startDdlLoader(categoryChoices, true);
    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(categoryChoices);
      })
      .setCellValue("CellCategory", categoryId ? found.name : "");
  };

  const handleModelChange = async (ev) => {
    modelId = ev.target.value;
    modelId = modelId === "undefined" ? "" : modelId || "";

    const found = models.find((x) => x.id === modelId);
    if (modelId && !found) return;

    startDdlLoader(modelChoices, true);

    const nameToSet = modelId ? found.name : "";

    await Promise.all([
      getServerData("setCellValue", ["CellModel", nameToSet]),
      ...(modelId
        ? [getServerData("setCellValue", ["CellCustomModel", nameToSet])]
        : []),
    ]);

    stopDdlLoader(modelChoices);
    
    if (modelId) {
      modelInput.value = found.name;
    }
  };

  const handleCustomModelChange = (val) => {
    google.script.run
      .withSuccessHandler(() => {
        stopDdlLoader(modelChoices);
      })
      .setCellValue("CellCustomModel", val || "");
  };

  const fetchAndFillModels = () => {
    startDdlLoader(modelChoices);

    const fill = (modelsArr) => {
      stopDdlLoader(modelChoices);

      fillDdl(modelsArr, modelChoices, cellValues.model);

      const selected = cellValues.model;
      if (!selected) return;

      setModelValue(selected);
    };

    makerId = makerId === "undefined" ? "" : makerId || "";
    categoryId = categoryId === "undefined" ? "" : categoryId || "";

    if (!makerId || !categoryId) return fill([]);

    google.script.run
      .withSuccessHandler((data) => {
        const modelsArr = Object.keys(data).map((x) => data[x]);
        models = [...modelsArr];

        fill(models);
      })
      .getModels(makerId, categoryId);
  };

  const setMakerValue = (val, noFire) => {
    const _val = val === "undefined" ? "" : val || "";

    const found = makers.find((x) => x.name.trim() === _val.trim());
    if (_val && !found) return;

    makerId = _val ? found.id : "";
    makerChoices.setValue([cellValues.maker]);

    if (!noFire) handleMakerChange({ target: { value: found.id } });
  };

  const setCatValue = (val, noFire) => {
    const _val = val === "undefined" ? "" : val || "";

    const found = categories.find((x) => x.name.trim() === _val.trim());
    if (_val && !found) return;

    categoryId = _val ? found.id : "";
    categoryChoices.setValue([cellValues.category]);

    if (!noFire) handleCatChange({ target: { value: found.id } });
  };

  const setModelValue = (val) => {
    const _val = val === "undefined" ? "" : val || "";

    const found = models.find((x) => x.name.trim() === _val.trim());
    if (_val && !found) return;

    modelId = _val ? found.id : "";
    makerChoices.setValue([cellValues.model]);

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

  const initFields = () => {
    startDdlLoader(makerChoices);

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(makerChoices);

        const makersArr = Object.keys(data).map((x) => data[x]);
        makers = [...makersArr];

        fillDdl(makersArr, makerChoices, cellValues.maker);

        const selected = cellValues.maker;
        if (!selected) return;

        setMakerValue(selected);
      })
      .getMakers();

    startDdlLoader(categoryChoices);

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(categoryChoices);

        const makersArr = Object.keys(data).map((x) => data[x]);
        categories = [...makersArr];

        fillDdl(makersArr, categoryChoices, cellValues.category);

        const selected = cellValues.category;
        if (!selected) return;

        setCatValue(selected);
      })
      .getCategories();

    modelInput.value = (cellValues.modelCustom || "").trim();
  };

  const refreshSettings = () => {
    startDdlLoader(makerChoices);
    startDdlLoader(categoryChoices);
    modelDdl.disabled = true;

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(makerChoices, true);
        stopDdlLoader(categoryChoices);

        cellValues = { ...data };

        if (!syncMode()) return;

        initFields();
      })
      .getSettings();
  };

  const poolChanges = () => {
    google.script.run
      .withSuccessHandler((data) => {
        if (data.sheetName === lastPool.sheetName) return;
        lastPool = { ...data };

        if (firstPool) {
          firstPool = false;
          return;
        }

        cellValues = { ...data.settings };

        if (!syncMode()) return;

        if (makers.length === 0 || categories.length === 0) {
          initFields();
        } else {
          setMakerValue(cellValues.maker);
          setCatValue(cellValues.category);
          modelInput.value = cellValues.modelCustom;
        }
      })
      .getSelectionData();
  };

  makerChoices = new Choices(makerDdl);
  categoryChoices = new Choices(catDdl);
  modelChoices = new Choices(modelDdl);
  modelChoices.disable();

  refreshSettings();

  makerDdl.addEventListener("change", handleMakerChange);
  catDdl.addEventListener("change", handleCatChange);
  modelDdl.addEventListener("change", handleModelChange);

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
