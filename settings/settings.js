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

const setCellValue = (name, value) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = Cells[name];
  if (!range) return;

  const cell = sheet.getRange(range[0], range[1]);
  if (!cell) return;
  cell.setValue(value);
};

const getMakers = () => getApiPoint("https://offers-moder-api.tkr.dev/api/catalog/makers");
const getCategories = () =>
  getApiPoint("https://offers-moder-api.tkr.dev/api/catalog/categories");
const getModels = (makerId, categoryId) =>
  getApiPoint(`https://offers-moder-api.tkr.dev/api/catalog/models?makerId=${makerId}&categoryId=${categoryId}`);
