const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Tekara: Аналитика")
    .addItem("Авторизация", "showAuthMenu")
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

const showAnalizeMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "analyze/analyze";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const showSettingsMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "settings/settings";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const showNavigationMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "navigation/navigation";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};

const showAuthMenu = () => {
  const html = HtmlService.createTemplateFromFile("base");
  html.page = "auth/auth";
  const output = html.evaluate();
  SpreadsheetApp.getUi().showSidebar(output);
};
