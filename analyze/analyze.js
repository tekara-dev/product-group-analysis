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

// const testRunAnalyze = () => {};

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

  const validateNode = ({ type, partNumber, rowIndex, name, props = [], subs }) => {
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

const runAnalyze = async () => {
  const treeData = getActiveTable();
  const req = {
    settings: getCustomParams(),
    rows: treeData,
  };

  const { makerId, modelId } = getStoredSheetSettings();
  const supplierId = getStoredSupplierId();

  const errors = validateTree(treeData);
  if (errors.length > 0) {
    return { error: "Есть ошибки в дереве", errors };
  }

  const res = await postAnalyze(req, makerId, modelId, supplierId);
  const a = "";
  return res;

  //Send to @pokoynik here

  //   //Это мы получили с сервера
  //   fillTestProps(treeData, 5);

  //   var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  //   var sheet = spreadsheet.getActiveSheet();
  //   const { headerRow, start } = getTableInfoData(sheet.getName());

  //   fillAnalyzedTable(treeData, headerRow, start, sheet);
};

const fillAnalyzedTable = (level, headerRow, headerRowIndex, sheet) => {
  for (let node of level) {
    if (!node.props) continue;

    for (let prop of node.props) {
      let colIndex = headerIndex(headerRow, prop.name);
      if (colIndex === -1) {
        colIndex = headerRow.length;
        headerRow.push(prop.name);
        sheet.getRange(headerRowIndex + 1, colIndex + 1).setValue(prop.name);
      }

      sheet.getRange(node.rowIndex + 1, colIndex + 1).setValue(prop.value);
    }

    if (node.subs)
      fillAnalyzedTable(node.subs, headerRow, headerRowIndex, sheet);
  }
};
