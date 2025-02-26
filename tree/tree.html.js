const generateTree = async ({
  onLeafClick,
  data,
  to,
  getTitle,
  getBadge,
  getLeafIcon,
  getSubs,
}) => {
    
  const titleFunc = getTitle || (({ name }) => name);
  const subsFunc = getSubs || (({ items }) => items);
  const badgeFunc = getBadge;

  const leafIconFunc =
    getLeafIcon ||
    (() =>
      "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 9H21M3 15H21M12 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z' stroke='%23F87F8E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E%0A");

  const treeCnt = to || document.getElementById("tree");
  const defNodeNames = [
    "",
    "Не задано",
    "Не задано",
    "Не задано",
    "Не задано",
    "Не задано",
  ];

  const handleOnClick = (el) => {
    if (onLeafClick) onLeafClick(el);
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
      if (nextLevel - level === 1) next.style.display = "";

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

      if (level >= nextLevel) break;

      next.style.display = "none";

      if (next.className.indexOf("expanded") > -1) {
        next.className = next.className.replace("expanded", "collapsed");
      }

      next = next.nextElementSibling;
    }
  };

  const addNode = (item, to, level) => {
    const node = __el("div", `node collapsed level-${level}`);

    node.innerHTML = (titleFunc(item) ?? defNodeNames[level]).trim();
    node.style.display = level !== 1 ? "none" : undefined;

    const badgeVal = badgeFunc ? badgeFunc(item) : undefined;
    if (badgeVal) {
      const badge = __el("div", "badge");
      badge.innerHTML = badgeVal;
      node.appendChild(badge);
    }

    to.appendChild(node);

    node.addEventListener("click", () => {
      let collapsed = isNodeCollapsed(node);
      if (collapsed) {
        expandNode(level, node);
      } else {
        collapseNode(level, node);
      }
    });

    fillLevel(subsFunc(item), to, level + 1);
  };

  const addLeaf = (el, level, to) => {
    const node = __el("div", `node leaf level-${level}`);
    node.style.display = level !== 1 ? "none" : undefined;

    node.innerHTML += (titleFunc(el, true) || "Без названия").trim();

    const badgeVal = badgeFunc ? badgeFunc(el) : undefined;
    if (badgeVal) {
      const badge = __el("div", "badge");
      badge.innerHTML = badgeVal;
      node.appendChild(badge);
    }

    const iconImg = leafIconFunc(el);
    if (iconImg) {
      const icon = __el("div", "icon");
      icon.style.backgroundImage = `url("${leafIconFunc(el)}")`;
      node.prepend(icon);
    }

    node.addEventListener("click", () => handleOnClick(el));

    to.appendChild(node);
  };

  const fillLevel = (data, to, level) => {
    for (const item of data) {
      const items = subsFunc(item);

      if (!items || items.length === 0) {
        addLeaf(item, level, to);
      } else {
        addNode(item, to, level);
      }
    }
  };

  fillLevel(data, treeCnt, 1);
};
