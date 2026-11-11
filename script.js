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

let sourceImage = null;
let dragging = null;
let textBoxes = {};
const positions = {
  top: { x: 0.5, y: 0.035 },
  bottom: { x: 0.5, y: 0.965 }
};

function drawMeme() {
  if (!sourceImage) return;
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
  canvas.width = Math.round(sourceImage.naturalWidth * scale);
  canvas.height = Math.round(sourceImage.naturalHeight * scale);
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const baseSize = Math.max(18, canvas.width * (Number(sizeInput.value) / 100));
  ctx.font = baseSize + 'px "Burst My Bubble", Impact, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = Math.max(2, baseSize * 0.09);

  textBoxes = {};
  textBoxes.top = drawText(topInput.value, positions.top, "top");
  textBoxes.bottom = drawText(bottomInput.value, positions.bottom, "bottom");
}

function wrapText(text, maxWidth) {
  const words = text.toUpperCase().split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
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

function drawText(text, position, anchor) {
  if (!text.trim()) return null;
  const maxWidth = canvas.width * 0.94;
  const lines = wrapText(text, maxWidth);
  const lineHeight = Number(sizeInput.value) / 100 * canvas.width * 1.08;
  const x = position.x * canvas.width;
  const y = position.y * canvas.height;
  const firstY = anchor === "bottom" ? y - (lines.length - 1) * lineHeight : y;

  lines.forEach((part, index) => {
    const yy = firstY + index * lineHeight;
    if (anchor === "bottom") {
      ctx.textBaseline = "bottom";
      ctx.strokeText(part, x, yy, maxWidth);
      ctx.fillText(part, x, yy, maxWidth);
    } else {
      ctx.textBaseline = "top";
      ctx.strokeText(part, x, yy, maxWidth);
      ctx.fillText(part, x, yy, maxWidth);
    }
  });

  const measuredWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)));
  const top = anchor === "bottom" ? firstY - lineHeight * 0.12 : y - lineHeight * 0.12;
  const bottom = anchor === "bottom" ? y + lineHeight * 0.12 : y + lines.length * lineHeight;
  return {
    left: x - measuredWidth / 2 - 12,
    right: x + measuredWidth / 2 + 12,
    top: top - 8,
    bottom: bottom + 8
  };
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

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
canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);
canvas.addEventListener("lostpointercapture", stopDragging);

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

[topInput, bottomInput, sizeInput].forEach(el => el.addEventListener("input", () => {
  sizeValue.value = sizeInput.value + "%";
  drawMeme();
}));

downloadButton.addEventListener("click", () => {
  if (!sourceImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
