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
  const headerRow = getHeaderRows(sheet, headerRowIndex)[1];
  cleanAnalyzedProps(headerRow, sheet);
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
  const auth = postAuthMe();
  if (!auth || !auth.id)
    return showBaseMenu("auth/auth", { from: "analyze/analyze" });

  showBaseMenu("analyze/analyze");
};

const showApiSettingsMenu = () => {
  showBaseMenu("apiSettings/apiSettings");
};

const showSetPriceMenu = () => {
  const auth = postAuthMe();
  if (!auth || !auth.id)
    return showBaseMenu("auth/auth", { from: "setPrice/setPrice" });

  showBaseMenu("setPrice/setPrice");
};
const showSettingsMenu = () => {
  const auth = postAuthMe();
  if (!auth || !auth.id)
    return showBaseMenu("auth/auth", { from: "settings/settings" });

  showBaseMenu("settings/settings");
};

const showNavigationMenu = () => {
  const auth = postAuthMe();
  if (!auth || !auth.id)
    return showBaseMenu("auth/auth", { from: "navigation/navigation" });

  showBaseMenu("navigation/navigation");
};

const showAuthMenu = () => {
  const auth = postAuthMe();
  if (!auth || !auth.id)
    return showBaseMenu("auth/auth", { from: "auth/auth" });

  showBaseMenu("auth/auth");
};
