/**
 * @returns {"dev" | "net" | "ru"}
 */
const getApiSettings = () => {
  const apiSettings = getDocProps("apiSettings");
  return apiSettings;
};

const setApiSettings = (apiSettings) => {
  setDocProps("apiSettings", apiSettings);
};
