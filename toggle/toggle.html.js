const generateToggle = (to) => {
  const toggle = __el("div", "toggle");
  const toggleBtn = __el("div", "toggle-btn");
  const toggleContent = __el("label");

  toggle.appendChild(toggleBtn);
  toggle.appendChild(toggleContent);

  const isChecked = () => {
    return toggle.classList.contains("active");
  };

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    emit("change", isChecked());
  });

  const label = to.innerHTML.trim();
  to.innerHTML = "";
  to.appendChild(toggle);

  const events = {
    change: [],
  };

  const on = (event, handler, key) => {
    if (!events[event]) events[event] = [];
    events[event].push({ handler, key });
  };

  const off = (event, handler, key) => {
    events[event] = events[event].filter(
      (c) => c.handler !== handler && c.key !== key
    );
  };

  const emit = (event, data) => {
    if (!events[event]) return;
    events[event].forEach(({ handler }) => handler(data));
  };

  const set = (value, emitChange = true) => {
    toggle.classList.toggle("active", value);
    if (emitChange) emit("change", value);
  };
  const setLabel = (label) => {
    toggleContent.innerHTML = label;
  };

  if (label) {
    setLabel(label);
  }

  return { on, off, emit, isChecked, set, setLabel };
};
