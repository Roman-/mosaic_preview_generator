// ==== Elements ====
const fileInput = document.getElementById('file-input');
const originalImg = document.getElementById('original-image');
const dropMessage = document.getElementById('drop-message');
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');

const plasticColorInput = document.getElementById('plastic-color');
const frameColorInput = document.getElementById('frame-color');
const frameSizeInput = document.getElementById('frame-size');
const borderRatioInput = document.getElementById('border-ratio');
const brightnessShiftInput = document.getElementById('brightness-shift');
const displacementRatioInput = document.getElementById('displacement-ratio');
const roundnessRatioInput = document.getElementById('roundness-ratio');
const outputHeightInput = document.getElementById('output-height');
const downloadBtn = document.getElementById('download-btn');
const exportDimensions = document.getElementById('export-dimensions');
const presetZeroBtn = document.getElementById('preset-zero');
const presetGridBtn = document.getElementById('preset-grid');
const presetPhotoBtn = document.getElementById('preset-photo');
const previewWrapper = document.getElementById('preview-wrapper');
const mainEl = document.querySelector('main');

let uploadedFileName = 'mosaic';

// Span outputs
const frameSizeVal = document.getElementById('frame-size-val');
const borderRatioVal = document.getElementById('border-ratio-val');
const brightnessShiftVal = document.getElementById('brightness-shift-val');
const displacementRatioVal = document.getElementById('displacement-ratio-val');
const roundnessRatioVal = document.getElementById('roundness-ratio-val');

// Fixed params
const tileSize = 20;

const PRESETS = {
  zero: {
    plasticColor: '#000000',
    frameColor: '#000000',
    frameSize: 0,
    borderRatio: 0,
    brightnessShift: 0,
    displacementRatio: 0,
    roundnessRatio: 0
  },
  grid: {
    plasticColor: '#000000',
    frameColor: '#000000',
    frameSize: 0,
    borderRatio: 0.2,
    brightnessShift: 0,
    displacementRatio: 0,
    roundnessRatio: 0
  },
  photo: {
    plasticColor: '#191919',
    frameColor: '#000000',
    frameSize: 8,
    borderRatio: 0.15,
    brightnessShift: 10,
    displacementRatio: 0.05,
    roundnessRatio: 0
  }
};

// === Helpers ===
function adjustBrightness(rgba, shiftPercent){
  if(!shiftPercent) return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3]/255})`;
  const factor = 1 + (Math.random()*2*shiftPercent - shiftPercent)/100;
  return `rgba(${[0,1,2].map(i=>Math.min(255,Math.max(0,Math.round(rgba[i]*factor)))).join(',')},${rgba[3]/255})`;
}

function drawRounded(ctx,x,y,w,h,r){
  if(r<=0){ ctx.fillRect(x,y,w,h); return; }
  const maxR = Math.min(w,h)/2;
  if(r>=maxR-0.01){ // draw circle
    const cx = x + w/2, cy = y + h/2;
    ctx.beginPath(); ctx.arc(cx,cy,maxR,0,Math.PI*2); ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  ctx.fill();
}

function drawMosaic(img){
  if(!img.complete||!img.naturalWidth) return;
  const w = img.width, h = img.height;
  const frameSize = +frameSizeInput.value;
  const frameColor= frameColorInput.value;
  const plasticColor = plasticColorInput.value;
  const borderRatio = +borderRatioInput.value;
  const brightnessShift=+brightnessShiftInput.value;
  const dispRatio = +displacementRatioInput.value;
  const roundRatio = +roundnessRatioInput.value;

  const border = tileSize*borderRatio*0.5;
  const squareSize = Math.max(0,tileSize-border*2);
  const dispAmp = tileSize*0.5*dispRatio;
  const radius = squareSize*0.5*roundRatio; // 0 -> 0, 1 -> sqSize/2 (circle)

  canvas.width = w*tileSize + frameSize*2;
  canvas.height= h*tileSize + frameSize*2;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=plasticColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillRect(frameSize,frameSize,w*tileSize,h*tileSize);

  const off=document.createElement('canvas'); off.width=w; off.height=h;
  off.getContext('2d').drawImage(img,0,0);
  const data=off.getContext('2d').getImageData(0,0,w,h).data;

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(!squareSize) continue;
      const idx=(y*w+x)*4;
      const rgba=[data[idx],data[idx+1],data[idx+2],data[idx+3]];
      const fill=adjustBrightness(rgba,brightnessShift);
      const dx=(Math.random()*2-1)*dispAmp;
      const dy=(Math.random()*2-1)*dispAmp;
      const sx=frameSize + x*tileSize + border + dx;
      const sy=frameSize + y*tileSize + border + dy;
      ctx.fillStyle=fill;
      drawRounded(ctx,sx,sy,squareSize,squareSize,radius);
    }
  }

  if(frameSize){
    ctx.lineWidth=frameSize;
    ctx.strokeStyle=frameColor;
    ctx.strokeRect(frameSize/2,frameSize/2,canvas.width-frameSize,canvas.height-frameSize);
  }
}

function refresh(){
  drawMosaic(originalImg);
  updateDimensions();
}

function updateSliderDisplays(){
  frameSizeVal.textContent=frameSizeInput.value;
  borderRatioVal.textContent=borderRatioInput.value;
  brightnessShiftVal.textContent=brightnessShiftInput.value;
  displacementRatioVal.textContent=displacementRatioInput.value;
  roundnessRatioVal.textContent=roundnessRatioInput.value;
}

function updateDimensions(){
  const h=+outputHeightInput.value||0;
  const ratio=canvas.width&&canvas.height?canvas.width/canvas.height:1;
  const w=Math.round(h*ratio);
  exportDimensions.textContent=`${w} x ${h}px`;
}

function applyPreset(p){
  plasticColorInput.value=p.plasticColor;
  frameColorInput.value=p.frameColor;
  frameSizeInput.value=p.frameSize;
  borderRatioInput.value=p.borderRatio;
  brightnessShiftInput.value=p.brightnessShift;
  displacementRatioInput.value=p.displacementRatio;
  roundnessRatioInput.value=p.roundnessRatio;
  updateSliderDisplays();
  refresh();
}

// Slider linkage
[
  {el:frameSizeInput,span:frameSizeVal},
  {el:borderRatioInput,span:borderRatioVal},
  {el:brightnessShiftInput,span:brightnessShiftVal},
  {el:displacementRatioInput,span:displacementRatioVal},
  {el:roundnessRatioInput,span:roundnessRatioVal}
].forEach(({el,span})=>{
  const upd=()=>span.textContent=el.value;
  el.addEventListener('input',()=>{upd();refresh();});
  upd();
});

[plasticColorInput,frameColorInput].forEach(el=>el.addEventListener('input',refresh));
outputHeightInput.addEventListener('input', updateDimensions);
downloadBtn.addEventListener('click', () => {
  const h = +outputHeightInput.value || canvas.height;
  const ratio = canvas.width && canvas.height ? canvas.width / canvas.height : 1;
  const w = Math.round(h * ratio);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  off.getContext('2d').drawImage(canvas, 0, 0, w, h);
  off.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${uploadedFileName}_preview_${w}x${h}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
});
presetZeroBtn.addEventListener('click', () => applyPreset(PRESETS.zero));
presetGridBtn.addEventListener('click', () => applyPreset(PRESETS.grid));
presetPhotoBtn.addEventListener('click', () => applyPreset(PRESETS.photo));

// Handle file selection (via input or drop)
function handleFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (img.width > 600 || img.height > 600) {
      alert('The image is too large; make sure to Upload the miniature not the source image');
      URL.revokeObjectURL(url);
      return;
    }
    uploadedFileName = file.name.replace(/\.png$/i, '') || 'mosaic';
    originalImg.style.display = 'none';
    originalImg.onload = () => {
      refresh();
      URL.revokeObjectURL(url);
      originalImg.style.display = 'block';
      previewWrapper.classList.remove('hidden');
      mainEl.classList.remove('no-preview');
    };
    originalImg.src = url;
  };
  img.src = url;
}

fileInput.addEventListener('change', e => {
  handleFile(e.target.files[0]);
});

const uploadArea = document.getElementById('upload-area');
// Open file dialog on click
uploadArea.addEventListener('click', () => fileInput.click());
// Drag-and-drop handlers
['dragenter', 'dragover'].forEach(event => {
  uploadArea.addEventListener(event, e => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(event => {
  uploadArea.addEventListener(event, e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
  });
});
uploadArea.addEventListener('drop', e => {
  handleFile(e.dataTransfer.files[0]);
});

updateDimensions();
