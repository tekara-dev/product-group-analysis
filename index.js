const Cells = {
  CellMaker: [2, 2],
  CellCategory: [2, 3],
  CellModel: [2, 4],
  CellCustomModel: [2, 5],
};

const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Tekara: Аналитика")
    .addItem("Настройки листа", "showSettingsMenu")
    .addItem("Оглавление", "showNavigationMenu")
    .addItem("Анализ листа", "showAnalizeMenu")
    .addToUi();
};

const getContent = (filename) => {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch {
    return "";
  }
};

const onSelectionChange = (e) => {
  const sheetName = e.range.getSheet().getName();
  const range = e.range.getA1Notation();
  const data = {
    sheetName: sheetName,
    range: range,
    timestamp: new Date().toISOString(),
    settings: getSettings(),
  };

  // Save data to PropertiesService
  PropertiesService.getScriptProperties().setProperty(
    "selectionData",
    JSON.stringify(data)
  );
};

// Function to fetch stored selection data
function getSelectionData() {
  const data =
    PropertiesService.getScriptProperties().getProperty("selectionData");
  return JSON.parse(data || "{}");
}

const showAnalizeMenu = () => {
    const html = HtmlService.createTemplateFromFile("base");
    html.page = "analyze";
    const output = html.evaluate();
    SpreadsheetApp.getUi().showSidebar(output);
  };

const showSettingsMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "settings";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const showNavigationMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "navigation";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const getApiPoint = (point) => {
  const apiUrl = point;
  const resp = UrlFetchApp.fetch(apiUrl);
  const text = resp.getContentText();
  return JSON.parse(text);
};

const getSettings = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  return getSheetSettings(sheet);
};

const getSheetSettings = (sheet) => {
  const isDataList =
    sheet.getRange(Cells.CellMaker[0] - 1, Cells.CellMaker[1]).getValue() ===
    "Производитель:";

  if (!isDataList) return { sheet: sheet.getName(), isDataList: false };

  const makerCell = sheet.getRange(Cells.CellMaker[0], Cells.CellMaker[1]);
  const maker = makerCell.getValue();
  const categoryCell = sheet.getRange(
    Cells.CellCategory[0],
    Cells.CellCategory[1]
  );
  const category = categoryCell.getValue();
  const modelCell = sheet.getRange(Cells.CellModel[0], Cells.CellModel[1]);
  const model = modelCell.getValue();
  const modelCustomCell = sheet.getRange(
    Cells.CellCustomModel[0],
    Cells.CellCustomModel[1]
  );
  const modelCustom = modelCustomCell.getValue();

  return {
    maker,
    category,
    model,
    modelCustom,
    sheet: sheet.getName(),
    isDataList: true,
  };
};

const navigateToSheet = (name) => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    Logger.log("Sheet not found: " + name);
    return;
  }

  spreadsheet.setActiveSheet(sheet);
};

const getNavigationTree = () => {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const settings = sheets
    .map((x) => getSheetSettings(x))
    .filter((x) => x !== undefined);

  let grouped = groupBy(settings, "maker");
  for (let i = 0; i < grouped.length; i++) {
    arr = grouped[i];
    if (!arr.items) continue;

    arr.items = groupBy(arr.items, "category");
  }
  return grouped;
};

const setCellValue = (name, value) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = Cells[name];
  if (!range) return;

  const cell = sheet.getRange(range[0], range[1]);
  if (!cell) return;
  cell.setValue(value);
};

const getMakers = () => getApiPoint("https://mma-api.tekara.ru/api/maker");
const getCategories = () =>
  getApiPoint("https://mma-api.tekara.ru/api/category");
const getModels = (makerId, categoryId) =>
  getApiPoint(`https://mma-api.tekara.ru/api/model/${makerId}/${categoryId}`);

const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!group) {
      result.push({ name: item.sheet });
      return result;
    }
    let added = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i].name !== group) continue;

      result[i].items.push(item);
      added = true;
    }
    if (!added) {
      result.push({ name: group, items: [item] });
    }
    return result;
  }, []);
};
