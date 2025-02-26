const getCustomParams = () => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Настройки");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};

  return data.reduce((res, item) => {
    if (item.length < 2) return res;
    if (!isNum(item[0])) return res;

    res.push({
      num: item[0],
      name: item[1],
      value: item.length > 2 ? item[2] : undefined,
      comment: item[3],
    });

    return res;
  }, []);
};

const isNum = (val) => typeof val === "number" || !isNaN(Number(val));
