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

  var data = (await getTreeSettings()) || [];

  await Promise.all([
    loadContent("tree.css", "Загружаем дерево"),
    loadContent("tree.js"),
  ]);

  generateTree({
    onLeafClick: (el) => {
      getServerData("navigateToSheet", [el.sheet || el.name]);
    },
    data,
    to: treeCnt,
    getTitle: ({ name, modelCustom, model }, isLeaf) => {
      if (!isLeaf) return name;

      if (name) return name.trim();

      const _modelCustom = (modelCustom || "").trim();
      const _model = (model || "").trim();

      if (_modelCustom && _modelCustom !== _model)
        return _modelCustom + (_model ? ` (${_model})` : "");

      return _model;
    },
  });
})();
