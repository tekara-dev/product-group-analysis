const getActiveTable = () => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return getTable(spreadsheet.getActiveSheet().getName());
};

const getTableInfoData = (sheetName) => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);

  const data = sheet.getDataRange().getValues();

  const start = data.findIndex((row) => row[0].trim() === "No.");
  if (data.length < start + 1) return [];

  const headerRow = data[start];
  const partColumnIndex = headerRow.findIndex((col) => col.trim() === "Part");
  return { data, start, headerRow, partColumnIndex };
};

const getTable = (sheetName) => {
  const { data, start, headerRow, partColumnIndex } =
    getTableInfoData(sheetName);

  const leafs = [];

  //Собираем листья
  for (let i = start + 1; i < data.length; i++) {
    const row = data[i];
    //пропускаем категории
    if (!rowIsPart(row, partColumnIndex)) continue;

    leafs.push({
      name: row[partColumnIndex],
      rowIndex: i,
      isLeaf: true,
      cats: getRowParent(data, i, partColumnIndex, start),
      props: getProps(row, partColumnIndex, headerRow),
    });
  }

  //Сворачиваем листья в дерево
  const res = [];
  for (let i = 0; i < leafs.length; i++) {
    const leaf = leafs[i];
    pushToTree(leaf, res, data, partColumnIndex, headerRow);
  }

  //Дооснащаем дерево всеми другими категориями
  for (const cat of res) {
    fillCatsLevel(cat, 2, data, partColumnIndex, headerRow);
  }

  return prepareData(res);
};

const getParentName = (row, level) => {
  for (let i = level; i > 0; i--) {
    if (row[i]) return row[i];
  }
  return "";
};

const fillCatsLevel = (cat, level, data, partColumnIndex, headerRow) => {
  if (cat.isLeaf) return;

  for (let i = cat.rowIndex + 1; i < data.length; i++) {
    const row = data[i];
    const n = row[level];
    if (!n) {
      let pName = getParentName(row, level - 1);
      if (pName) break; //Если строка уровнем выше - выходим

      continue;
    }

    if (cat.subs.some((x) => x.name === n)) continue;

    cat.subs.push({
      name: n,
      rowIndex: i,
      subs: [],
      props: getProps(row, partColumnIndex, headerRow),
    });
  }

  for (const sub of cat.subs) {
    fillCatsLevel(sub, level + 1, data, partColumnIndex, headerRow);
  }
};

const pushToTree = (leaf, tree, data, partColumnIndex, headerRow) => {
  leaf.cats.reduce((to, cat, i) => {
    let found = to.find((x) => x.name === cat.name);

    if (!found) {
      found = {
        ...cat,
        subs: [],
        props: getProps(data[cat.rowIndex], partColumnIndex, headerRow),
      };
      to.push(found);
    }

    if (i === leaf.cats.length - 1) {
      found.subs.push(leaf);
    }

    return found.subs;
  }, tree);
};

const getRowParent = (data, rowIndex, partColumnIndex, headerRowIndex) => {
  const cat = [];

  let colIndex = partColumnIndex - 1;
  for (let i = rowIndex - 1; i > headerRowIndex; i--) {
    if (colIndex < 1) break; //Конец списка

    const n = data[i][colIndex];
    if (!n) {
      //Первая строка
      if (i === headerRowIndex - 1) {
        i = rowIndex - 1;
        colIndex--;
      }
      continue;
    }
    //нашли
    rowIndex = i;
    colIndex--;
    cat.push({ name: n, rowIndex: i });
  }
  cat.reverse();

  return cat;
};

const rowIsPart = (row, partColumnIndex) => {
  return row.length > partColumnIndex && !!row[partColumnIndex];
};

const getProps = (row, partColumnIndex, headerRow) => {
  if (row.length < partColumnIndex + 1) return [];

  let res = [];
  for (let i = partColumnIndex + 1; i < headerRow.length; i++) {
    const val = row.length < i ? undefined : row[i];
    if (!val) continue;
    if (headerRow[i].indexOf("*") > -1) continue;

    res.push({ name: headerRow[i], value: val });
  }
  return res;
};

const selectRow = (row) => {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
  range.activate();
};

const prepareData = (level) => {
  const res = level.map(({ name, isLeaf, rowIndex, subs, props = [] }) => ({
    name,
    isPart: !!isLeaf,
    rowIndex,
    subs: subs ? prepareData(subs) : undefined,
    props: props.length > 0 ? props : undefined,
  }));
  return res;
};

const fillTestProps = (level, amount) => {
  if (!level) return;
  for (let i = 0; i < level.length; i++) {
    const leaf = level[i];
    if (!leaf.props) leaf.props = [];

    new Array(amount).fill(undefined).forEach((_, i) => {
      leaf.props.push({
        name: `* Prop${i + 1}`,
        value: Math.round(Math.random() * 100),
      });
    });
    if (leaf.subs) fillTestProps(leaf.subs, amount);
  }
};

const headerIndex = (headerCol, name) => {
  for (let i = 0; i < headerCol.length; i++) {
    if (headerCol[i] === name) return i;
  }
  return -1;
};

const fillAnalyzedTable = (level, headerRow, headerRowIndex, sheet) => {
  for (let node of level) {
    if (!node.props) continue;

    for (let prop of node.props) {
      let colIndex = headerIndex(headerRow, prop.name);
      if (colIndex === -1) {
        colIndex = headerRow.length;
        headerRow.push(prop.name);
        sheet.getRange(headerRowIndex + 1, colIndex + 1).setValue(prop.name);
      }

      sheet.getRange(node.rowIndex + 1, colIndex + 1).setValue(prop.value);
    }

    if (node.subs)
      fillAnalyzedTable(node.subs, headerRow, headerRowIndex, sheet);
  }
};

const testAnalyze = () => {
  const treeData = getActiveTable();

  //Send to @pokoynik here

  //Это мы получили с сервера
  fillTestProps(treeData, 5);

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  const { headerRow, start } = getTableInfoData(sheet.getName());

  fillAnalyzedTable(treeData, headerRow, start, sheet);
};
