// 📍 Pobieranie elementów DOM
const imageInput = document.getElementById("imageInput");
const topInput = document.getElementById("topText");
const bottomInput = document.getElementById("bottomText");
const sizeInput = document.getElementById("fontSize");
const sizeValue = document.getElementById("fontSizeValue");
const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");
const downloadButton = document.getElementById("downloadButton");
const preview = document.getElementById("preview");
const imageStatus = document.getElementById("imageStatus");

// 🖼️ Stan aplikacji
let sourceImage = null;
let fontReady = false;
let dragging = null;
let textBoxes = {};
const positions = {
  top: { x: 0.5, y: 0.035 },
  bottom: { x: 0.5, y: 0.965 }
};

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

  const baseSize = Math.max(18, canvas.width * (Number(sizeInput.value) / 100));
  ctx.font = `${baseSize}px "Burst My Bubble", Impact, sans-serif`;
  ctx.textAlign = "center";
  
  // 🖤 Wymuszenie czarnego koloru i brak obrysu
  ctx.fillStyle = "#000000";

  textBoxes = {
    top: drawText(topInput.value, positions.top, "top"),
    bottom: drawText(bottomInput.value, positions.bottom, "bottom")
  };
}

// 📐 Zawijanie tekstu do nowej linii
function wrapText(text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
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
  if (line) lines.push(line);
  return lines;
}

// ✍️ Rysowanie pojedynczego bloku tekstu
function drawText(text, position, anchor) {
  if (!text.trim()) return null;

  const maxWidth = canvas.width * 0.94;
  const lines = wrapText(text, maxWidth);
  const lineHeight = (Number(sizeInput.value) / 100) * canvas.width * 1.08;
  const x = position.x * canvas.width;
  const y = position.y * canvas.height;

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
  if (!sourceImage) return;
  const point = pointerPosition(event);
  const order = ["bottom", "top"];

  dragging = order.find(key => {
    const box = textBoxes[key];
    return box && point.x >= box.left && point.x <= box.right &&
                  point.y >= box.top && point.y <= box.bottom;
  }) || null;

  if (dragging) {
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    event.preventDefault();
  }
});

canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  const point = pointerPosition(event);
  positions[dragging].x = Math.max(0.03, Math.min(0.97, point.x / canvas.width));
  positions[dragging].y = Math.max(0.02, Math.min(0.98, point.y / canvas.height));
  drawMeme();
});

function stopDragging() {
  dragging = null;
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

// 🎛️ Nasłuchiwanie wejść formularza
[topInput, bottomInput].forEach(el => el.addEventListener("input", drawMeme));

sizeInput.addEventListener("input", () => {
  sizeValue.value = `${sizeInput.value}%`;
  drawMeme();
});

// 💾 Pobieranie gotowego mema
downloadButton.addEventListener("click", () => {
  if (!sourceImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
