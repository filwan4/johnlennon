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
let dragging = false; // teraz przesuwamy tylko jeden element
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

  // Rozmiar tekstu dopasowany do szerokości canvasa.
  const baseSize = Math.max(18, canvas.width * 0.09);
  ctx.font = `${baseSize}px "Burst My Bubble", Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";

  textBox = drawText(topInput.value, position, "top");
}

// 📐 Zawijanie tekstu do szerokości obrazu z zachowaniem ręcznych nowych linii
function wrapText(text, maxWidth) {
  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let line = "";

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    lines.push(line);
  }

  return lines;
}

// ✍️ Rysowanie pojedynczego bloku tekstu
function drawText(text, pos, anchor) {
  if (!text.trim()) return null;

  const maxWidth = canvas.width * 0.94;
  const lines = wrapText(text, maxWidth);
  const lineHeight = 0.09 * canvas.width * 1.08;
  const x = pos.x * canvas.width;
  const y = pos.y * canvas.height;

  ctx.textBaseline = "top";
  const totalHeight = lines.length * lineHeight;
  const startY = anchor === "bottom" ? y - totalHeight : y;

  lines.forEach((part, index) => {
    const lineY = startY + index * lineHeight;
    ctx.fillText(part, x, lineY, maxWidth);
  });

  const measuredWidth = Math.min(
    maxWidth,
    Math.max(...lines.map(line => ctx.measureText(line).width))
  );

  return {
    left: x - measuredWidth / 2 - 12,
    right: x + measuredWidth / 2 + 12,
    top: startY - 8,
    bottom: startY + totalHeight + 8
  };
}

// 🖱️ Pobieranie pozycji kursora lub palca na Canvasie
function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height
  };
}

// 🖐️ Obsługa przeciągania tekstu (myszka i dotyk palcem)
canvas.addEventListener("pointerdown", event => {
  if (!sourceImage || !textBox) return;
  const point = pointerPosition(event);

  // Sprawdzamy czy kliknięto w obszar tekstu
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

// 🎛️ Nasłuchiwanie zmian w polu tekstowym
topInput.addEventListener("input", drawMeme);

// 💾 Pobieranie gotowego mema
downloadButton.addEventListener("click", () => {
  if (!sourceImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
