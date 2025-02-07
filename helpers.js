const delay = async (ms) => {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
};

const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!group) {
      result.push({ name: item.sheet });
      return result;
    }
    let added = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i].name !== group) continue;

      result[i].items.push(item);
      added = true;
    }
    if (!added) {
      result.push({ name: group, items: [item] });
    }
    return result;
  }, []);
};
