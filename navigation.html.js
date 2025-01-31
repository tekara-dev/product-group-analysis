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
  });
})();
