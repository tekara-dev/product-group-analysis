///<reference path="analyze/analyze.js" />

const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Tekara: Аналитика")
    .addItem("Настройки API", "showApiSettingsMenu")
    .addSeparator()
    .addItem("Авторизация", "showAuthMenu")
    .addItem("Настройки листа", "showSettingsMenu")
    .addItem("Оглавление", "showNavigationMenu")
    .addSeparator()
    .addItem("Анализ листа", "showAnalizeMenu")
    .addItem("Очистить данные анализа", "clearAnalizeData")
    .addSeparator()
    .addItem("Заполнение цен", "showSetPriceMenu")
    .addItem("Очистить цены поставщика", "clearPrices")
    .addSeparator()
    .addItem("Сгруппировать лист", "groupActiveList")
    .addItem("Убрать группировку", "unGroupAll")
    .addToUi();
};

const getContent = (filename) => {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch {
    return "";
  }
};

const clearAnalizeData = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { start: headerRowIndex } = getTableInfoData(sheet.getName());

  cleanAnalyzedProps(getHeaderRows(sheet, headerRowIndex), sheet);
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

  PropertiesService.getScriptProperties().setProperty(
    "selectionData",
    JSON.stringify(data)
  );
};

const getSelectionData = () => {
  const data =
    PropertiesService.getScriptProperties().getProperty("selectionData");
  return JSON.parse(data || "{}");
};

const showBaseMenu = (page, other) => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = page;
  html.other = other;
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const showAnalizeMenu = () => {
  return showBaseMenu("auth/auth", { from: "analyze/analyze" });
};

const showApiSettingsMenu = () => {
  showBaseMenu("apiSettings/apiSettings");
};

const showSetPriceMenu = () => {
  return showBaseMenu("auth/auth", { from: "setPrice/setPrice" });
};
const showSettingsMenu = () => {
  return showBaseMenu("auth/auth", { from: "settings/settings" });
};

const showNavigationMenu = () => {
  return showBaseMenu("auth/auth", { from: "navigation/navigation" });
};

const showAuthMenu = () => {
  showBaseMenu("auth/auth");
};
