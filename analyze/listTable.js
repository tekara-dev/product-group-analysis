const getActiveTable = (withRowIndex) => {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return getTable(spreadsheet.getActiveSheet().getName(), withRowIndex);
};
const getValidatedActiveTable = () => {
  const table = getActiveTable(true);
  const errors = validateTree(table);
  return { table, errors };
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

const getBaseTree = () => {
  const { data, start, headerRow } = getTableInfoData("Эталон");

  const partColumnIndex =
    headerRow.findIndex(
      (col) => !["No.", "Group", "Sub-group", ""].includes(col.trim())
    ) - 1;

  const res = [];
  //Собираем категории верхнего уровня
  for (let rowIndex = start + 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const name = row[1];
    if (!name) continue;

    const cat = {
      name,
      rowIndex,
      subs: [],
      props: getProps(row, partColumnIndex, headerRow),
    };

    fillCatsLevel(cat, 2, data, partColumnIndex, headerRow, true);

    res.push(cat);
  }
  return res;
};

const getTable = (sheetName, withRowIndex) => {
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
      rowIndex: i+1,
      isLeaf: true,
      partNumber: row[partColumnIndex + 1],
      cats: getRowParent(data, i, partColumnIndex, start),
      props: getProps(row, partColumnIndex, headerRow),
    });
  }

  //Сворачиваем листья в дерево
  const res = getBaseTree();

  //Устанавливаем правильные индексы строк
  for (let cat of res) {
    fillRowIndex(cat, 1, start, data);
  }

  //Дооснащаем дерево всеми другими категориями
  for (const cat of res) {
    fillCatsLevel(cat, 2, data, partColumnIndex, headerRow);
  }

  for (let i = 0; i < leafs.length; i++) {
    const leaf = leafs[i];
    hydrateTree(leaf, res, data, partColumnIndex, headerRow);
  }

  return prepareData(res, withRowIndex);
};

const fillRowIndex = (cat, level, fromRow, data) => {
  const rowIndex =
    data.findIndex((row, i) => i >= fromRow && row[level] === cat.name) + 1;
  cat.rowIndex = rowIndex;
  for (let item of cat.subs) {
    fillRowIndex(item, level + 1, cat.rowIndex, data);
  }
};

const getParentName = (row, level) => {
  for (let i = level; i > 0; i--) {
    if (row[i]) return row[i];
  }
  return "";
};

const fillCatsLevel = (
  cat,
  level,
  data,
  partColumnIndex,
  headerRow,
  isBase
) => {
  if (cat.isLeaf || level === partColumnIndex + (isBase ? 1 : 0)) return;

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
    fillCatsLevel(sub, level + 1, data, partColumnIndex, headerRow, isBase);
  }
};

const hydrateProps = (node, props) => {
  const res = [...(node.props || [])];

  for (const p of props) {
    let found = res.find((x) => x.name === p.name);
    if (!found) {
      found = { ...p };
      node.props.push(found);
    }
    if (p.value) found.value = p.value;
  }
  return res;
};

const hydrateTree = (leaf, tree, data, partColumnIndex, headerRow) => {
  leaf.cats.reduce((to, cat, i) => {
    let found = to.find((x) => x.name === cat.name);

    if (!found) {
      found = {
        ...cat,
        subs: [],
        props: getProps(data[cat.rowIndex], partColumnIndex, headerRow),
      };
      to.push(found);
    } else {
      found.props = hydrateProps(
        found,
        getProps(data[cat.rowIndex], partColumnIndex, headerRow)
      );
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
  return (
    partColumnIndex > -1 &&
    row.length > partColumnIndex &&
    !!row[partColumnIndex]
  );
};

const getProps = (row, partColumnIndex, headerRow) => {
  if (row.length < partColumnIndex + 1) return [];

  let res = [];
  for (let i = partColumnIndex + 1; i < headerRow.length; i++) {
    const val = row.length < i ? undefined : row[i];
    if (!val) continue;
    const hv = headerRow[i].replace("⁕", "").trim();
    if (hv.indexOf("*") === 0) continue;
    if (hv.indexOf("🔒") > -1) continue;
    if (hv === "Part number") continue;

    res.push({ name: hv, value: val });
  }
  return res;
};

const selectRow = (row) => {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
  range.activate();
};

const prepareData = (level, withRowIndex) => {
  const noObj = {};
  const res = level.map(
    ({ name, isLeaf, rowIndex, subs, props = [], partNumber }) => ({
      name,
      type: isLeaf ? "Part" : "Category",
      ...(partNumber ? { partNumber } : noObj),
      ...(withRowIndex ? { rowIndex } : noObj),
      ...(subs ? { subs: prepareData(subs, withRowIndex) } : noObj),
      ...(props.length > 0 ? { props } : noObj),
    })
  );
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
