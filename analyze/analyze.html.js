(async () => {
  const treeCnt = document.getElementById("tree");
  const btnAnal = document.getElementById("btnAnalyze");
  const supplierDdl = document.getElementById("supplier");
  const errorCnt = document.getElementById("error");
  const toggle = document.getElementById("toggle");

  var supplierChoices = undefined;
  var analyzeErrorsToggle = undefined;
  var suppliers = [];
  var supplierId = "";
  var isAnalyzeErrors = false;

  const getTreeSettings = async () => {
    const loaderText = "Загружаем структуру";
    addLoader(loaderText);
    let result;
    try {
      result = await getServerData("getValidatedActiveTable");
      removeLoader(loaderText);
    } catch (err) {
      console.error("error:", err);
      removeLoader(loaderText);
    }
    return result || { table: [], errors: [] };
  };

  var { table: data, errors } = await getTreeSettings();

  await Promise.all([
    loadContent("tree/tree.css", "Загружаем дерево"),
    loadContent("tree/tree.js"),
    loadContent("toggle/toggle.css", "Загружаем переключатель"),
    loadContent("toggle/toggle.js"),
  ]);

  const getLeafBadge = (rowIndex) => {
    const error = errors.filter(
      ({ rowIndex: eRowIndex }) => eRowIndex === rowIndex
    );
    return error.length;
  };
  const getNodeBadge = (subs = []) => {
    const subErrors = subs.reduce((acc, sub) => {
      return (
        acc +
        (sub.type === "Part"
          ? getLeafBadge(sub.rowIndex)
          : getNodeBadge(sub.subs))
      );
    }, 0);
    return subErrors;
  };

  generateTree({
    data,
    to: treeCnt,
    getTitle: ({ name }) => name,
    getSubs: ({ subs }) => subs,
    getBadge: ({ type, subs, rowIndex }) => {
      return type === "Part" ? getLeafBadge(rowIndex) : getNodeBadge(subs);
    },
    getLeafIcon: (x) =>
      x.type === "Part"
        ? `data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.3951 19.3711L9.97955 20.6856C10.1533 21.0768 10.4368 21.4093 10.7958 21.6426C11.1547 21.8759 11.5737 22.0001 12.0018 22C12.4299 22.0001 12.8488 21.8759 13.2078 21.6426C13.5667 21.4093 13.8503 21.0768 14.024 20.6856L14.6084 19.3711C14.8165 18.9047 15.1664 18.5159 15.6084 18.26C16.0532 18.0034 16.5678 17.8941 17.0784 17.9478L18.5084 18.1C18.9341 18.145 19.3637 18.0656 19.7451 17.8713C20.1265 17.6771 20.4434 17.3763 20.6573 17.0056C20.8715 16.635 20.9735 16.2103 20.9511 15.7829C20.9286 15.3555 20.7825 14.9438 20.5307 14.5978L19.684 13.4344C19.3825 13.0171 19.2214 12.5148 19.224 12C19.2239 11.4866 19.3865 10.9864 19.6884 10.5711L20.5351 9.40778C20.787 9.06175 20.933 8.65007 20.9555 8.22267C20.978 7.79528 20.8759 7.37054 20.6618 7C20.4479 6.62923 20.131 6.32849 19.7496 6.13423C19.3681 5.93997 18.9386 5.86053 18.5129 5.90556L17.0829 6.05778C16.5722 6.11141 16.0577 6.00212 15.6129 5.74556C15.17 5.48825 14.82 5.09736 14.6129 4.62889L14.024 3.31444C13.8503 2.92317 13.5667 2.59072 13.2078 2.3574C12.8488 2.12408 12.4299 1.99993 12.0018 2C11.5737 1.99993 11.1547 2.12408 10.7958 2.3574C10.4368 2.59072 10.1533 2.92317 9.97955 3.31444L9.3951 4.62889C9.18803 5.09736 8.83798 5.48825 8.3951 5.74556C7.95032 6.00212 7.43577 6.11141 6.9251 6.05778L5.49066 5.90556C5.06499 5.86053 4.6354 5.93997 4.25397 6.13423C3.87255 6.32849 3.55567 6.62923 3.34177 7C3.12759 7.37054 3.02555 7.79528 3.04804 8.22267C3.07052 8.65007 3.21656 9.06175 3.46844 9.40778L4.3151 10.5711C4.61704 10.9864 4.77964 11.4866 4.77955 12C4.77964 12.5134 4.61704 13.0137 4.3151 13.4289L3.46844 14.5922C3.21656 14.9382 3.07052 15.3499 3.04804 15.7773C3.02555 16.2047 3.12759 16.6295 3.34177 17C3.55589 17.3706 3.8728 17.6712 4.25417 17.8654C4.63554 18.0596 5.06502 18.1392 5.49066 18.0944L6.92066 17.9422C7.43133 17.8886 7.94587 17.9979 8.39066 18.2544C8.83519 18.511 9.18687 18.902 9.3951 19.3711Z' stroke='%23F87F8E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M12 15C13.6568 15 15 13.6569 15 12C15 10.3431 13.6568 9 12 9C10.3431 9 8.99998 10.3431 8.99998 12C8.99998 13.6569 10.3431 15 12 15Z' stroke='%23F87F8E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3C/svg%3E`
        : `data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 7L11.8845 4.76892C11.5634 4.1268 11.4029 3.80573 11.1634 3.57116C10.9516 3.36373 10.6963 3.20597 10.4161 3.10931C10.0992 3 9.74021 3 9.02229 3H5.2C4.0799 3 3.51984 3 3.09202 3.21799C2.71569 3.40973 2.40973 3.71569 2.21799 4.09202C2 4.51984 2 5.0799 2 6.2V7M2 7H17.2C18.8802 7 19.7202 7 20.362 7.32698C20.9265 7.6146 21.3854 8.07354 21.673 8.63803C22 9.27976 22 10.1198 22 11.8V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V7Z' stroke='%23F87F8E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3C/svg%3E`,
    onLeafClick: async ({ rowIndex }) => {
      await getServerData("selectRow", [rowIndex]);
    },
  });

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

  const ddl = document.getElementById("ddlSupplier");

  //React to ddl change
  ddl.addEventListener("change", async (ev) => {
    const id = ev.target.value ?? "";
    if (id !== supplierId) {
      supplierId = id;
      addLoader("Сохраняем поставщика");
      await getServerData("storeSupplierId", [id]);
      removeLoader("Сохраняем поставщика");
    }
  });

  supplierChoices = new Choices(ddl, {
    noResultsText: "Поставщики не найдены",
  });

  initSuppliers();

  treeCnt.style.display = "";
  supplierDdl.style.display = "";

  if (errors.length > 0) {
    console.log("Ошибки в дереве:", errors);
    printError(
      "В структуре листа данных есть ошибки. Пожалуйста, исправьте их или отключите анализ строк с ошибками. Ниже струптура листа. В индикаторах - количество ошибок в строках.",
      treeStructure
    );
    toggle.style.display = "";
    analyzeErrorsToggle = generateToggle(toggle);
    //React to toggle change
    analyzeErrorsToggle.on("change", (value) => {
      isAnalyzeErrors = value;
      btnAnal.style.display = value ? "" : "none";
    });
  } else {
    btnAnal.style.display = "";
  }

  btnAnal.addEventListener("click", async () => {
    btnAnal.disabled = true;
    let isError = false;
    addLoader("Анализируем");
    try {
      const res = await getServerData("runAnalyze", [isAnalyzeErrors]);
    } catch (e) {
      printError(e);
      isError = true;
    }
    clearError();
    addLoader("Анализируем");
    btnAnal.disabled = false;
  });
})();
