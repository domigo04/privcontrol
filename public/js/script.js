const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

// Drag & Drop-Verhalten
dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  const files = e.dataTransfer.files;
  handleFiles(files);
});

fileInput.addEventListener("change", () => {
  const files = fileInput.files;
  handleFiles(files);
});

// Datei-Validierung & Vorschau
function handleFiles(files) {
  const validFiles = Array.from(files).filter(file => {
    if (file.type !== "application/pdf") {
      alert(`Nur PDF-Dateien sind erlaubt: ${file.name}`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(`Die Datei ${file.name} ist zu groß (max. 10 MB).`);
      return false;
    }
    return true;
  });

  if (validFiles.length > 0) {
    const fileList = validFiles.map(file => `<li>${file.name}</li>`).join("");
    dropzone.innerHTML = `
      <p><strong>Folgende Dateien werden hochgeladen:</strong></p>
      <ul>${fileList}</ul>
    `;
    // Optional: Dateien vorbereiten für Upload
    // uploadFiles(validFiles);
  }
}

// Beispielhafte Uploadfunktion (optional vorbereiten)
function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(file => formData.append("pdfs[]", file));

  fetch("/upload", {
    method: "POST",
    body: formData
  }).then(response => {
    if (response.ok) {
      alert("Dateien erfolgreich hochgeladen!");
    } else {
      alert("Fehler beim Hochladen.");
    }
  }).catch(error => {
    console.error("Upload-Fehler:", error);
    alert("Upload fehlgeschlagen.");
  });
}
