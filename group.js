const getRangesPropKey = (sheet) => {
  return sheet.getSheetId() + "_groupRanges";
};
const groupActiveList = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const { data, start, headerRow, partColumnIndex } = getTableInfoData(
    sheet.getName()
  );

  const groupKey = getRangesPropKey(sheet);

  const ranges = getDocProps(groupKey) || [];
  if (ranges.length > 0) return;

  for (let level = 1; level < partColumnIndex; level++) {
    let groupStart = start + 1;
    for (let rowIndex = groupStart; rowIndex < data.length; rowIndex++) {
      const name = data[rowIndex][level];
      const parentName = getParentName(data[rowIndex], level);

      if (name || parentName || rowIndex === data.length - 1) {
        if (rowIndex > groupStart) {
          const end = rowIndex === data.length - 1 ? rowIndex + 1 : rowIndex;
          ranges.push([groupStart + 1, end]);
          sheet.getRange(`${groupStart + 1}:${end}`).shiftRowGroupDepth(1);
        }

        groupStart = rowIndex + 1;
      }
    }
  }

  setDocProps(groupKey, ranges);
};

const unGroupRanges = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const ranges = getDocProps(getRangesPropKey(sheet)) || [];

  Logger.log(ranges);

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    sheet.getRange(`${range[0]}:${range[1]}`).shiftRowGroupDepth(-1);
  }

  setDocProps(getRangesPropKey(sheet), []);
};

const unGroupAll = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const ranges = getDocProps(getRangesPropKey(sheet)) || [];
  if (ranges.length > 0) {
    unGroupRanges();
    return;
  }

  const lastRow = sheet.getLastRow();

  let hasGroups = true;

  while (hasGroups) {
    for (let i = 1; i <= lastRow; i++) {
      const depth = sheet.getRowGroupDepth(i);
      if (depth > 0) {
        sheet.getRowGroup(i, depth).remove();
        continue;
      }
    }

    break;
  }
};
