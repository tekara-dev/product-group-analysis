const getCustomParams = () => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Настройки");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};

  return data.slice(1).reduce((res, item) => {
    if (item.length < 2) return;

    res[item[1]] = {
      num: item[0],
      value: item.length > 2 ? item[2] : undefined,
      comment: item[3],
    };
    
    return res;
  }, {});
};
