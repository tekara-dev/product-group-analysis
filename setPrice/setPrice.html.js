(async () => {
  const btnApply = document.getElementById("btnApply");
  const supplierDdl = document.getElementById("ddlSupplier");
  const errorCnt = document.getElementById("error");

  var supplierChoices = undefined;
  var suppliers = [];
  var supplierId = "";

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

    ddl.setChoices(
      toSet,
      "id", //Откуда брать значение
      "name", //Откуда брать название
      true //Очистить предыдущие
    );
  };

  const initSuppliers = async () => {
    addLoader("Получаем список поставщиков");
    supplierChoices.disable();

    const [data, sId] = await Promise.all([
      getServerData("getSuppliers"),
      getServerData("getStoredSupplierId"),
    ]);

    suppliers = [...data];
    supplierId = sId;

    fillDdl(suppliers, supplierChoices);

    if (sId) {
      supplierChoices.setChoiceByValue(supplierId);
    }

    supplierChoices.enable();
    removeLoader("Получаем список поставщиков");
  };

  const printError = (text, el) => {
    const errContainer = el || errorCnt;
    errContainer.style.display = "";
    errContainer.innerHTML = text;
  };
  const clearError = (el) => {
    const errContainer = el || errorCnt;
    errContainer.style.display = "none";
    errContainer.innerHTML = "";
  };


  //React to ddl change
  supplierDdl.addEventListener("change", async (ev) => {
    const id = ev.target.value ?? "";
    if (id !== supplierId) {
      supplierId = id;
      addLoader("Сохраняем поставщика");
      await getServerData("storeSupplierId", [id]);
      removeLoader("Сохраняем поставщика");
    }
  });

  supplierChoices = new Choices(supplierDdl, {
    noResultsText: "Поставщики не найдены",
  });

  initSuppliers();

  btnApply.addEventListener("click", async () => {
    btnApply.disabled = true;
    // let isError = false;
    addLoader("Получаем цены");
    try {
      const res = await getServerData("getPrices", [supplierId]);
      console.log("Prices", res);
    } catch (e) {
      printError(e);
      //   isError = true;
    }
    clearError();
    removeLoader("Получаем цены");
    btnApply.disabled = false;
  });
})();
