(async () => {
  const treeCnt = document.getElementById("tree");

  const getTreeSettings = async () => {
    const loaderText = "Загружаем структуру";
    addLoader(loaderText);
    let result;
    try {
      result = await getServerData("getNavigationTree");
      console.log("treeData", result);
      removeLoader(loaderText);
    } catch (err) {
      console.error("error:", err);
      removeLoader(loaderText);
    }
    return result || {};
  };

  const isNodeCollapsed = (node) => {
    return node.className.indexOf("collapsed") > -1;
  };

  const expandNode = (level, node) => {
    if (!node) return;

    node.className = node.className.replace("collapsed", "expanded");

    let next = node.nextElementSibling;
    while (next) {
      const nextLevel = Number(
        next.className.replace(/.+level-([0-9]{1,2}).*/gi, "$1")
      );
      if (nextLevel === level) break;
      if (nextLevel - level > 1) break;

      next.style.display = "";
      next = next.nextElementSibling;
    }
  };

  const collapseNode = (level, node) => {
    if (!node) return;

    node.className = node.className.replace("expanded", "collapsed");

    let next = node.nextElementSibling;
    while (next) {
      const nextLevel = Number(
        next.className.replace(/.+level-([0-9]{1,2}).*/gi, "$1")
      );
      if (nextLevel === level) break;

      next.style.display = "none";

      if (next.className.indexOf("expanded") > -1) {
        next.className = next.className.replace("expanded", "collapsed");
      }

      next = next.nextElementSibling;
    }
  };

  const defNodeNames = ["", "Производитель не задан", "Категория не задана"];
  const addNode = (item, to, level) => {
    const node = document.createElement("div");
    node.className = `node collapsed level-${level}`;

    node.innerHTML = (item.name || defNodeNames[level]).trim();
    node.style.display = level !== 1 ? "none" : undefined;
    to.appendChild(node);

    node.addEventListener("click", () => {
      let collapsed = isNodeCollapsed(node);
      if (collapsed) {
        expandNode(level, node);
      } else {
        collapseNode(level, node);
      }
    });

    fillLevel(item.items, to, level + 1);
  };

  const addLeaf = (el, level, to) => {
    const node = document.createElement("div");
    node.className = `node leaf level-${level}`;
    node.style.display = level !== 1 ? "none" : undefined;
    node.innerHTML = (
      el.name
        ? el.name
        : el.modelCustom.trim()
        ? el.modelCustom.trim() + (el.model ? ` (${el.model.trim()})` : "")
        : el.model.trim() || "Модель не выбрана"
    ).trim();

    node.addEventListener("click", () => {
      getServerData("navigateToSheet", [el.sheet || el.name]);
    });

    to.appendChild(node);
  };

  const fillLevel = (data, to, level) => {
    for (const item of data) {
      if (!item.items) {
        addLeaf(item, level, to);
      } else {
        addNode(item, to, level);
      }
    }
  };

  const data = (await getTreeSettings()) || {};

  fillLevel(data, treeCnt, 1);
})();
