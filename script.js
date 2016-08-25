// Diff -- Vaughan Weatherall
// Gives a visual solution of a conservative differential equation

var scale = 1;
var can = document.getElementById("canva");
var ctx = can.getContext("2d");
var GX = can.height / scale; //make a little more
var GY = can.width / scale;
var grid = new Array(GY);
var dt = 1;
var hues, sats, care, iter, lightness;
var updateperiod;

reset();
updatescales();
can.addEventListener("mousedown", getPosition, false);
update();

function reset(){
  for(var i = 0; i < GY; i++){
    grid[i] = new Array(GX);
    for(var j = 0; j < GX; j++){
      grid[i][j] = { val : 0, col : {r : 0, g: 0, b: 0}, fdd : 0, change : 0};
    }
  }
  iter = 0;
}

function updatescales(){
  hues = Math.pow(1.2, $("#huescale").val()) - 1;
  sats = Math.pow(1.2, $("#satscale").val()) - 1;
  lightness = parseFloat($("#lightness").val())
  updateperiod = parseInt($("#timestep").val());
  care = Math.pow(1.2,  $("#care").val());
}

//works wrong if scrolled
function getPosition(event){
  var x = event.clientX - can.offsetLeft; 
  var y = event.clientY - can.offsetTop;

  var gx = Math.floor(x / scale);
  var gy = Math.floor(y / scale);

  grid[gy][gx].change = parseInt($("#clickpower").val());
}

// Populates the grid randomly
function randomgrid(){
  var factor = parseInt($("#clickpower").val());
  for(var i = 0; i < GY; i++){
    for(var j = 0; j < GX; j++){
      grid[i][j].val = Math.random() * factor;
    }
  }
}


// Currently sets fdd to f''(x) - 4 f(x) with wrapped boundaries
// By using a conservative equation, it stops the values exploding
function calculatelaplacian(){ 
  for(var i = 0; i < GY; i++){
    for(var j = 0; j < GX; j++){
      grid[i][j].fdd = -4 * grid[i][j].val; 
      if(j > 0){
        if(j == GX - 1){
          grid[i][j].fdd += grid[i][GX - 2].val + grid[i][0].val;
        } else {
          grid[i][j].fdd += grid[i][j - 1].val + grid[i][j + 1].val;
        }
      } else {
        grid[i][j].fdd += grid[i][GX - 1].val + grid[i][1].val;
      }

      if(i > 0){
        if(i == GY - 1){
          grid[i][j].fdd += grid[GY - 2][j].val + grid[0][j].val;
        } else {
          grid[i][j].fdd += grid[i - 1][j].val + grid[i + 1][j].val;
        }
      } else {
        grid[i][j].fdd += grid[1][j].val + grid[GY - 1][j].val;
      }
      grid[i][j].fdd /= 4;
    }
  }
}

function calculategrid(){ 
  for(var i = 0; i < GY; i++){
    for(var j = 0; j < GX; j++){
      var newval = grid[i][j].val + grid[i][j].fdd * dt; // df/dt = /\^2 f
      grid[i][j].val = (care * grid[i][j].val + newval) / (1 + care) + grid[i][j].change;
      grid[i][j].change = 0;
    }
  }
}


// modified from TinyColor -- http://github.com/bgrins/TinyColor
// removed bounds. hsv should be in [0 1]
// Converts between hue and rgb
function hslToRgb(h, s, l) {
  var r, g, b;

  function hue2rgb(p, q, t) {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  if(s === 0) {
    r = g = b = l; // achromatic
  }
  else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function colourdiff(col1, col2){
  return Math.pow(col1.r - col2.r, 2) + Math.pow(col1.g - col2.g, 2) +Math.pow(col1.b - col2.b, 2);
}

function redrawgrid(){
  for(var i = 0; i < GY; i++){
    for(var j = 0; j < GX; j++){
      var newc = hslToRgb(
          (Math.abs(hues * grid[i][j].val) % 360) / 360, 
          .5 + (Math.abs(sats * grid[i][j].val) % 100) / 200, lightness);
      if(newc.r + newc.g + newc.b > 1e6) continue; //hsltorgb occasionally gives bad values?
      var diff = colourdiff(newc, grid[i][j].col);

      if(iter == 1 || diff > 1){ //only update square if there's a significant change
        grid[i][j].col = newc;
        color = "rgb(" + newc.r + "," + newc.g + "," + newc.b + ")";
        ctx.fillStyle = color;
        ctx.fillRect(scale * j, scale * i, scale, scale);
      }
    }
  }
}

function update(){
  iter++;
  calculatelaplacian(); //update fdd
  calculategrid();
  redrawgrid();
  setTimeout(update, updateperiod);
}
