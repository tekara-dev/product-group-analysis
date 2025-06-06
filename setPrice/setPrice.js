///<reference path="../auth/auth.js" />
///<reference path="../lib/api.js" />

const getPrices = async (supplierId) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { data, start, partColumnIndex } = getTableInfoData(sheet.getName());
  const partNumbers = (
    sheet
      .getRange(start + 2, partColumnIndex + 2, data.length - start - 1, 1)
      .getValues()
      .map((x) => x[0]) || []
  ).filter((x) => x);

  const res = await getOffersApiPoint(
    `/priceAnalyzer/pricesForPartNumbers?supplierId=${supplierId}`,
    "POST",
    partNumbers
  );

  const colIndex = data[start].findIndex((x) => x === "Валюта 🔒");
  const arrToFill = Array.from({ length: data.length - start - 1 }, () =>
    Array.from({ length: 2 }, () => "")
  );

  //Очищаем столбцы с ценами и валютой
  sheet
    .getRange(start + 2, colIndex + 1, data.length - start - 1, 2)
    .setValues(arrToFill);

  //Заполняем виртуальную таблицу с ценами и валютой
  for (let i = 0; i < res.length; i++) {
    const { partNumber, price, currency } = res[i];
    const rowIndex = data.findIndex(
      (x) => x[partColumnIndex + 1] === partNumber
    );
    if (rowIndex === -1) continue;
    arrToFill[rowIndex - start - 1][1] = price;
    arrToFill[rowIndex - start - 1][0] = currency;
  }

  //Заполняем столбцы с ценами и валютой
  sheet
    .getRange(start + 2, colIndex + 1, data.length - start - 1, 2)
    .setValues(arrToFill);

  return { res, arrToFill };
};

const getPricesStub = (partNumbers) => {
  return partNumbers.map((x) => ({
    partNumber: x,
    price: Math.floor(Math.random() * 10000),
    currency: "RUB",
  }));
};

const clearPrices = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { data, start } = getTableInfoData(sheet.getName());
  const colIndex = data[start].findIndex((x) => x === "Валюта 🔒");
  if (colIndex === -1) return;
  sheet
    .getRange(start + 2, colIndex + 1, data.length - start - 1, 2)
    .clearContent();
};
