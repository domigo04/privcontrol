// 📁 public/js/pruefcontrol-filter.js

window.filterState = {
  ausgewaehlt: new Set(),
  projektname: "",
  wunschtermin: "",
  gesamtpreis: 0
};

window.initFilter = function (gewerkCheckboxes, onChangeCallback) {
  gewerkCheckboxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) {
        filterState.ausgewaehlt.add(box.value);
      } else {
        filterState.ausgewaehlt.delete(box.value);
      }
      onChangeCallback();
    });
  });
};
