// 📁 pruefcontrol-filter.js

export const state = {
  ausgewaehlt: new Set(),
  projektname: "",
  wunschtermin: "",
  gesamtpreis: 0
};

export function initFilter(gewerkCheckboxes, onChangeCallback) {
  gewerkCheckboxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) {
        state.ausgewaehlt.add(box.value);
      } else {
        state.ausgewaehlt.delete(box.value);
      }
      onChangeCallback();
    });
  });
}
