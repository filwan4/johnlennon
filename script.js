// 📍 Pobieranie elementów DOM
const imageInput = document.getElementById("imageInput");
const topInput = document.getElementById("topText");
const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");
const downloadButton = document.getElementById("downloadButton");
const preview = document.getElementById("preview");
const imageStatus = document.getElementById("imageStatus");

// 🖼️ Stan aplikacji
let sourceImage = null;
let fontReady = false;
let dragging = false;
const position = { x: 0.5, y: 0.035 };
let textBox = null;

// 🔤 Ładowanie czcionki z ponownym przerysowaniem
document.fonts.load('48px "Burst My Bubble"').then(() => {
  fontReady = true;
  if (sourceImage) drawMeme();
});

// 🎨 Główna funkcja rysująca mem
function drawMeme() {
  if (!sourceImage || !fontReady) return;

  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
  canvas.width = Math.round(sourceImage.naturalWidth * scale);
  canvas.height = Math.round(sourceImage.naturalHeight * scale);

  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const baseSize = Math.max(18, canvas.width * 0.09);
  ctx.font = `${baseSize}px "Burst My Bubble", Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";

  textBox = drawText(topInput.value, position);
}

// 📐 Zawijanie tekstu. Enter tworzy nowy akapit/wiersz, a długie wiersze zawijają się automatycznie.
function wrapText(text, maxWidth) {
  const paragraphs = String(text).split(/\r\n|\r|\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(testLine).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }

    lines.push(line);
  }

  return lines;
}

// ✍️ Rysowanie wszystkich wierszy tekstu na zdjęciu
function drawText(text, pos) {
  if (!text.trim()) return null;

  const maxWidth = canvas.width * 0.94;
  const lines = wrapText(text, maxWidth);
  const lineHeight = Math.max(22, canvas.width * 0.09 * 1.08);
  const x = pos.x * canvas.width;
  const y = pos.y * canvas.height;

  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    // Puste wiersze są zachowywane jako odstęp, ale nie rysujemy pustego tekstu.
    if (line) ctx.fillText(line, x, y + index * lineHeight, maxWidth);
  });

  const measuredWidth = Math.min(
    maxWidth,
    Math.max(...lines.map(line => ctx.measureText(line).width))
  );
  const totalHeight = lines.length * lineHeight;

  return {
    left: x - measuredWidth / 2 - 12,
    right: x + measuredWidth / 2 + 12,
    top: y - 8,
    bottom: y + totalHeight + 8
  };
}

// 🖱️ Pobieranie pozycji kursora lub palca na canvasie
function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height
  };
}

// 🖐️ Obsługa przesuwania bloku tekstu
canvas.addEventListener("pointerdown", event => {
  if (!sourceImage || !textBox) return;
  const point = pointerPosition(event);

  if (point.x >= textBox.left && point.x <= textBox.right &&
      point.y >= textBox.top && point.y <= textBox.bottom) {
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    event.preventDefault();
  }
});

canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  const point = pointerPosition(event);
  position.x = Math.max(0.03, Math.min(0.97, point.x / canvas.width));
  position.y = Math.max(0.02, Math.min(0.98, point.y / canvas.height));
  drawMeme();
});

function stopDragging() {
  dragging = false;
  canvas.classList.remove("dragging");
}

["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
  canvas.addEventListener(type, stopDragging);
});

// 📥 Wgrywanie pliku obrazu
imageInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    sourceImage = img;
    preview.querySelector(".placeholder")?.remove();
    canvas.hidden = false;
    downloadButton.disabled = false;
    imageStatus.textContent = "ZDJĘCIE ZAŁADOWANE";
    drawMeme();
    URL.revokeObjectURL(url);
  };

  img.src = url;
});

// Zwykłe zdarzenie input obsługuje pisanie i Enter w textarea.
topInput.addEventListener("input", drawMeme);

// 💾 Pobieranie gotowego mema
downloadButton.addEventListener("click", () => {
  if (!sourceImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
