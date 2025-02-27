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
    fillSupplierProps(
      res.supplier,
      headerRowIndex,
      sheet,
      supplierDataRowIndex
    );
  }
};

const supplierDataRowIndex = 2;

const fillSupplierProps = ({ props }, headerRowIndex, sheet, rowIndex) => {
  const firstHeaderRowIndex = headerRowIndex;
  const secondHeaderRowIndex = headerRowIndex + 1;
  for (let prop of props) {
    let [firstHeaderRow, secondHeaderRow] = sheet
      .getRange(headerRowIndex, 1, 2, sheet.getLastColumn())
      .getValues();
    const propNames = prop.name.split("|");
    if (propNames.length === 2) {
      const firstPropName = propNames[0];

      let catColIndex = headerIndex(firstHeaderRow, firstPropName);
      if (catColIndex === -1) {
        catColIndex = sheet.getLastColumn();
        sheet.insertColumnAfter(catColIndex);
        sheet
          .getRange(firstHeaderRowIndex, catColIndex + 1)
          .setValue(firstPropName);
        [firstHeaderRow, secondHeaderRow] = sheet
          .getRange(headerRowIndex, 1, 2, sheet.getLastColumn())
          .getValues();
      }
      const secondPropName = propNames[1];
      let secondCatColIndex = catColIndex;
      const propColName = secondHeaderRow[secondCatColIndex];
      if (propColName && propColName !== secondPropName) {
        sheet.insertColumnAfter(secondCatColIndex + 1);
        secondCatColIndex++;
      }
      sheet
        .getRange(secondHeaderRowIndex, secondCatColIndex + 1)
        .setValue(secondPropName);
      sheet.getRange(rowIndex, secondCatColIndex + 1).setValue(prop.value);
    } else if (propNames.length === 1) {
      let propColIndex = headerIndex(secondHeaderRow, propNames[0]);
      if (propColIndex === -1) {
        sheet.insertColumnAfter(propColIndex + 1);
        sheet
          .getRange(secondHeaderRowIndex, propColIndex + 1)
          .setValue(propNames[0]);
        propColIndex++;
      }
      sheet.getRange(rowIndex, propColIndex + 1).setValue(prop.value);
    }
  }
};
