const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Tekara: Аналитика")
    .addItem("Начать", "showAnalyticsMenu")
    .addToUi();
};

const include = (filename) => {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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

const showAnalyticsMenu = () => {
  const html = HtmlService.createHtmlOutputFromFile("analyticsMenu")
    .setTitle("Tekara: Аналитика")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showSidebar(html);
};

const getApiPoint = (point) => {
  const apiUrl = point;
  const resp = UrlFetchApp.fetch(apiUrl);
  const text = resp.getContentText();
  return JSON.parse(text);
};

const getSettings = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const makerCell = sheet.getRange("CellMaker");
  const maker = makerCell ? makerCell.getValue() : undefined;
  const categoryCell = sheet.getRange("CellCategory");
  const category = categoryCell ? categoryCell.getValue() : undefined;
  const modelCell = sheet.getRange("CellModel");
  const model = modelCell ? modelCell.getValue() : undefined;

  return { maker, category, model };
};

const setCellValue = (name, value) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const cell = sheet.getRange(name);
  if (!cell) return;
  cell.setValue(value);
};

const getMakers = () => getApiPoint("https://mma-api.tekara.ru/api/maker");
const getCategories = () =>
  getApiPoint("https://mma-api.tekara.ru/api/category");
const getModels = (makerId, categoryId) =>
  getApiPoint(`https://mma-api.tekara.ru/api/model/${makerId}/${categoryId}`);
