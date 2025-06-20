///<reference path="listTable.js" />
///<reference path="../lib/api.js" />

const supplierDataRowIndex = 2;
const emptyCategorySymbol = "↴";
const analyzedSymbol = "🔬";
const groupedPropNameSeparator = "|";
const maxCharsInPropName = 15;
const oneCharWidth = 9;

const testRunAnalyze = () => {
  const res = runAnalyze(true);
  console.log(res);
};

const getSuppliers = () => {
  const meta = getCsApiPoint(
    `/v1/companies/meta?types=supplier&include=contacts`
  );
  let companies = getCsApiPoint(
    `/v1/companies?offset=0&limit=${Number(
      meta.total || 10000
    )}&types=supplier&include=contacts&search=`
  );
  return companies;
};

const postAnalyze = (data, makerId, modelId, supplierId, source) => {
  var sourceStrings = [];

  if (source.sourceRussian) sourceStrings.push("RussiaLocated");
  if (source.sourceForeign) sourceStrings.push("ChinaLocated");
  if (source.sourceShadow) sourceStrings.push("ShadowOffer");

  var sourceQuery = `&source=${sourceStrings.join("&source=")}`;

  const url = `/priceAnalyzer/analyzeFromComparisonTree?makerId=${makerId}&modelId=${modelId}&supplierId=${supplierId}${sourceQuery}`;
  console.log("url:", url);
  console.log("data:", JSON.stringify(data));

  try {
    return { result: getOffersApiPoint(url, "post", data), url, data };
  } catch (e) {
    return { result: [], url, data, error: e };
  }
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

      const weightProp = props.find(({ name }) => name === "Вес (г.)");
      if (!weightProp || !weightProp.value) {
        errors.push({ rowIndex, name, error: "Вес не заполнен" });
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
  setTablePrice(treeData);

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

  const source = getDocProps("analyzeSourceSettings") || {};

  //Отправляем запрос на анализ
  const { result: res, url, data: requestData, error } = await postAnalyze(req, makerId, modelId, supplierId, source);
  if (error) {
    return { error: error, url, requestData };
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { start: headerRowIndex } = getTableInfoData(sheet.getName());

  //Это параметры размерности виртуальной таблицы
  const maxRowIndex = getMaxRowIndex(req.rows);
  const rowsCount = maxRowIndex;
  const colsCount = 50;

  //Это пустая виртуальная таблица, в которую пишутся значения ячеек. После заполнения, ее значения переписываются в лист.
  const arrToFill = Array.from({ length: rowsCount }, () =>
    Array.from({ length: colsCount }, () => "")
  );

  //Очищаем предыдущие анализированные значения
  cleanAnalyzedProps(
    getHeaderRows(sheet, headerRowIndex),
    sheet
  );

  //Заполняем строку с данными поставщика
  if (res.supplier) {
    fillRowProps(
      res.supplier,
      headerRowIndex,
      sheet,
      supplierDataRowIndex,
      arrToFill
    );
  }

  //Если в результатах анализа есть свойства, присутствующие в сгруппированных свойствах поставщика, то заменяем их имена на имена сгруппированных свойств
  const rows = prepareAnalyzedProps(res.rows, res.supplier.props);
  //Заполняем строки с результатами анализа
  fillAnalyzedProps(req.rows, rows, headerRowIndex, sheet, arrToFill);

  const startFrom = cutArrayToFill(arrToFill, headerRowIndex);
  if (arrToFill.length > 0) {
    sheet
      .getRange(1, startFrom + 1, arrToFill.length, arrToFill[0].length)
      .setValues(arrToFill);
  }

  mergeAndFixCats(sheet, headerRowIndex);

  //Возвращаем результаты анализа и входные данные. Для отладки
  return { res, req, arrToFill, makerId, modelId, supplierId, url, requestData };
};

/**
 * Возвращает максимальный индекс строки в дереве
 * @param {{rowIndex: number, subs: {rowIndex: number}[]}[]} rows
 * @returns {number}
 */
const getMaxRowIndex = (rows) => {
  return rows.reduce((max, row) => {
    const maxIndex = Math.max(max, row.rowIndex || 0);
    if (row.subs) {
      const subsMaxIndex = getMaxRowIndex(row.subs);
      return Math.max(maxIndex, subsMaxIndex);
    }
    return maxIndex;
  }, 0);
};

/**
 * Обрезает массив arrToFill по пустым колонкам в строке headerRowIndex
 * @param {number[][]} arrToFill - Массив с данными
 * @param {number} headerRowIndex - Индекс строки с заголовками
 * @returns {number} - Индекс первой не пустой колонки
 */
const cutArrayToFill = (arrToFill, headerRowIndex) => {
  const header = arrToFill[headerRowIndex];
  const start = header.findIndex((x) => x !== "");
  let end = 0;
  for (let i = start; i < header.length; i++) {
    if (header[i] === "") {
      end = i;
      break;
    }
  }
  for (let i = 0; i < arrToFill.length; i++) {
    arrToFill[i] = arrToFill[i].slice(start, end);
  }
  return start;
};

/**
 * Подготавливает категории данных анализа для заполенения в группированные категории
 * @param {{props: {name: string, value: string}[]}[]} data - Данные анализа
 * @param {{name: string, value: string}[]}[]} suppliesProps - Свойства поставщика
 * @returns {{props: {name: string, value: string}[]}[]} - Подготовленные данные
 */
const prepareAnalyzedProps = (data, suppliesProps = []) => {
  return data.map((row) => {
    return {
      ...row,
      props: row.props.map((prop) => {
        const groupedName = `${prop.name}${groupedPropNameSeparator}значение`;
        if (suppliesProps.some((x) => x.name === groupedName)) {
          return {
            ...prop,
            name: groupedName,
          };
        }
        return prop;
      }),
      ...(row.subs
        ? { subs: prepareAnalyzedProps(row.subs, suppliesProps) }
        : {}),
    };
  });
};

const fillAnalyzedProps = (
  data,
  analyzed,
  headerRowIndex,
  sheet,
  arrToFill
) => {
  for (const row of data) {
    const { rowIndex, name, subs } = row;
    const analyzedRow = analyzed.find((x) => name === x.name);
    if (analyzedRow) {
      fillRowProps(analyzedRow, headerRowIndex, sheet, rowIndex, arrToFill);
      if (analyzedRow.subs && subs) {
        fillAnalyzedProps(
          subs,
          analyzedRow.subs,
          headerRowIndex,
          sheet,
          arrToFill
        );
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
const fillRowProps = (
  { props },
  headerRowIndex,
  sheet,
  rowIndex,
  arrToFill
) => {
  //Индексы строк с заголовками
  const firstHeaderRowIndex = headerRowIndex;
  const secondHeaderRowIndex = headerRowIndex + 1;

  //Если нет свойств, то выходим
  if (!props || props.length === 0) return;

  for (let prop of props) {
    //Строки с заголовками
    let firstHeaderRow = arrToFill[firstHeaderRowIndex - 1];
    let secondHeaderRow = arrToFill[secondHeaderRowIndex - 1];
    // let [firstHeaderRow, secondHeaderRow] = getHeaderRows(
    //   sheet,
    //   headerRowIndex
    // );

    //Названия свойств. Например ['Категория', 'Значение1'] из 'Категория|Значение1'
    const propNames = prop.name.split(groupedPropNameSeparator);
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
        //Заполняем виртуальную таблицу
        arrToFill[firstHeaderRowIndex - 1][catColIndex] = firstPropName;
        //Обновляем строки с заголовками
        firstHeaderRow = arrToFill[firstHeaderRowIndex - 1];
        secondHeaderRow = arrToFill[secondHeaderRowIndex - 1];
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
            secondCatColIndex = i;
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
      //Заполняем виртуальную таблицу
      arrToFill[secondHeaderRowIndex - 1][secondCatColIndex] =
        secondPropNameCat;

      //Устанавливаем значение свойства в найденную или добавленную колонку
      //sheet.getRange(rowIndex, secondCatColIndex + 1).setValue(prop.value);
      //Заполняем виртуальную таблицу
      arrToFill[rowIndex - 1][secondCatColIndex] = prop.value;
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
        //Заполняем виртуальную таблицу
        arrToFill[secondHeaderRowIndex - 1][propColIndex] = propNameCat;
        sheet
          .getRange(firstHeaderRowIndex, propColIndex + 1)
          .setValue(emptyCategorySymbol);
        //Заполняем виртуальную таблицу
        arrToFill[firstHeaderRowIndex - 1][propColIndex] = emptyCategorySymbol;
      }
      //sheet.getRange(rowIndex, propColIndex + 1).setValue(prop.value);
      //Заполняем виртуальную таблицу
      arrToFill[rowIndex - 1][propColIndex] = prop.value;
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

  const maxWidth = maxCharsInPropName * oneCharWidth;
  // Корректируем ширину колонок в соответствии с диапозонами для корректировки ширины
  for (const { start, length } of toFix) {
    const colWidth =
      length > 1 //Если диапазон объединения больше 1, то берем ширину первой колонки
        ? firstHeaderRow[start - 1].length * oneCharWidth
        : secondHeaderRow[start - 1].length * oneCharWidth; //Принимаем ширину одного символа за 9px
    for (let i = start; i < start + length; i++) {
      sheet.setColumnWidth(
        i,
        Math.min(maxWidth, Math.round(colWidth / length))
      );
    }
  }

  //Переносим текст во второй строке заголовка
  sheet
    .getRange(firstHeaderRowIndex + 1, 1, 1, sheet.getLastColumn())
    .setWrap(true);
  sheet.autoResizeRows(firstHeaderRowIndex + 1, 1);

  //Объединяем строки заголовков, если они содержат пустую категорию
  for (let i = 0; i < sheet.getLastColumn(); i++) {
    const catCell = sheet.getRange(firstHeaderRowIndex, i + 1);
    const prop = catCell.getValue();
    if (prop.includes(emptyCategorySymbol)) {
      catCell.setValue("");
      sheet.getRange(firstHeaderRowIndex, i + 1, 2, 1).merge();
    }
  }
};

const cleanAnalyzedProps = (headerRows, sheet) => {
  let first = headerRows[0].findIndex((x) => x.includes(analyzedSymbol));
  let second = headerRows[1].findIndex((x) => x.includes(analyzedSymbol));
  const start = first !== -1 && second !== -1 ? Math.min(first, second) : first !== -1 ? first : second !== -1 ? second : -1;
  const end = sheet.getLastColumn();
  if (start !== -1) {
    sheet.deleteColumns(start + 1, end - start);
  }
};
