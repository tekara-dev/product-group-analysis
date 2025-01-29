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

  const inputChangeDelay = 500;
  let inputChangeTimeout;

  const startDdlLoader = (ddl, noReset) => {
    if (!noReset) {
      ddl.innerHTML = "";
      ddl.appendChild(defaultOption({ name: "Подождите...", value: "" }));
    }

    ddl.disabled = true;
    ddl.parentElement.className = "select loading";
  };

  const stopDdlLoader = (ddl) => {
    ddl.disabled = false;
    ddl.parentElement.className = "select";
  };

  const defaultOption = (data) => {
    const opt = document.createElement("option");
    opt.value = data.id;

    opt.textContent = data.name;
    return opt;
  };

  const fillDdl = (data, ddl) => {
    if (!data || !ddl) return;

    ddl.innerHTML = "";

    ddl.appendChild(defaultOption({ name: "Не выбрано", value: "" }));
    data.map(defaultOption).forEach((x) => ddl.appendChild(x));
  };

  const handleMakerChange = (ev) => {
    makerId = ev.target.value;

    fetchAndFillModels();

    const found = makers.find((x) => x.id === makerId);
    if (!found) return;

    startDdlLoader(makerDdl, true);
    google.script.run
      .withSuccessHandler(() => {
        stopDdlLoader(makerDdl);
      })
      .setCellValue("CellMaker", `  ${found.name}`);
  };

  const handleCatChange = (ev) => {
    categoryId = ev.target.value;

    fetchAndFillModels();

    const found = categories.find((x) => x.id === categoryId);
    if (!found) return;

    startDdlLoader(catDdl, true);
    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(catDdl);
      })
      .setCellValue("CellCategory", `  ${found.name}`);
  };

  const handleModelChange = (ev) => {
    modelId = ev.target.value;

    const found = models.find((x) => x.id === modelId);
    if (!found) return;

    startDdlLoader(modelDdl, true);
    google.script.run
      .withSuccessHandler(() => {
        stopDdlLoader(modelDdl);
      })
      .setCellValue("CellModel", `  ${found.name}`);

    modelInput.value = found.name;
  };

  const handleCustomModelChange = (val) => {
    google.script.run
      .withSuccessHandler(() => {
        stopDdlLoader(modelDdl);
      })
      .setCellValue("CellCustomModel", `  ${val}`);
  };

  const fetchAndFillModels = () => {
    if (!makerId || !categoryId) return;

    startDdlLoader(modelDdl);

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(modelDdl);

        const modelsArr = Object.keys(data).map((x) => data[x]);
        models = [...modelsArr];

        fillDdl(modelsArr, modelDdl);

        const selected = cellValues.model;
        if (!selected) return;

        setModelValue(selected);
      })
      .getModels(makerId, categoryId);
  };

  const setMakerValue = (val, noFire) => {
    const found = makers.find((x) => x.name.trim() === val.trim());
    if (!found) return;

    makerDdl.value = found.id;
    if (!noFire) handleMakerChange({ target: { value: found.id } });
  };

  const setCatValue = (val, noFire) => {
    const found = categories.find((x) => x.name.trim() === val.trim());
    if (!found) return;

    catDdl.value = found.id;
    if (!noFire) handleCatChange({ target: { value: found.id } });
  };

  const setModelValue = (val) => {
    const found = models.find((x) => x.name.trim() === val.trim());
    if (!found) return;

    modelDdl.value = found.id;

    if (!modelInput.value.trim()) modelInput.value = found.name;
  };

  const initFields = () => {
    startDdlLoader(makerDdl);

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(makerDdl);

        const makersArr = Object.keys(data).map((x) => data[x]);
        makers = [...makersArr];

        fillDdl(makersArr, makerDdl, cellValues.maker);

        const selected = cellValues.maker;
        if (!selected) return;

        setMakerValue(selected);
      })
      .getMakers();

    startDdlLoader(catDdl);

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(catDdl);

        const makersArr = Object.keys(data).map((x) => data[x]);
        categories = [...makersArr];

        fillDdl(makersArr, catDdl, cellValues.category);

        const selected = cellValues.category;
        if (!selected) return;

        setCatValue(selected);
      })
      .getCategories();

    modelInput.value = (cellValues.modelCustom || "").trim();
  };

  const refreshSettings = () => {
    startDdlLoader(makerDdl);
    startDdlLoader(catDdl);
    modelDdl.disabled = true;

    google.script.run
      .withSuccessHandler((data) => {
        stopDdlLoader(makerDdl, true);
        stopDdlLoader(catDdl);

        cellValues = { ...data };

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

        setMakerValue(cellValues.maker);
        setCatValue(cellValues.category);
      })
      .getSelectionData();
  };

  //Execution logic
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
