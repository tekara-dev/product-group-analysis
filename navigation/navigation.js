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
