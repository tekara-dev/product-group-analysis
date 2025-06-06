const Cells = {
  CellMaker: [2, 2],
  CellCategory: [2, 3],
  CellModel: [2, 4],
  CellCustomModel: [2, 5],
};

const getSettings = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  return getSheetSettings(sheet);
};

const getSheetSettings = (sheet) => {
  const isDataList = sheet
    .getRange(Cells.CellMaker[0] - 1, Cells.CellMaker[1])
    .getValue()
    .includes("Производитель");

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

const getSheetSettingsKey = (sheetName) => `${sheetName}_listSettings`;

const storeSheetSettings = (makerId, categoryId, modelId) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet()
    .getName();
  const settings = getStoredSheetSettings();
  //Сохраняем только те настройки, которые поданы в метод. Для того чтобы можно было обновлять только часть настроек
  if (makerId) {
    settings.makerId = makerId;
  }
  if (categoryId) {
    settings.categoryId = categoryId;
  }
  if (modelId) {
    settings.modelId = modelId;
  }
  setDocProps(getSheetSettingsKey(sheet), settings);
};

const getStoredSheetSettings = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet()
    .getName();
  return getDocProps(getSheetSettingsKey(sheet)) || {};
};

const setCellValue = (name, value) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = Cells[name];
  if (!range) return;

  const cell = sheet.getRange(range[0], range[1]);
  if (!cell) return;
  cell.setValue(value);

  if (name === "CellMaker" || name === "CellCustomModel") {
    syncSheetName(sheet);
  }
};

const docHasSheetNotSelf = (doc, sheet, name) => {
  const found = doc.getSheetByName(name);
  if (!found) return false;
  if (found.getName() === sheet.getName()) return false;

  return true;
};

const syncActiveSheenName = () => {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  return syncSheetName(doc.getActiveSheet());
};

const syncSheetName = (sheet) => {
  const doc = SpreadsheetApp.getActiveSpreadsheet();

  const makerCell = sheet.getRange(Cells.CellMaker[0], Cells.CellMaker[1]);
  const maker = makerCell.getValue();

  const modelCell = sheet.getRange(Cells.CellModel[0], Cells.CellModel[1]);
  const model = modelCell.getValue();

  const customModelCell = sheet.getRange(
    Cells.CellCustomModel[0],
    Cells.CellCustomModel[1]
  );
  const customModel = customModelCell.getValue();

  let name = [maker, customModel || model || "Без модели"]
    .filter((x) => !!x)
    .join("-");
  if (!name)
    name = Math.round(Math.random() * 99999)
      .toString(32)
      .slice(2);
  let nameToSet = name;
  let it = 1;
  let hasSheet = docHasSheetNotSelf(doc, sheet, name);
  while (hasSheet) {
    it++;
    nameToSet = `${name} (${it})`;
    hasSheet = docHasSheetNotSelf(doc, sheet, nameToSet);
  }
  sheet.setName(nameToSet);
};

const getMakers = () =>
  getOffersApiPoint("/catalog/makers");
const getCategories = () =>
  getOffersApiPoint("/catalog/categories");
const getModels = (makerId, categoryId) =>
  getOffersApiPoint(
    `/catalog/models?makerId=${makerId}&categoryId=${categoryId}`
  );
