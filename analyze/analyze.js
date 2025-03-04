///<reference path="listTable.js" />

const supplierDataRowIndex = 2;
const emptyCategorySymbol = "↴";
const analyzedSymbol = "🔬";

const testRunAnalyze = () => {
  const res = runAnalyze(true);
  console.log(res);
};

const getSuppliers = () => {
  return getApiPoint("https://offers-moder-api.tkr.dev/api/catalog/suppliers");
};

const postAnalyze = (data, makerId, modelId, supplierId) => {
  return getApiPoint(
    `https://offers-moder-api.tkr.dev/api/priceAnalyzer/analyzeFromComparisonTree?makerId=${makerId}&modelId=${modelId}&supplierId=${supplierId}`,
    "post",
    data
  );
};

const getSupplierIdStoreKey = (sheetName) => `${sheetName}_supplierId`;
const storeSupplierId = (id) => {
  const sheetName = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet()
    .getName();

  setDocProps(getSupplierIdStoreKey(sheetName), id);
};

const getStoredSupplierId = () => {
  const sheetName = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet()
    .getName();

  return getDocProps(getSupplierIdStoreKey(sheetName)) || "";
};
/**
 * Validate the tree structure
 * @param {Array} tree - The tree structure to validate. Result of getActiveTable() function.
 * @returns {Array} - An array of errors
 */
const validateTree = (tree) => {
  const errors = [];

  const validateNode = ({
    type,
    partNumber,
    rowIndex,
    name,
    props = [],
    subs,
  }) => {
    if (type === "Part") {
      if (!partNumber) {
        errors.push({
          rowIndex,
          error: "Part number не заполнен",
          name,
        });
      }
      const priceProp = props.find(({ name }) => name === "Цена");
      if (!priceProp || !priceProp.value) {
        errors.push({ rowIndex, name, error: "Цена не заполнена" });
      }

      const currencyProp = props.find(({ name }) => name === "Валюта");
      if (!currencyProp || !currencyProp.value) {
        errors.push({ rowIndex, name, error: "Валюта не заполнена" });
      }
    }

    if (subs) {
      for (const subNode of subs) {
        validateNode(subNode);
      }
    }
  };

  for (const node of tree) {
    validateNode(node);
  }

  return errors;
};

/**
 * Exclude errors from the tree
 * @param {Array} tree - The tree structure to exclude errors from. Result of getActiveTable() function.
 * @param {Array} errors - The errors to exclude from the tree. Result of validateTree() function.
 * @returns {Array} - A new tree structure with errors excluded
 */
const excludeErrors = (tree, errors) => {
  const newTree = [];
  for (const node of tree) {
    if (errors.some(({ rowIndex }) => rowIndex === node.rowIndex)) continue;
    newTree.push(node);
    if (node.subs) {
      node.subs = excludeErrors(node.subs, errors);
    }
  }
  return newTree;
};

/**
 * Run the analyze. Runs on "Анализировать" button click.
 * @param {boolean} noErrors - Whether to exclude errors from the tree
 * @returns {Promise} - A promise that resolves to the result of the analyze
 */
const runAnalyze = async (noErrors = false) => {
  const treeData = getActiveTable(true);
  const req = {
    settings: getCustomParams(),
    rows: treeData,
  };

  const { makerId, modelId } = getStoredSheetSettings();
  const supplierId = getStoredSupplierId();
  const errors = validateTree(treeData);

  if (!noErrors) {
    if (errors.length > 0) {
      return { error: "Есть ошибки в дереве", errors };
    }
  } else {
    req.rows = excludeErrors(treeData, errors);
  }

  const res = await postAnalyze(req, makerId, modelId, supplierId);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { start: headerRowIndex } = getTableInfoData(sheet.getName());
  if (res.supplier) {
    fillRowProps(res.supplier, headerRowIndex, sheet, supplierDataRowIndex);
    mergeAndFixCats(sheet, headerRowIndex);
  }
  fillAnalyzedProps(req.rows, res.rows, headerRowIndex, sheet);
};

const fillAnalyzedProps = (data, analyzed, headerRowIndex, sheet) => {
  for (const row of data) {
    const { rowIndex, name, subs } = row;
    const analyzedRow = analyzed.find((x) => name === x.name);
    if (analyzedRow) {
      fillRowProps(analyzedRow, headerRowIndex, sheet, rowIndex);
      if (analyzedRow.subs && subs) {
        fillAnalyzedProps(subs, analyzedRow.subs, headerRowIndex, sheet);
      }
    }
  }
};

/**
 * Получает строки с заголовками
 * @param {Sheet} sheet - Лист с данными
 * @param {number} headerRowIndex - Индекс строки с заголовками
 * @returns {Array} - [firstHeaderRow, secondHeaderRow] Две строки с заголовками
 */
const getHeaderRows = (sheet, headerRowIndex) => {
  return sheet
    .getRange(headerRowIndex, 1, 2, sheet.getLastColumn())
    .getValues();
};

/**
 * Заполняет свойства в строке
 * @param {{ props: { name: string, value: string }[], rowIndex: number }} row - Строка с данными
 * @param {number} headerRowIndex - Индекс строки с заголовками
 * @param {Sheet} sheet - Лист с данными
 * @param {number} rowIndex - Индекс строки в листе для заполнения значениями
 */
const fillRowProps = ({ props }, headerRowIndex, sheet, rowIndex) => {
  //Индексы строк с заголовками
  const firstHeaderRowIndex = headerRowIndex;
  const secondHeaderRowIndex = headerRowIndex + 1;

  //Если нет свойств, то выходим
  if(!props || props.length === 0) return;

  for (let prop of props) {
    //Строки с заголовками
    let [firstHeaderRow, secondHeaderRow] = getHeaderRows(
      sheet,
      headerRowIndex
    );

    //Названия свойств. Например ['Категория', 'Значение1'] из 'Категория|Значение1'
    const propNames = prop.name.split("|");
    if (propNames.length === 2) {
      const firstPropName = propNames[0];
      //Индекс колонки с категорией
      let catColIndex = headerIndex(firstHeaderRow, firstPropName);
      if (catColIndex === -1) {
        //Если колонка с категорией не найдена, то добавляем ее в конец листа
        catColIndex = sheet.getLastColumn();
        sheet.insertColumnAfter(catColIndex);
        sheet
          .getRange(firstHeaderRowIndex, catColIndex + 1)
          .setValue(firstPropName);
        //Обновляем строки с заголовками
        [firstHeaderRow, secondHeaderRow] = getHeaderRows(
          sheet,
          headerRowIndex
        );
      }
      const secondPropName = propNames[1]; //Это название свойства из данных
      const secondPropNameCat = formCatName(secondPropName); //Это название свойства для вывода. С символом 🔬

      let secondCatColIndex = catColIndex;
      let found = false;
      if (!found) {
        for (let i = secondCatColIndex; i < secondHeaderRow.length; i++) {
          let propNameCat = secondHeaderRow[i];
          //Если колонка пустая, то считаем ее найденой.
          if (!propNameCat) {
            found = true;
            break;
          }
          //Если нашли, то запоминаем индекс и выходим из цикла
          if (propNameCat === secondPropNameCat) {
            secondCatColIndex = i;
            found = true;
            break;
          }
          //Если в строке категории не пусто и это не первая колонка в диапозоне категории, выходим из цикла
          if (firstHeaderRow[i] === "" && i !== secondCatColIndex) {
            break;
          }
        }
      }

      if (!found) {
        sheet.insertColumnAfter(secondCatColIndex + 1);
        secondCatColIndex++;
      }
      //Устанавливаем название свойства в найденную или добавленную колонку
      sheet
        .getRange(secondHeaderRowIndex, secondCatColIndex + 1)
        .setValue(secondPropNameCat);

      //Устанавливаем значение свойства в найденную или добавленную колонку
      sheet.getRange(rowIndex, secondCatColIndex + 1).setValue(prop.value);
    } else if (propNames.length === 1) {
      let propNameCat = formCatName(propNames[0]); //Это название свойства для вывода. С символом 🔬

      //Важно. Поиск по второй строке сработает корректно, только для уникального названия свойства.
      //Берется только подкатегория. Категория не учитывается.
      let propColIndex = headerIndex(secondHeaderRow, propNameCat);

      if (propColIndex === -1) {
        propColIndex = sheet.getLastColumn();
        sheet.insertColumnAfter(propColIndex);
        sheet
          .getRange(secondHeaderRowIndex, propColIndex + 1)
          .setValue(propNameCat);
        sheet
          .getRange(firstHeaderRowIndex, propColIndex + 1)
          .setValue(emptyCategorySymbol);
      }
      sheet.getRange(rowIndex, propColIndex + 1).setValue(prop.value);
    }
  }
};

/**
 * Очищает название свойства от символа 🔬
 * @param {string} catName - Название свойства
 * @returns {string} - Название свойства без символа 🔬
 */
const clearCatName = (catName) => {
  return catName.replace(analyzedSymbol, "").trim();
};

/**
 * Формирует название свойства с символом 🔬
 * @param {string} catName - Название свойства
 * @returns {string} - Название свойства с символом 🔬
 */
const formCatName = (catName) => {
  return `${catName} ${analyzedSymbol}`;
};
/**
 * Объединяет колонки с одинаковыми категориями и добавляет символ 🔬 в конец названия свойства.
 * После чего корректирует ширину колонок в зависимости от количества символов в названии свойства.
 * в какой-то момент написал этот код и понял, что сам его с трудом читаю. Добавил комментарии. @aagronik
 * @param {Sheet} sheet - Лист с данными
 * @param {number} headerRowIndex - Индекс строки с заголовками
 */
const mergeAndFixCats = (sheet, headerRowIndex) => {
  const firstHeaderRowIndex = headerRowIndex;
  let [firstHeaderRow, secondHeaderRow] = getHeaderRows(
    sheet,
    firstHeaderRowIndex
  );

  let mergeStartIndex = 0;
  let mergeLength = 0;
  // Массив для корректировки ширины колонок
  const toFix = [];
  for (let i = 0; i < firstHeaderRow.length; i++) {
    const catName = clearCatName(firstHeaderRow[i]);
    // Если колонка не пустая в первой строке
    if (catName) {
      if (mergeLength > 0 && mergeStartIndex > 0) {
        // Объединяем колонки первой строки
        sheet
          .getRange(
            firstHeaderRowIndex,
            mergeStartIndex + 1,
            1,
            mergeLength + 1
          )
          .merge();
        // Добавляем в массив для корректировки ширины диапозон объединенных колонок
        toFix.push({ start: mergeStartIndex + 1, length: mergeLength + 1 });
      } else {
        // Колонка не пуста. (emptyCategorySymbol), добавляем в массив для корректировки ширины как одну колонку
        toFix.push({ start: mergeStartIndex + 1, length: 1 });
      }
      // Сбрасываем счетчики ширины диапазона объединения и начала диапазона
      mergeLength = 0;
      mergeStartIndex = i;
    } else {
      mergeLength++;
    }
    if (i === firstHeaderRow.length - 1) {
      if (mergeLength > 0) {
        // Объединяем колонки первой строки, если это сгруппированные колонки в конце строки
        sheet
          .getRange(
            firstHeaderRowIndex,
            mergeStartIndex + 1,
            1,
            mergeLength + 1
          )
          .merge();
      }
      // Добавляем в массив для корректировки ширины диапозон объединенных колонок
      toFix.push({ start: mergeStartIndex + 1, length: mergeLength + 1 });
    }
  }

  [firstHeaderRow, secondHeaderRow] = getHeaderRows(sheet, firstHeaderRowIndex);

  // Корректируем ширину колонок в соответствии с диапозонами для корректировки ширины
  for (const { start, length } of toFix) {
    const colWidth =
      length > 1 //Если диапазон объединения больше 1, то берем ширину первой колонки
        ? firstHeaderRow[start - 1].length * 9
        : secondHeaderRow[start - 1].length * 9; //Принимаем ширину одного символа за 9px
    for (let i = start; i < start + length; i++) {
      sheet.setColumnWidth(i, Math.round(colWidth / length));
    }
  }
};
