/* Original, layered pixel artwork. The world has no remote asset dependency. */
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
const R = (c, color, x, y, w, h) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
const poly = (c, color, points) => { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
function oval(c, color, x, y, rx, ry) {
  c.fillStyle = color;
  for (let yy = -Math.ceil(ry); yy <= ry; yy += 2) {
    const xx = Math.sqrt(Math.max(0, 1 - yy * yy / (ry * ry))) * rx;
    c.fillRect(Math.round(x - xx), Math.round(y + yy), Math.ceil(xx * 2), 2);
  }
}
function line(c, color, points, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function flower(c, x, y, color = '#efb9c2', size = 2) {
  R(c, '#577b52', x, y, 1, size * 3); R(c, '#799765', x - size, y + size * 2, size * 2, 1);
  R(c, color, x - size, y - size * 2, size, size); R(c, color, x + size, y - size * 2, size, size);
  R(c, color, x - size * 2, y - size, size, size); R(c, color, x, y - size, size, size);
  R(c, color, x - size, y, size, size); R(c, '#eed694', x - 1, y - size, size, size);
}
const pond = [[75,600],[96,538],[166,498],[255,484],[338,495],[409,521],[500,513],[563,549],[607,594],[644,618],[710,622],[710,678],[641,688],[629,762],[589,823],[519,879],[430,916],[318,931],[207,912],[142,874],[96,817],[78,745],[91,681]];
const stream = [[603,618],[685,614],[734,625],[817,624],[889,635],[944,649],[933,677],[860,673],[805,680],[739,673],[661,688],[615,689]];
const paths = [
  [[790,1140],[790,872],[766,710],[770,583],[854,463],[1045,523],[1190,536]],
  [[770,583],[654,460],[474,407],[338,388],[198,330]],
  [[841,480],[921,340],[1133,305],[1300,321]],
  [[805,827],[1020,822],[1135,800],[1370,830],[1608,852]],
  [[780,883],[602,977],[350,987],[209,1062]],
  [[1176,536],[1291,545],[1392,648],[1384,824]]
];
const trees = [
  [73,264,0],[197,214,1],[343,236,2],[495,202,1],[640,267,0],[775,220,2],[947,207,1],[1107,160,0],[1280,185,2],[1478,251,1],
  [63,424,2],[127,461,0],[327,345,1],[630,367,2],[871,339,0],[1440,399,2],[1532,507,1],
  [58,1009,1],[184,1063,0],[483,1087,1],[644,1089,2],[951,1088,0],[1147,1046,1],[1334,1057,0],[1514,1037,2],
  [61,878,0],[1471,949,1],[1529,749,0],[1214,936,2],[1207,666,0],[981,944,1],
  [367,465,2],[723,480,1],[1008,629,2],[1391,627,1]
];

export const WORLD = {
  width: 1600, height: 1120, spawn: { x: 790, y: 800 },
  solids: [
    { x: 95, y: 546, w: 439, h: 292 }, { x: 166, y: 511, w: 333, h: 45 },
    { x: 177, y: 838, w: 327, h: 68 }, { x: 535, y: 574, w: 72, h: 238 },
    { x: 607, y: 625, w: 108, h: 53 }, { x: 817, y: 635, w: 125, h: 37 },
    { x: 1038, y: 363, w: 234, h: 129 }, { x: 1245, y: 240, w: 102, h: 49 },
    { x: 1043, y: 730, w: 95, h: 19 },
    ...trees.map(([x, y]) => ({ x: x - 12, y: y - 15, w: 24, h: 21 }))
  ],
  objects: [
    { id: 'flowers', x: 779, y: 569, label: 'Vườn hoa thương nhớ', kind: 'flowers' },
    { id: 'mailbox', x: 1030, y: 527, label: 'Lá thư đầu tiên', kind: 'mailbox' },
    { id: 'picnic', x: 470, y: 408, label: 'Buổi hẹn dưới tán hoa', kind: 'picnic' },
    { id: 'bench', x: 1091, y: 771, label: 'Ghế gỗ bên hồ', kind: 'bench' },
    { id: 'pavilion', x: 1290, y: 327, label: 'Lời hẹn dưới ánh sao', kind: 'pavilion' },
    { id: 'portalForest', x: 218, y: 338, label: 'Rừng thì thầm', kind: 'portal' },
    { id: 'portalLake', x: 351, y: 979, label: 'Hồ ánh trăng', kind: 'portal' },
    { id: 'portalGarden', x: 1365, y: 824, label: 'Vườn bình yên', kind: 'portal' },
    { id: 'cat', x: 1129, y: 584, label: 'Mèo Mây', kind: 'cat' },
    { id: 'spring', x: 1315, y: 545, label: 'Giếng nguyện ước', kind: 'spring' }
  ]
};

function sprite(width, height, ax, ay, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; draw(c);
  return { canvas, ax, ay, width, height };
}
function shrub(c, x, y, w, h, seed = 5, flowers = true) {
  const random = rng(seed); oval(c, '#688367', x, y, w * .52, h * .38);
  for (let i = 0; i < w * .7; i++) {
    const xx = x + (random() - .5) * w, yy = y - random() * h;
    oval(c, ['#4f6d50','#66865a','#83a26c','#a3b579'][i % 4], xx, yy, 5 + random() * 6, 4 + random() * 4);
    if (flowers && random() > .46) flower(c, xx, yy - 3, ['#e4a1b6','#f1c7c8','#fff0d5'][i % 3], 2);
  }
}
function makeTree(type, seed) {
  return sprite(222, 233, 111, 217, c => {
    const random = rng(seed); oval(c, '#354d3c22', 116, 218, 72, 13);
    poly(c, '#574b43', [[104,218],[108,164],[98,119],[112,124],[121,165],[123,212],[137,220],[121,224]]);
    R(c, '#856a53', 110, 157, 5, 55); R(c, '#b48c66', 110, 187, 3, 24);
    line(c, '#675448', [[115,179],[140,142],[155,126]], 7); line(c, '#675448', [[111,157],[85,123],[74,121]], 7);
    const colors = type === 1 ? ['#9f687d','#bd8295','#d7a0ad','#e9b6bd','#f4ced0','#ffe0da'] : type === 2 ? ['#3b6150','#527957','#6c9062','#85a36d','#a2b77e','#bbc78e'] : ['#405c4a','#567850','#72905d','#8fa66c','#a9b77c','#c3c992'];
    const clusters = [[63,132,45,32],[111,145,63,36],[164,125,44,34],[55,95,42,36],[113,93,67,43],[165,89,39,34],[90,56,43,31],[135,57,45,34]];
    for (const [x,y,rx,ry] of clusters) {
      oval(c, colors[0], x, y + 5, rx, ry);
      oval(c, colors[1], x - 3, y - 3, rx - 2, ry - 3);
      for (let k = 0; k < 60; k++) {
        const xx = (random() * 2 - 1), yy = random() * 2 - 1;
        if (xx * xx + yy * yy > 1) continue;
        const ix = x + xx * rx, iy = y + yy * ry;
        R(c, colors[2 + Math.floor(random() * 4)], ix, iy, 4 + random() * 7, 3 + random() * 5);
        if (type === 1 && random() > .62) { R(c, '#ffe7df', ix, iy, 3, 2); R(c, '#cd8b9f', ix + 3, iy + 2, 2, 3); }
        if (type !== 1 && random() > .82) R(c, '#d7d49a', ix, iy, 3, 2);
      }
    }
    for (let i = 0; i < 8; i++) R(c, '#8a7552', 107 + random() * 11, 159 + random() * 49, 2, 7);
    shrub(c, 116, 221, 40, 12, seed + 9, type === 1);
  });
}
function makeCottage() {
  return sprite(350, 347, 175, 320, c => {
    oval(c, '#3b4b382d', 188, 322, 157, 20);
    R(c, '#635c53', 47, 201, 251, 117); R(c, '#bbb4a1', 52, 207, 243, 101);
    for (let row = 0; row < 5; row++) for (let col = 0; col < 11; col++) {
      const x = 48 + col * 25 + (row % 2) * 12, y = 255 + row * 11;
      R(c, ['#9c9a8c','#acaa98','#c2bdab'][col % 3], x, y, 23, 9);
      R(c, '#d1c9b2', x + 2, y, 17, 2);
    }
    R(c, '#e8dfc9', 49, 129, 248, 126);
    for (let y = 136; y < 254; y += 13) { R(c, '#c6beac', 51, y, 243, 2); R(c, '#f6edda', 53, y + 3, 240, 2); }
    R(c, '#574c42', 44, 123, 11, 174); R(c, '#645344', 154, 124, 10, 138); R(c, '#584b40', 292, 122, 11, 178);
    poly(c, '#655049', [[24,153],[51,131],[169,44],[318,145],[318,158],[164,66],[40,158]]);
    poly(c, '#d2c6ac', [[56,130],[169,55],[279,132]]);
    R(c, '#6e5848', 164, 61, 9, 76); line(c, '#735e4c', [[67,126],[168,72],[271,130]], 7);
    poly(c, '#4c4242', [[14,140],[151,39],[190,39],[329,145],[326,165],[161,66],[35,160]]);
    for (let row = 0; row < 7; row++) {
      const y = 48 + row * 14, half = 17 + row * 20;
      for (let x = 169 - half; x < 169 + half; x += 21) {
        if (Math.abs(x - 169) > half - 5) continue;
        R(c, ['#70565c','#795b61','#8a646a','#644e54'][(row + Math.floor(x / 21)) % 4 < 0 ? 0 : (row + Math.floor(x / 21)) % 4], x, y, 19, 11);
        R(c, '#aa8381', x + 2, y, 16, 2); R(c, '#534249', x + 1, y + 9, 18, 3);
      }
    }
    line(c, '#b39585', [[15,144],[169,36],[328,145]], 4);
    R(c, '#5b4a44', 231, 29, 28, 47); R(c, '#9e8b76', 235, 32, 21, 37);
    for (let y = 34; y < 70; y += 9) { R(c, '#63554b', 233, y, 25, 2); R(c, '#c0a68b', 238, y + 2, 8, 2); }
    R(c, '#554b45', 228, 26, 35, 9); R(c, '#b39d84', 229, 25, 34, 3);
    // The recessed arched front door and its tiny brass details.
    oval(c, '#58483c', 206, 204, 29, 42); R(c, '#58483c', 177, 198, 59, 98);
    oval(c, '#80664c', 206, 205, 22, 34); R(c, '#80664c', 184, 202, 44, 91);
    for (let x = 187; x < 228; x += 8) { R(c, '#58483e', x, 193, 2, 99); R(c, '#aa8960', x + 2, 209, 2, 80); }
    oval(c, '#344c4a', 205, 204, 16, 21); R(c, '#344c4a', 189, 204, 33, 21);
    R(c, '#bba675', 204, 185, 3, 41); R(c, '#bba675', 189, 208, 33, 3);
    R(c, '#443f37', 184, 235, 43, 4); R(c, '#c6a15e', 217, 257, 4, 4);
    R(c, '#827966', 173, 294, 67, 10); R(c, '#c6bda4', 168, 303, 77, 10); R(c, '#e0d5bc', 169, 302, 75, 3);
    for (const x of [77, 253]) {
      R(c, '#615142', x - 7, 178, 49, 67); R(c, '#b9a27b', x - 3, 181, 41, 58);
      R(c, '#5d7d75', x + 1, 185, 33, 48); R(c, '#aac0a2', x + 3, 187, 12, 20); R(c, '#91ad91', x + 21, 190, 8, 18);
      R(c, '#5a4e40', x + 15, 183, 4, 54); R(c, '#5a4e40', x, 208, 35, 4);
      R(c, '#d9c6a0', x - 6, 238, 47, 6); R(c, '#785a47', x - 4, 248, 45, 12);
      shrub(c, x + 16, 248, 45, 14, x, true);
    }
    const random = rng(214);
    for (let i = 0; i < 150; i++) {
      const x = 32 + random() * 102, y = 92 + random() * 72;
      if (y < 145 - x * .43 || random() < .1) continue;
      R(c, ['#4c7050','#6f8d5b','#91a26c'][i % 3], x, y, 5 + random() * 6, 5);
      if (i % 4 === 0) flower(c, x, y, i % 8 ? '#efd9ca' : '#dca2b5', 2);
    }
    for (let i = 0; i < 43; i++) { const y = 145 + random() * 114, x = 45 + random() * 23; R(c, '#648256', x, y, 6, 4); if (i % 3 === 0) flower(c, x, y, '#f5dfd2', 2); }
    R(c, '#6c5444', 268, 284, 18, 22); R(c, '#ac7d59', 265, 279, 24, 7); shrub(c, 276, 278, 24, 25, 519, false);
    R(c, '#6b5c47', 142, 197, 4, 20); R(c, '#b99557', 136, 181, 15, 20); R(c, '#ffe3a0', 140, 184, 7, 13); R(c, '#4d4b3b', 135, 178, 17, 4);
  });
}
function makePavilion() {
  return sprite(206, 200, 103, 177, c => {
    oval(c, '#455d3e28', 105, 178, 96, 17);
    oval(c, '#8c9080', 102, 172, 84, 22); oval(c, '#d1c9ad', 102, 166, 84, 22);
    for (let y = 151; y < 182; y += 7) R(c, '#a5a28c', 36, y, 133, 1);
    for (const x of [44,149]) { R(c, '#7b715a', x, 72, 11, 94); R(c, '#dfd2ae', x + 3, 74, 6, 89); R(c, '#a9a17d', x - 3, 151, 17, 11); }
    for (let x = 56; x < 149; x += 11) { R(c, '#a29d7c', x, 121, 4, 26); R(c, '#d7cba7', x, 120, 2, 24); }
    R(c, '#9b9675', 44, 116, 117, 6); R(c, '#dacfaa', 45, 114, 116, 3);
    poly(c, '#5b6d5c', [[10,79],[47,60],[102,16],[160,60],[196,79],[190,91],[17,91]]);
    poly(c, '#769182', [[24,77],[65,57],[102,26],[139,56],[182,77]]);
    for (let i = 0; i < 5; i++) line(c, '#b0b59a', [[23 + i * 7,78 - i * 9],[102,21 + i * 3],[184 - i * 7,78 - i * 9]], 2);
    R(c, '#d5c796', 98, 6, 8, 14); oval(c, '#d9bf7f', 102, 8, 5, 5);
    shrub(c, 40, 97, 44, 25, 88, true); shrub(c, 167, 99, 42, 23, 89, true);
    for (let y = 93; y < 151; y += 9) { R(c, '#719068', 43 + Math.sin(y) * 3, y, 9, 5); flower(c, 48, y + 3, '#e9bed1', 2); }
    R(c, '#6e6151', 96, 73, 13, 20); R(c, '#ffdf99', 99, 77, 7, 12);
  });
}
function makeBench() {
  return sprite(126, 76, 63, 64, c => {
    oval(c, '#46534029', 64, 65, 56, 9);
    for (const x of [16,102]) { R(c, '#4f5142', x, 29, 6, 37); R(c, '#474a3d', x - 3, 61, 12, 4); }
    for (let i = 0; i < 3; i++) { R(c, '#765f47', 12, 12 + i * 11, 102, 8); R(c, '#b69a6b', 13, 12 + i * 11, 101, 3); R(c, '#c8af7f', 17, 13 + i * 11, 88, 1); }
    poly(c, '#957a52', [[9,44],[115,44],[122,54],[4,54]]); R(c, '#67573f', 6, 54, 114, 5);
    for (let i = 0; i < 3; i++) R(c, '#c2a273', 8, 45 + i * 3, 108, 1);
    R(c, '#4b4f40', 10, 36, 6, 15); R(c, '#4b4f40', 109, 36, 6, 15);
  });
}
function makeLamp() {
  return sprite(45, 122, 22, 115, c => {
    oval(c, '#3d4c3e2d', 23, 115, 20, 5); R(c, '#575a45', 15, 110, 17, 5); R(c, '#494c3d', 20, 40, 6, 74); R(c, '#9c9564', 21, 43, 2, 65);
    poly(c, '#4d4f3c', [[9,20],[36,20],[31,42],[15,42]]); poly(c, '#e3b96e', [[12,22],[33,22],[29,38],[17,38]]);
    R(c, '#ffe6a5', 18, 22, 9, 15); R(c, '#626044', 21, 21, 3, 19);
    poly(c, '#51513e', [[5,19],[23,6],[40,19]]); R(c, '#848367', 10, 18, 25, 3); R(c, '#414638', 21, 1, 4, 9);
  });
}
function makeMailbox() {
  return sprite(57, 89, 28, 81, c => {
    oval(c, '#4c5b432a', 30, 82, 24, 6); R(c, '#69513e', 24, 40, 8, 42); R(c, '#ad8a60', 25, 42, 3, 39);
    oval(c, '#775965', 24, 29, 18, 15); R(c, '#775965', 6, 28, 38, 24); oval(c, '#a67d80', 27, 28, 16, 13); R(c, '#b58b88', 11, 29, 33, 19);
    R(c, '#e0b4a7', 12, 31, 28, 3); R(c, '#6b5155', 9, 46, 36, 5); R(c, '#d5af89', 16, 38, 20, 12); R(c, '#fff0d0', 18, 39, 15, 8);
    line(c, '#b89181', [[18,39],[26,44],[33,39]], 1); R(c, '#605c48', 42, 11, 3, 28); R(c, '#cf8b8a', 44, 12, 10, 8);
    flower(c, 14, 79, '#e9bbcc', 2); flower(c, 41, 81, '#f4e1be', 2);
  });
}
function makePicnic() {
  return sprite(133, 87, 66, 68, c => {
    oval(c, '#59674726', 66, 64, 64, 21); poly(c, '#bd8585', [[18,22],[103,18],[126,67],[5,72]]);
    poly(c, '#e5b8aa', [[20,25],[102,21],[120,64],[9,68]]);
    for (let y = 28; y < 67; y += 10) for (let x = 15; x < 116; x += 11) if (x > 18 - (y - 28) * .2 && x < 103 + (y - 28) * .3) R(c, (x / 11 + y / 10 | 0) % 2 ? '#ce9996' : '#f1d6be', x, y, 7, 6);
    oval(c, '#c0ab8e', 58, 47, 15, 7); oval(c, '#f3e3c4', 58, 45, 14, 6); oval(c, '#d68b77', 58, 44, 7, 3);
    R(c, '#8c6747', 86, 19, 23, 21); R(c, '#bc9864', 86, 20, 22, 4); R(c, '#d0b07a', 90, 25, 4, 11);
    line(c, '#8b6d49', [[87,21],[88,10],[104,10],[107,21]], 3); R(c, '#e0c592', 86, 35, 23, 3);
    R(c, '#f6e3bf', 34, 33, 9, 11); R(c, '#8c6754', 36, 32, 5, 3); R(c, '#d4aa84', 44, 35, 4, 5);
    R(c, '#f5e6c9', 76, 53, 9, 10); R(c, '#a17d5b', 78, 52, 5, 3);
    for (let i = 0; i < 5; i++) flower(c, 25 + i * 3, 57 - i, ['#f3cbd0','#e7b0c9','#f1dfb8'][i % 3], 2);
  });
}
function makeWell() {
  return sprite(107, 115, 54, 103, c => {
    oval(c, '#3a534233', 55, 102, 48, 12); oval(c, '#737f72', 55, 83, 38, 20); R(c, '#8e9784', 17, 75, 77, 20);
    for (let y = 76; y < 98; y += 9) for (let x = 19; x < 91; x += 15) R(c, '#bcc2a7', x + (y % 2) * 4, y, 13, 6);
    oval(c, '#c4c6ac', 55, 73, 39, 17); oval(c, '#556e63', 55, 72, 29, 11); oval(c, '#3e5956', 55, 73, 25, 8);
    R(c, '#715d45', 25, 24, 5, 53); R(c, '#715d45', 81, 24, 5, 53); R(c, '#b99568', 27, 24, 2, 51);
    poly(c, '#596f58', [[8,31],[54,5],[100,31],[97,38],[9,38]]); line(c, '#a8b18c', [[10,29],[54,8],[99,30]], 3);
    R(c, '#84684b', 27, 44, 58, 5); R(c, '#c2ae7d', 54, 45, 2, 26); R(c, '#9b7851', 49, 63, 14, 12); R(c, '#c2a16e', 50, 63, 12, 3);
    shrub(c, 21, 103, 31, 11, 831, true); shrub(c, 88, 106, 25, 12, 832, true);
  });
}
function sign(c, x, y, text, flip = false) {
  R(c, '#746347', x - 3, y - 24, 7, 27); R(c, '#b09563', x - 2, y - 24, 2, 23);
  poly(c, '#756448', [[x-30,y-51],[x+26,y-51],[x+34,y-40],[x+26,y-29],[x-30,y-29]]);
  R(c, '#bda775', x - 28, y - 49, 52, 17); R(c, '#d8c38f', x - 26, y - 48, 49, 2);
  c.fillStyle = '#514d37'; c.font = '8px monospace'; c.textAlign = 'center'; c.fillText(text, x - 1, y - 37);
  R(c, '#796448', x - 23, y - 46, 2, 2); R(c, '#796448', x + 19, y - 33, 2, 2);
}

function distanceToPath(x, y, points) {
  let minimum = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i-1], [bx, by] = points[i], dx = bx - ax, dy = by - ay;
    const t = clamp(((x-ax)*dx + (y-ay)*dy) / (dx*dx+dy*dy),0,1);
    minimum = Math.min(minimum, Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return minimum;
}
function waterShape(c) { for (const shape of [pond, stream]) poly(c, '#6eaaa8', shape); }
function stone(c, x, y, w, h, color) {
  poly(c, '#a7a58e', [[x-w*.4,y-h*.5],[x+w*.3,y-h*.5],[x+w*.5,y],[x+w*.3,y+h*.5],[x-w*.4,y+h*.5],[x-w*.5,y]]);
  poly(c, color, [[x-w*.4,y-h*.6],[x+w*.3,y-h*.6],[x+w*.5,y-2],[x+w*.3,y+h*.3],[x-w*.4,y+h*.3],[x-w*.5,y-2]]);
  R(c, '#eeead022', x-w*.3,y-h*.5,w*.5,2);
}
function makeTerrain(area) {
  const canvas = document.createElement('canvas'); canvas.width = WORLD.width; canvas.height = WORLD.height;
  const c = canvas.getContext('2d'), random = rng(36476);
  const grass = area === 'forest' ? ['#91a378','#82976d','#9ead7e','#b0bc8d'] : area === 'lake' ? ['#9fb496','#92ac88','#afc09c','#c1c9a5'] : ['#a9b789','#9cad7e','#b7c292','#c8cd9b'];
  R(c, grass[0], 0, 0, 1600, 1120);
  for (let i = 0; i < 630; i++) { const x = random()*1600, y = random()*1120; oval(c, grass[i%4],x,y,14+random()*35,5+random()*11); }
  for (let i = 0; i < 17000; i++) { const x = random()*1600,y=random()*1120; R(c, grass[i%4],x,y,1+random()*3,1+random()*2); }
  for (const p of paths) { line(c, '#9fa27c', p, 102); line(c, '#c4c29c',p,94); line(c,'#d5cdb0',p,82); line(c,'#dcd3b8',p,62); }
  for (let i=0;i<6100;i++) {
    const x=random()*1600,y=random()*1120,d=Math.min(...paths.map(p=>distanceToPath(x,y,p)));
    if(d<43 && random()>.52) stone(c,x,y,7+random()*15,4+random()*7,['#d0c9ad','#c5c2a5','#e5dbc0','#b9baa0'][i%4]);
    else if(d<54 && d>43) { R(c, '#8c9f6e',x,y,2,4); if(i%3===0)flower(c,x,y,'#e9d8a5',1); }
  }
  // A pale, irregular stone lip frames the deep, clear lake.
  poly(c, '#879a7b', pond.map(([x,y])=>[x+(x-350)*.035,y+(y-720)*.055]));
  poly(c, '#c6c5a5', pond.map(([x,y])=>[x+(x-350)*.018,y+(y-720)*.026]));
  waterShape(c);
  c.save(); c.beginPath(); pond.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath();c.clip();
  for(let i=0;i<1300;i++) { const x=65+random()*650,y=480+random()*470; R(c,['#7eb7b0','#89bdb3','#629fa4','#b2d1be','#5a959f'][i%5],x,y,4+random()*34,1+random()*2); }
  for(let i=0;i<10;i++) oval(c,'#4d8d9122',140+random()*450,620+random()*220,25+random()*45,8+random()*13);
  c.restore();
  for(const [x,y] of [[155,590],[199,844],[363,872],[501,590],[485,809]]) { oval(c,'#46857e',x,y+2,18,8);oval(c,'#789d62',x,y,18,7);oval(c,'#a6b57a',x-3,y-2,12,4);line(c,'#60845d',[[x,y],[x+12,y-5]],2); if(x===363||x===155)flower(c,x+3,y-5,'#f0d2d0',3); }
  for(let i=0;i<60;i++){const a=random()*TAU,x=340+Math.cos(a)*252,y=711+Math.sin(a)*206;if(x>570)continue; R(c,'#678b65',x,y-13,2,15);line(c,'#8ca475',[[x,y],[x-6,y-17]],2);if(i%4===0)R(c,'#917c52',x-1,y-20,4,8);}
  // Planked footbridge; rails are a separate depth-sorted foreground layer.
  R(c,'#486e6344',706,609,119,93);R(c,'#665a43',715,585,100,132);
  for(let y=587;y<717;y+=9){R(c,y%3?'#b19a6b':'#a38a5d',717,y,96,7);R(c,'#d0b780',718,y,93,2);R(c,'#756448',723,y+5,84,1);R(c,'#665b45',721,y+3,2,2);R(c,'#665b45',807,y+3,2,2);}
  // Sweeping garden beds, wildflowers, stepping stones and hand-laid edging.
  for(const [x,y,w,h,seed] of [[777,556,91,29,21],[967,471,74,26,33],[1374,736,132,37,54],[315,333,87,24,68],[1078,872,94,24,77],[639,905,81,29,82],[1238,504,82,26,99],[1049,569,69,19,107],[1436,575,109,27,111]]) {
    oval(c,'#778b622b',x,y+7,w*.6,h*.6);oval(c,'#7e8b61',x,y,w*.56,h*.48);oval(c,'#a29672',x,y-2,w*.52,h*.44);
    const rr=rng(seed);for(let i=0;i<w*.8;i++){const xx=x+(rr()-.5)*w,yy=y+(rr()-.5)*h;R(c,'#6b8858',xx,yy-7,3,9);flower(c,xx,yy-6,['#e4a4b7','#f3d8cc','#f7e9bd','#c7bbd5'][i%4],1+Math.floor(rr()*2));}
    for(let xx=x-w*.5;xx<x+w*.5;xx+=12)stone(c,xx,y+h*.45,11,6,'#b7b49a');
  }
  // Rose thickets and drifts of daisies spill out of the carefully tended beds.
  for(const [x,y,w,h,seed] of [[178,462,106,32,207],[275,478,73,27,208],[87,512,65,29,209],[147,912,98,29,211],[539,887,77,25,213],[930,401,64,27,214],[1354,476,97,31,215],[1410,927,118,30,216],[1167,583,66,23,217],[602,506,57,24,218],[473,324,96,23,219]])shrub(c,x,y,w,h,seed,true);
  // Little white pickets and climbing roses make a sheltered cottage garden.
  for(const [sx,sy,length] of [[962,326,116],[1338,414,119],[1304,662,120]]){
    R(c,'#8c9274',sx,sy-27,length,4);R(c,'#d3cfaa',sx,sy-29,length,3);R(c,'#939878',sx,sy-12,length,4);
    for(let x=sx;x<sx+length;x+=15){R(c,'#a6aa87',x,sy-34,6,38);R(c,'#e1ddba',x,sy-34,3,35);poly(c,'#ddd9b7',[[x-1,sy-34],[x+3,sy-40],[x+7,sy-34]]);}
    shrub(c,sx+length*.5,sy+6,length*.8,18,sx,true);
  }
  // Boundary hedges keep the playable garden feeling like a complete place.
  for(let x=14;x<1600;x+=34){shrub(c,x,78,48,25,Math.floor(x)+2,true);shrub(c,x,1110,47,21,Math.floor(x)+8,true);}
  for(let y=100;y<1100;y+=39){shrub(c,13,y,40,27,Math.floor(y),true);shrub(c,1595,y,40,27,Math.floor(y)+1,true);}
  for(let i=0;i<1000;i++){
    const x=30+random()*1540,y=70+random()*1030;
    if(Math.min(...paths.map(p=>distanceToPath(x,y,p)))<56 || (x>65&&x<640&&y>488&&y<934))continue;
    if(i%3===0)flower(c,x,y,['#f1dcbb','#e2bcc4','#e8d9a5'][i%3],1);else {R(c,'#819866',x,y,1,5);R(c,'#95a774',x-2,y+2,4,1);}
  }
  for(const [x,y] of [[914,575],[1138,584],[903,861],[1226,826],[606,959],[542,453],[1291,383]]) {stone(c,x,y,18,9,'#aaad94');stone(c,x+16,y+11,12,7,'#bfc0a2');}
  return canvas;
}

/** Draw a fully original 4-direction sprite, anchored at its feet. */
export function drawCharacter(c, x, y, { character = 'female', direction = 'down', moving = false, time = 0, scale = 1.5 } = {}) {
  const female=character==='female', t=time>10000?time*.001:time;
  const step=moving?Math.sin(t*11):0,bob=moving?Math.abs(step)*1.2:Math.sin(t*2.2)*.35;
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);c.imageSmoothingEnabled=false;
  oval(c,'#3c49384d',0,-1,11,3);
  c.translate(0,-Math.round(bob));
  const skin='#edc29e', shade='#d59c7f', hair='#34302f', lightHair='#54413b', shirt=female?'#efe2c4':'#8d9d77', darkShirt=female?'#c7bda1':'#64785f';
  const side=direction==='left'||direction==='right',back=direction==='up';
  if(direction==='left')c.scale(-1,1);
  // Hair silhouettes remain visible behind the shoulders and animate subtly.
  if(female){R(c,hair,-10,-31,20,21);R(c,hair,-12,-24,24,22);R(c,lightHair,-11,-20,3,16);R(c,'#463734',8,-23,4,22);R(c,hair,-10,-8,5,5);R(c,hair,8,-8,4,5);}
  // Walking legs have opposed frames and actual foot placement in every facing.
  const stride=Math.round(step*2),leg=female?'#edc6a6':'#3a3e39',shoe=female?'#ece6d2':'#45423a';
  R(c,female?'#c9c3a8':'#343932',-7,-13,14,7);
  if(side){R(c,leg,-4+stride,-8,5,6);R(c,'#b29d85',-5+stride,-3,6,2);R(c,shoe,-5+stride,-2,9,3);R(c,leg,2-stride,-8,5,8);R(c,shoe,1-stride,-1,9,3);R(c,'#faf0d5',3-stride,-1,6,1);}
  else {R(c,leg,-7,-8,5,7+stride);R(c,leg,2,-8,5,7-stride);R(c,shoe,-8,-2+stride,7,3);R(c,shoe,2,-2-stride,7,3);R(c,female?'#fff2d7':'#73654f',-7,-2+stride,6,1);R(c,female?'#fff2d7':'#73654f',3,-2-stride,5,1);}
  R(c,darkShirt,-8,-23,16,13);R(c,shirt,-7,-24,14,12);R(c,female?'#faf0d5':'#b1b998',-6,-23,4,10);
  if(female){R(c,'#e4d9bc',-8,-13,16,4);R(c,'#f3ead0',-7,-12,6,3);R(c,'#f3ead0',2,-12,5,3);}
  else {R(c,'#e9dfca',-2,-23,5,13);R(c,'#637459',-4,-23,2,12);R(c,'#a9b18c',5,-23,2,12);R(c,'#373b34',-6,-11,13,2);R(c,'#bea676',1,-11,2,2);}
  // Hands and puffed sleeves.
  const arm=Math.round(step*1.5);
  if(!side){R(c,darkShirt,-11,-22,5,8);R(c,shirt,-11,-22,4,6);R(c,skin,-10,-16+arm,4,5);R(c,darkShirt,7,-22,5,8);R(c,shirt,8,-22,4,6);R(c,skin,8,-16-arm,4,5);}
  else {R(c,darkShirt,2,-22,6,8);R(c,shirt,3,-22,5,6);R(c,skin,4+arm,-16,4,6);R(c,shade,4+arm,-11,4,2);}
  // A deliberately generous head gives the characters their cozy chibi proportions.
  R(c,hair,-10,-36,20,17);R(c,hair,-12,-32,24,11);R(c,hair,-8,-38,15,4);
  if(!back){R(c,shade,-8,-30,17,13);R(c,skin,-8,-30,17,11);R(c,'#f4d2ae',-6,-29,12,9);R(c,skin,-10,-26,3,5);R(c,skin,8,-26,3,5);
    if(side){R(c,'#332f2b',4,-26,2,3);R(c,'#faf0df',5,-26,1,1);R(c,shade,9,-24,3,2);R(c,'#a77165',6,-19,3,1);R(c,'#dfa594',3,-21,3,1);}
    else{R(c,'#443730',-6,-26,3,3);R(c,'#443730',4,-26,3,3);R(c,'#fff0d7',-5,-26,1,1);R(c,'#fff0d7',5,-26,1,1);R(c,'#c18a77',0,-20,3,1);R(c,'#e5aa9a',-8,-22,4,1);R(c,'#e5aa9a',6,-22,3,1);}
    if(female){
      const glass='#62534a';
      if(side){R(c,glass,1,-28,8,1);R(c,glass,1,-27,1,6);R(c,glass,8,-27,1,6);R(c,glass,2,-21,6,1);R(c,'#c9c3ad',2,-27,2,1);}
      else{for(const xx of [-9,2]){R(c,glass,xx+1,-28,7,1);R(c,glass,xx,-27,1,5);R(c,glass,xx+8,-27,1,5);R(c,glass,xx+1,-22,7,1);R(c,'#d4d0b9',xx+2,-27,2,1);}R(c,glass,-1,-26,4,1);}
    }
    // Irregular fringe with little highlights rather than a flat hair cap.
    R(c,hair,-10,-34,20,7);R(c,hair,-8,-29,4,4);R(c,hair,-2,-29,3,3);R(c,hair,5,-30,5,4);R(c,lightHair,-8,-34,5,2);R(c,'#6a5143',-4,-35,5,1);R(c,lightHair,3,-33,5,2);
    if(!female){R(c,hair,-11,-35,5,5);R(c,hair,-8,-39,4,3);R(c,hair,-3,-40,4,3);R(c,hair,3,-38,5,3);R(c,hair,8,-35,5,5);R(c,'#6b5646',0,-36,6,1);}
  } else {
    R(c,lightHair,-8,-34,4,15);R(c,'#413633',-3,-36,8,17);R(c,'#55413a',5,-31,3,11);
    if(female){R(c,hair,-10,-20,20,13);R(c,lightHair,-7,-20,2,11);R(c,'#4b3935',1,-18,3,11);}
    else{R(c,hair,-10,-30,20,10);R(c,shirt,-7,-19,14,7);R(c,darkShirt,-6,-13,13,2);}
  }
  if(female){
    // Tiny ivory flower clip and cream collar are recognizable even on mobile.
    R(c,'#f5e5c9',-12,-32,3,7);R(c,'#fff0d9',-14,-30,7,3);R(c,'#d4b373',-11,-30,2,2);R(c,'#81946c',-12,-26,2,3);
    if(!back){R(c,'#fff2d6',-4,-23,3,3);R(c,'#fff2d6',2,-23,3,3);R(c,'#b5a287',0,-20,1,6);R(c,'#ba9279',0,-17,1,1);}
  }
  c.restore();
}

export class WorldRenderer {
  constructor(canvas) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.camera={x:790,y:730,scale:1.25};
    this.motionPreference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.terrain=new Map();this.sprites={cottage:makeCottage(),pavilion:makePavilion(),bench:makeBench(),lamp:makeLamp(),mailbox:makeMailbox(),picnic:makePicnic(),spring:makeWell()};
    this.treeSprites=Array.from({length:9},(_,i)=>makeTree(i%3,349+i*539));
    this.lamps=[[693,546],[843,728],[1004,807],[1210,446],[1389,878],[411,988],[406,365],[1284,355]];
    this.scenery=[...trees.map(([x,y,type],i)=>({x,y,asset:this.treeSprites[type+3*(i%3)],tree:true})),{x:1154,y:491,asset:this.sprites.cottage},{x:1291,y:311,asset:this.sprites.pavilion},{x:1091,y:750,asset:this.sprites.bench},{x:1030,y:517,asset:this.sprites.mailbox},{x:470,y:405,asset:this.sprites.picnic},{x:1315,y:539,asset:this.sprites.spring},...this.lamps.map(([x,y])=>({x,y,asset:this.sprites.lamp,lamp:true}))];
    this.resize();
  }
  resize() {
    const bounds=this.canvas.getBoundingClientRect();this.width=Math.max(1,bounds.width||this.canvas.clientWidth||window.innerWidth);this.height=Math.max(1,bounds.height||this.canvas.clientHeight||window.innerHeight);
    this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.ctx.imageSmoothingEnabled=false;
    this.baseScale=this.width<700?1.12:Math.min(1.5,Math.max(1.1,this.width/1020));
    if(!this.focusTarget)this.camera.scale=this.baseScale;
  }
  screenToWorld(clientX,clientY) {
    const rect=this.canvas.getBoundingClientRect();return {x:(clientX-rect.left-this.width/2)/this.camera.scale+this.camera.x,y:(clientY-rect.top-this.height/2)/this.camera.scale+this.camera.y};
  }
  /** Pan to a fixed world point. Zoom uses CSS-pixel scale; duration is milliseconds. */
  focus(options={}) {
    if(options.release||options.follow){this.releaseFocus();return Promise.resolve({completed:true});}
    this.finishFocus(false);
    const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
    const zoom=clamp(finite(options.zoom,this.camera.scale),.75,2.8);
    const target={x:clamp(finite(options.x,this.camera.x),0,1600),y:clamp(finite(options.y,this.camera.y),0,1120)};
    const duration=clamp(finite(options.duration,900),0,10000);
    return new Promise(resolve=>{
      this.focusTarget={...target,scale:zoom,from:{...this.camera},elapsed:0,duration,resolve};
      const reduced=options.reducedMotion??options.reduceMotion??this.reducedMotion??this.motionPreference?.matches;
      if(duration===0||reduced)this.updateFocus(0,true);
    });
  }
  /** Release a cinematic hold; subsequent frames smoothly follow the player again. */
  releaseFocus() { this.finishFocus(false);this.focusTarget=null; }
  finishFocus(completed) {
    if(this.focusTarget?.resolve){const resolve=this.focusTarget.resolve;this.focusTarget.resolve=null;resolve({completed});}
  }
  boundCamera(x,y,scale) {
    const hw=this.width/(2*scale),hh=this.height/(2*scale);
    return {x:hw>=800?800:clamp(x,hw,1600-hw),y:hh>=560?560:clamp(y,hh,1120-hh)};
  }
  updateFocus(dt,instant=false) {
    const focus=this.focusTarget;if(!focus)return;
    focus.elapsed+=dt*1000;
    const fraction=instant||focus.duration===0?1:clamp(focus.elapsed/focus.duration,0,1),ease=fraction*fraction*(3-2*fraction);
    // Recalculate bounds after resizing without dropping the persistent cinematic hold.
    const target=this.boundCamera(focus.x,focus.y,focus.scale);
    this.camera.scale=focus.from.scale+(focus.scale-focus.from.scale)*ease;
    this.camera.x=focus.from.x+(target.x-focus.from.x)*ease;this.camera.y=focus.from.y+(target.y-focus.from.y)*ease;
    if(fraction===1){focus.elapsed=focus.duration;this.finishFocus(true);}
  }
  render(state={}, dt=1/60) {
    let {time=0,player={...WORLD.spawn,character:'female'},companion,area='garden',daylight='morning',quality='high',activeObject}=state;
    // The public clock is in seconds; accepting milliseconds also makes embeds safe.
    if(time>100000)time*=.001;
    if(state.paused)time=this.lastTime??time;else this.lastTime=time;
    dt=clamp(dt>1?dt/1000:dt,0,.05);
    this.reducedMotion=state.reducedMotion??state.reduceMotion??this.motionPreference?.matches??false;
    const c=this.ctx,cam=this.camera,k=this.reducedMotion?1:1-Math.exp(-dt*5.5);
    if(this.focusTarget)this.updateFocus(dt,this.reducedMotion);
    else {cam.scale+=(this.baseScale-cam.scale)*k;const target=this.boundCamera(player.x,player.y-25,cam.scale);cam.x+=(target.x-cam.x)*k;cam.y+=(target.y-cam.y)*k;}
    // A viewport larger than the map stays centered without exposing blank edges.
    Object.assign(cam,this.boundCamera(cam.x,cam.y,cam.scale));
    const s=cam.scale,halfW=this.width/(2*s),halfH=this.height/(2*s);
    c.setTransform(this.dpr,0,0,this.dpr,0,0);R(c,'#9eae86',0,0,this.width,this.height);
    c.translate(this.width/2,this.height/2);c.scale(s,s);c.translate(-cam.x,-cam.y);c.imageSmoothingEnabled=false;
    if(!this.terrain.has(area))this.terrain.set(area,makeTerrain(area));c.drawImage(this.terrain.get(area),0,0);
    const left=cam.x-halfW-150,right=cam.x+halfW+150,top=cam.y-halfH-230,bottom=cam.y+halfH+150;
    this.drawWater(c,time,quality);
    // Ground decorations sit below all living actors.
    sign(c,218,326,'FOREST');sign(c,351,966,'LAKE');sign(c,1365,811,'GARDEN');
    // Fine bridge rails, arranged in separate depth layers.
    for(const x of [714,812]){R(c,'#62563f',x,582,5,133);R(c,'#c0a578',x,581,2,132);for(const y of [591,623,659,700]){R(c,'#6c5d45',x-3,y-20,10,27);R(c,'#cfb783',x-4,y-22,12,4);}}
    const queue=this.scenery.filter(o=>o.x>left&&o.x<right&&o.y>top&&o.y<bottom).map(o=>({...o,type:'scenery'}));
    if(companion)queue.push({...companion,type:'character',order:1});queue.push({...player,type:'character',order:2});
    queue.push({x:1129,y:584,type:'cat'});queue.sort((a,b)=>a.y-b.y||(a.order||0)-(b.order||0));
    for(const o of queue){
      if(o.type==='character')drawCharacter(c,o.x,o.y,{...o,time,scale:1.5});
      else if(o.type==='cat')this.drawCat(c,o.x,o.y,time);
      else {c.save();if(o.tree&&Math.abs(player.x-o.x)<80&&player.y<o.y-8&&player.y>o.y-155)c.globalAlpha=.58;const a=o.asset;c.drawImage(a.canvas,Math.round(o.x-a.ax),Math.round(o.y-a.ay));c.restore();}
    }
    if(activeObject){const object=typeof activeObject==='string'?WORLD.objects.find(o=>o.id===activeObject):activeObject;if(object&&Number.isFinite(object.x))this.drawMarker(c,object,time);}
    this.drawAtmosphere(c,time,quality,area,daylight,left,right,top,bottom);
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    // Warm corners and gentle color grading preserve the artwork's pixel edges.
    if(daylight==='sunset'){c.fillStyle='#de8d6b26';c.fillRect(0,0,this.width,this.height);}else if(daylight==='night'){c.fillStyle='#172b5b88';c.fillRect(0,0,this.width,this.height);}
    const vignette=c.createRadialGradient(this.width*.5,this.height*.42,this.width*.12,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.72);vignette.addColorStop(0,'#fff8dc00');vignette.addColorStop(1,daylight==='night'?'#12213944':'#3b4a2526');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
    if(daylight==='night'||daylight==='sunset')this.drawLights(c,daylight);
  }
  drawWater(c,time,quality) {
    c.save();c.beginPath();for(const shape of [pond,stream]){shape.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}c.clip();
    const n=quality==='low'?19:40;for(let i=0;i<n;i++){const x=112+((i*137.8+time*7)%800),y=515+(i*53.7)%395,w=7+Math.sin(time*1.3+i)*5;R(c,i%4?'#dbecce55':'#d8f2df88',x,y,w+8,1);if(i%3===0)R(c,'#d7e9d544',x+3,y+3,w*1.5,1);}
    // Reflections of the flowering canopy softly drift over the lake surface.
    for(let i=0;i<15;i++){const x=133+i*23,y=548+Math.sin(i)*13;R(c,'#e7d0c21c',x+Math.sin(time+i)*3,y,15,2);}
    c.restore();
  }
  drawCat(c,x,y,time) {
    c.save();c.translate(x,y);const tail=Math.sin(time*2)*2;oval(c,'#53624b33',0,1,15,4);oval(c,'#b68a69',0,-7,12,7);oval(c,'#eee0c4',-3,-5,9,5);R(c,'#644b3d',-9,-19,15,13);poly(c,'#674b3d',[[-9,-18],[-10,-26],[-3,-21]]);poly(c,'#674b3d',[[1,-21],[7,-26],[6,-17]]);R(c,'#f4e5c8',-7,-16,11,7);R(c,'#c59a7a',-9,-21,6,7);R(c,'#423d33',-6,-15,2,1);R(c,'#423d33',1,-15,2,1);R(c,'#c38b7c',-2,-12,2,2);R(c,'#b69163',-6,-8,10,2);R(c,'#839c9b',-3,-8,3,3);line(c,'#836245',[[8,-7],[15,-8],[17,-13+tail],[14,-16+tail]],4);c.restore();
  }
  drawMarker(c,o,time) {
    const y=o.y-48+Math.sin(time*3)*3;c.save();oval(c,'#faf0cd44',o.x,o.y+3,18+Math.sin(time*3)*2,6);
    poly(c,'#fff5d9',[[o.x,y-9],[o.x+6,y-3],[o.x,y+3],[o.x-6,y-3]]);poly(c,'#c9a267',[[o.x,y-6],[o.x+3,y-3],[o.x,y],[o.x-3,y-3]]);c.restore();
  }
  drawAtmosphere(c,time,quality,area,daylight,left,right,top,bottom) {
    const count=quality==='low'?14:38;
    for(let i=0;i<count;i++){
      const speed=9+(i%4)*3,x=((i*181.3+time*speed)%1720)-60+Math.sin(time*.65+i)*15,y=((i*83.8+time*(7+i%3))%1250)-100;
      if(x<left||x>right||y<top||y>bottom)continue;
      if(daylight==='night'){const opacity=.2+(Math.sin(time*2+i)+1)*.3;c.globalAlpha=opacity;R(c,'#fff2b0',x,y,2,2);R(c,'#dce8a1',x-2,y,1,1);c.globalAlpha=1;}
      else{const turn=Math.sin(time*2+i);R(c,i%3?'#f3c7c1b0':'#fff0d3b0',x,y,3+Math.abs(turn)*2,2);if(i%3===0)R(c,'#e5afb2aa',x+1,y+2,2,1);}
    }
    if(daylight!=='night')for(let i=0;i<7;i++){
      const x=340+i*151+Math.sin(time*.37+i*1.7)*43,y=390+(i*97)%490+Math.sin(time*.62+i)*18;if(x<left||x>right||y<top||y>bottom)continue;
      const wing=1+Math.abs(Math.sin(time*9+i))*3;R(c,i%2?'#f5dfad':'#f3cbd8',x-wing,y-2,wing,4);R(c,i%2?'#e2c789':'#d8a5bf',x+1,y-2,wing,4);R(c,'#7f785b',x,y-1,1,3);
    }
  }
  drawLights(c,daylight) {
    const cam=this.camera;c.save();c.globalCompositeOperation='screen';
    for(const [x,y] of [...this.lamps,[1291,229],[1120,408],[1193,408]]){
      const xx=(x-cam.x)*cam.scale+this.width/2,yy=(y-86-cam.y)*cam.scale+this.height/2,r=(daylight==='night'?95:55)*cam.scale;
      if(xx<-r||xx>this.width+r||yy<-r||yy>this.height+r)continue;
      const g=c.createRadialGradient(xx,yy,1,xx,yy,r);g.addColorStop(0,'#ffdb8977');g.addColorStop(.2,'#e9bb4e2c');g.addColorStop(1,'#daae5000');c.fillStyle=g;c.fillRect(xx-r,yy-r,r*2,r*2);
    }c.restore();
  }
}
