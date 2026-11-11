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
let fontReady = false;

document.fonts.load('48px "Burst My Bubble"').then(() => {
  fontReady = true;
  drawMeme();
});

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

  drawText(topInput.value, canvas.height * 0.025);
  ctx.textBaseline = "bottom";
  drawText(bottomInput.value, canvas.height * 0.975);
}

function drawText(text, y) {
  if (!text.trim()) return;
  const words = text.toUpperCase().split(/\s+/);
  const maxWidth = canvas.width * 0.94;
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  const lineHeight = Number(sizeInput.value) / 100 * canvas.width * 1.08;
  const isBottom = ctx.textBaseline === "bottom";
  lines.forEach((part, index) => {
    const yy = isBottom ? y - (lines.length - 1 - index) * lineHeight : y + index * lineHeight;
    ctx.strokeText(part, canvas.width / 2, yy, maxWidth);
    ctx.fillText(part, canvas.width / 2, yy, maxWidth);
  });
}

imageInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return;
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
