(async () => {
  const treeCnt = document.getElementById("tree");

  const getTreeSettings = async () => {
    const loaderText = "Загружаем структуру";
    addLoader(loaderText);
    let result;
    try {
      result = await getServerData("getNavigationTree");
      removeLoader(loaderText);
    } catch (err) {
      console.error("error:", err);
      removeLoader(loaderText);
    }
    return result || {};
  };

  const fillLevel = (data, to, level) => {
    if (!data.length) {
      for (const key of Object.keys(data)) {
        const node = document.createElement("div");
        node.className = `node collapsed level-${level}`;
        node.innerHTML = key.trim();
        node.style.display = level !== 1 ? "none" : undefined;
        to.appendChild(node);

        node.addEventListener("click", () => {
          let collapsed = node.className.indexOf("collapsed") > -1;
          if (collapsed) {
            node.className = node.className.replace("collapsed", "expanded");
          } else {
            node.className = node.className.replace("expanded", "collapsed");
          }
        });

        const o = data[key];
        if (!o) continue;

        fillLevel(o, to, level + 1);
      }
    } else {
      for (const el of data) {
        const node = document.createElement("div");
        node.className = `node leaf level-${level}`;
        node.style.display = level !== 1 ? "none" : undefined;
        node.innerHTML = (
          el.modelCustom
            ? el.modelCustom.trim() + (el.model ? ` (${el.model.trim()})` : "")
            : el.model.trim() || "Модель не выбрана"
        ).trim();

        to.appendChild(node);
      }
    }
  };

  const data = (await getTreeSettings()) || {};
  console.log("treeData:", data);
  fillLevel(data, treeCnt, 1);
})();
