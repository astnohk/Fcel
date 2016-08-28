// The code written in BSD/KNF indent style
"use strict";

var timeClock;

var pool;
var poolStyle;
var sizePool = {width: 0, height: 0};
var canvas;
var context;
var prev_clientX = 0;
var prev_clientY = 0;

var maxNumberOfLayers = 32;
var currentLayer = 0;
var Layers = new Array();
var colormapNumber = maxNumberOfLayers;
var colormap = new Array(colormapNumber);
var Cells = new Array();
var CellsID = 0;

var selected = null;
var selected_old = null;



// Events
window.addEventListener("load", init, false);
window.addEventListener("mousemove", draw, false);
window.addEventListener("touchmove", draw, false);
window.addEventListener("mousedown", function (event) { updateCells(); draw(); }, false);
window.addEventListener("touchstart", function (event) { updateCells(); draw(); }, false);
window.addEventListener("change", function (event) { updateCells(); draw(); }, false);



// ----- Initialize -----
function
init()
{
	// Get pool
	pool = document.getElementById("pool");
	poolStyle = window.getComputedStyle(pool);
	sizePool.width = parseInt(poolStyle.width, 10);
	sizePool.height = parseInt(poolStyle.height, 10);
	// Events
	pool.addEventListener("mousedown", unselectCell, false);
	document.getElementById("addCell").addEventListener("mousedown", addCell, false);
	document.getElementById("deleteCell").addEventListener("mousedown", deleteCell, false);
	document.getElementById("connectCells").addEventListener("mousedown", connectSelectedCells, false);
	document.getElementById("sumCells").addEventListener("mousedown", sumSelectedNetwork, false);
	document.getElementById("layerUp").addEventListener("mousedown", function () { if (currentLayer < Layers.length - 1) { currentLayer++; } }, false);
	document.getElementById("layerDown").addEventListener("mousedown", function () { if (currentLayer > 0) { currentLayer--; } }, false);
	document.getElementById("layerAdd").addEventListener("mousedown", addLayer, false);
	// Initialize canvas
	canvas = document.getElementById("mainPool");
	canvas.addEventListener("mousedown", mouseClick, false);
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("touchstart", mouseClick, false);
	canvas.addEventListener("touchmove", mouseMove, false);
	context = canvas.getContext("2d");
	// Initialize colormap
	makeColormap();
	// Initialize layer
	addLayer();
	// Add initial cells
	addCell();
	addCell();
}



// ----- MAIN -----
function
makeColormap()
{
	var tmp = new Array(colormapNumber);
	for (var i = 0; i < Math.floor(colormapNumber / 2); i++) {
		tmp[i] = {
		    red: Math.max(255 - Math.floor(i * 255.0 * 2.0 / colormapNumber), 0),
		    green: Math.min(Math.floor(i * 255.0 * 2.0 / colormapNumber), 255),
		    blue: 0};
	}
	for (var i = Math.floor(colormapNumber / 2); i < colormapNumber; i++) {
		tmp[i] = {
		    red: 0,
		    green: Math.max(255 - Math.floor((i - colormapNumber / 2) * 255.0 * 2.0 / colormapNumber), 0),
		    blue: Math.min(Math.floor((i - colormapNumber / 2) * 255.0 * 2.0 / colormapNumber), 255)}
	}
	// Shuffle
	for (var i = 0; i < colormapNumber; i++) {
		colormap[i] = tmp[(i * Math.round(colormapNumber / 3 + 0.5) + ((i % 2) == 0 ? 0 : Math.round(colormapNumber / 6))) % colormapNumber];
	}
}

function
addLayer()
{
	if (Layers.length < maxNumberOfLayers) {
		var offset = 5;
		var layerSelector = document.getElementById("layerSelector");
		Layers.push({Networks: new Array()});
		var selector = document.createElement("div");
		selector.className = "layerSelectorLayer";
		selector.id = "layer0" + (Layers.length - 1);
		selector.style.left = offset * (Layers.length - 1) + "px";
		selector.style.backgroundColor = "rgba(" + colormap[Layers.length - 1].red + "," + colormap[Layers.length - 1].green + "," + colormap[Layers.length - 1].blue + ",0.8)";
		selector.addEventListener("mousedown", function (event) { currentLayer = parseInt(event.target.id.slice(event.target.id.indexOf('0')), 10); }, false);
		layerSelector.appendChild(selector);
		layerSelector.style.width = (40 + offset * (Layers.length - 1)) + "px";
		currentLayer = Layers.length - 1;
	}
}

function
addCell()
{
	var cell = createDraggableElement("input");
	cell.id = "fcel" + CellsID;
	CellsID++;
	cell.className = "fcel";
	cell.type = "text";
	cell.style.top = window.innerHeight * Math.random() + "px";
	cell.style.left = window.innerWidth * Math.random() + "px";
	cell.addEventListener("mousedown", selectCell, false);
	pool.appendChild(cell);
	Cells.push(cell);
	return cell;
}

function
deleteCell()
{
	if (selected == null) {
		return;
	}
	for (var n = 0; n < Layers.length; n++) {
		for (var i = 0; i < Layers[n].Networks.length; i++) {
			var index = Layers[n].Networks[i].indexOf(selected);
			if (index >= 0) {
				Layers[n].Networks[i].splice(index, 1);
			}
		}
	}
	Cells.splice(Cells.indexOf(selected), 1);
	selected.remove();
	selected = null;
}

function
selectCell(event)
{
	if ((event.type === "mousedown" && event.button == 0) ||
	    (event.type === "touchstart" && event.touches.length == 1)) {
		if (event.target != selected) {
			selected_old = selected;
			selected = event.target;
		}
	}
}

function
unselectCell(event)
{
	if (event.target.id === "pool") {
		selected = null;
		selected_old = null;
	}
}

function
getNetwork(cell)
{
	for (var i = 0; i < Layers[currentLayer].Networks.length; i++) {
		for (var j = 0; j < Layers[currentLayer].Networks[i].length; j++) {
			if (Layers[currentLayer].Networks[i][j] == cell) {
				return Layers[currentLayer].Networks[i];
			}
		}
	}
	return null;
}

function
getNetworkOnLayer(cell, layerIndex)
{
	for (var i = 0; i < Layers[layerIndex].Networks.length; i++) {
		for (var j = 0; j < Layers[layerIndex].Networks[i].length; j++) {
			if (Layers[layerIndex].Networks[i][j] == cell) {
				return Layers[layerIndex].Networks[i];
			}
		}
	}
	return null;
}

function
connectSelectedCells()
{
	connectCells(selected, selected_old);
}

function
connectCells(cell0, cell1)
{
	if (cell0 == null || cell1 == null) {
		return;
	}
	var net0 = getNetwork(cell0);
	var net1 = getNetwork(cell1);
	if (net0 == null && net1 == null) {
		Layers[currentLayer].Networks.push([cell0, cell1]);
	} else if (net0 == net1) {
		return;
	} else if (net0 == null) {
		net1.push(cell0);
	} else if (net1 == null) {
		net0.push(cell1);
	} else {
		Array.prototype.push.apply(net0, net1);
		Layers[currentLayer].Networks.splice(Layers[currentLayer].Networks.indexOf(net1), 1);
	}
}

function
sumSelectedNetwork()
{
	var net = getNetwork(selected);
	if (net == null) {
		return;
	}
	addCellSum(selected);
}

function
addCellSum(cell)
{
	var cellSum = addCell();
	cellSum.className = "fcelSum";
	cellSum.layer = currentLayer;
	cellSum.value = 0;
	// Connect sum cell to Network of cell
	connectCells(selected, cellSum);
	// Update
	updateCellsSum();
}

function
updateCellsSum()
{
	var sumCells = document.getElementsByClassName("fcelSum");
	for (var i = 0; i < sumCells.length; i++) {
		var net = getNetworkOnLayer(sumCells[i], sumCells[i].layer);
		var sum = 0;
		for (var j = 0; j < net.length; j++) {
			if (net[j].className === "fcelSum" && net[j].layer == sumCells[i].layer) {
				continue;
			}
			var num = parseInt(net[j].value, 10);
			if (isNaN(num) == false) {
				sum += num;
			}
		}
		sumCells[i].value = sum;
	}
}

function
updateCells()
{
	updateCellsSum();
}

function
draw()
{
	// Refresh
	context.clearRect(0, 0, canvas.width, canvas.height);
	// Background
	context.fillStyle = negateColor("rgba(" + colormap[currentLayer].red + "," + colormap[currentLayer].green + "," + colormap[currentLayer].blue + ",0.1)");
	context.fillRect(0, 0, canvas.width, canvas.height);
	// Draw
	drawLines();
	drawSelected();
	drawLayerSelector();
}

function
drawLines()
{
	var cell0;
	var cell1;
	for (var n = 0; n < Layers.length; n++) {
		context.strokeStyle = "rgba(" + colormap[n].red + "," + colormap[n].green + "," + colormap[n].blue + ",0.8)";
		if (n == currentLayer) {
			context.lineWidth = 6;
		} else {
			context.lineWidth = 3;
		}
		for (var i = 0; i < Layers[n].Networks.length; i++) {
			cell0 = window.getComputedStyle(Layers[n].Networks[i][0]);
			for (var j = 1; j < Layers[n].Networks[i].length; j++) {
				context.beginPath();
				cell1 = window.getComputedStyle(Layers[n].Networks[i][j]);
				context.moveTo(
				    parseInt(cell0.left, 10) + parseInt(cell0.width, 10) / 2,
				    parseInt(cell0.top, 10) + parseInt(cell0.height, 10) / 2);
				context.lineTo(
				    parseInt(cell1.left, 10) + parseInt(cell1.width, 10) / 2,
				    parseInt(cell1.top, 10) + parseInt(cell1.height, 10) / 2);
				context.stroke();
				cell0 = cell1;
			}
		}
	}
	// Reset context
	context.lineWidth = 1;
}

function
drawSelected()
{
	for (var i = 0; i < Cells.length; i++) {
		Cells[i].style.outlineStyle = "none";
	}
	if (selected != null) {
		selected.style.outlineStyle = "solid";
		selected.style.outlineColor = "rgba(255, 0, 0, 0.7)";
	}
	if (selected_old != null) {
		selected_old.style.outlineStyle = "solid";
		selected_old.style.outlineColor = "rgba(0, 255, 0, 0.7)";
	}
}

function
drawLayerSelector()
{
	var selector = document.getElementsByClassName("layerSelectorLayer");
	for (var n = 0; n < selector.length; n++) {
		if (n == currentLayer) {
			selector[n].style.outlineStyle = "solid";
		} else {
			selector[n].style.outlineStyle = "none";
		}
	}
}



// ----- EVENT -----
function
mouseClick(event)
{
	event.preventDefault();
	if (event.type === "mousedown") {
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchstart") {
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

function
mouseMove(event)
{
	event.preventDefault();
	if (event.type === "mousemove") {
		if ((event.buttons & 1) != 0) {
		} else if ((event.buttons & 4) != 0) {
			var move = {x: 0, y: 0}
			move.x = event.clientX - prev_clientX;
			move.y = event.clientY - prev_clientY;
		}
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchmove") {
		if (event.touches.length == 1) {
		} else if (event.touches.length == 2) {
			var move = {x: 0, y: 0}
			move.x = event.touches[0].clientX - prev_clientX;
			move.y = event.touches[0].clientY - prev_clientY;
		}
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

