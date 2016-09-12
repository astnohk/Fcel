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
var Edges = new Array();
var nonDirectional = 0;
var directionAtoB = 1;
var directionBtoA = -1;

var selected = null;
var selected_old = null;



// Events
window.addEventListener("load", init, false);
window.addEventListener("mousemove", draw, false);
window.addEventListener("touchmove", draw, false);
window.addEventListener("scroll", draw, false);
window.addEventListener("resize", draw, false);
window.addEventListener("mousedown", function (event) { updateCells(); draw(); }, false);
window.addEventListener("touchstart", function (event) { updateCells(); draw(); }, false);
window.addEventListener("input", function (event) { updateCells(); draw(); }, false);



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
	document.getElementById("deleteCell").addEventListener("mousedown", deleteSelectedCell, false);
	document.getElementById("connectCells").addEventListener("mousedown", connectSelectedCells, false);
	document.getElementById("layerAdd").addEventListener("mousedown", addLayer, false);
	document.getElementById("sumCells").addEventListener("mousedown", sumSelectedNetwork, false);
	document.getElementById("prodCells").addEventListener("mousedown", prodSelectedNetwork, false);
	document.getElementById("layerUp").addEventListener("mousedown", function () { if (currentLayer < Layers.length - 1) { currentLayer++; } }, false);
	document.getElementById("layerDown").addEventListener("mousedown", function () { if (currentLayer > 0) { currentLayer--; } }, false);
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
		Layers.push({});
		var offset = 5;
		var layerSelector = document.getElementById("layerSelector");
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
	cell.style.top = window.scrollY + (window.innerHeight - 100) * Math.random() + "px";
	cell.style.left = window.scrollX + (window.innerWidth - 100) * Math.random() + "px";
	cell.addEventListener("mousedown", selectCell, false);
	cell.edges = new Array();
	pool.appendChild(cell);
	Cells.push(cell);
	return cell;
}

function
deleteSelectedCell()
{
	deleteCell(selected);
	selected = null;
}

function
deleteCell(cell)
{
	if (cell == null) {
		return;
	}
	for (var i = 0; i < cell.edges.length; i++) {
		var index;
		if (cell.edges[i].verticeA == cell) {
			index = cell.edges[i].verticeB.edges.indexOf(cell.edges[i]);
			cell.edges[i].verticeB.edges.splice(index, 1);
		} else {
			index = cell.edges[i].verticeA.edges.indexOf(cell.edges[i]);
			cell.edges[i].verticeA.edges.splice(index, 1);
		}
		index = Edges.indexOf(cell.edges[i]);
		Edges.splice(index, 1);
	}
	Cells.splice(Cells.indexOf(cell), 1);
	cell.remove();
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
findNode(cellTarget, cellStart, layer)
{
	var stack = [{prev: null, cell: cellStart}];
	var tmp;
	while (stack.length > 0) {
		tmp = stack.pop();
		if (tmp.cell == cellTarget) {
			return tmp.cell;
		}
		// Search and push node to stack connecting to current cell
		for (var i = 0; i < tmp.cell.edges.length; i++) {
			if (tmp.cell.edges[i].layer != layer) {
				// Does NOT on the interest layer
				continue;
			}
			if (tmp.cell.edges[i].verticeB == tmp.cell &&
			    tmp.cell.edges[i].verticeA != tmp.prev) {
				stack.push({prev: tmp.cell, cell: tmp.cell.edges[i].verticeA});
			} else if (tmp.cell.edges[i].verticeA == tmp.cell &&
			    tmp.cell.edges[i].verticeB != tmp.prev) {
				stack.push({prev: tmp.cell, cell: tmp.cell.edges[i].verticeB});
			}
		}
	}
	return null;
}

function
createNodeList(cell, layer)
{
	var nodes = [];
	var stack = [{prev: null, cell: cell}];
	var tmp;
	while (stack.length > 0) {
		tmp = stack.pop();
		// Search and push node to stack connecting to current cell
		for (var i = 0; i < tmp.cell.edges.length; i++) {
			if (tmp.cell.edges[i].layer != layer) {
				// Does NOT on the interest layer
				continue;
			}
			if (tmp.cell.edges[i].verticeB == tmp.cell &&
			    tmp.cell.edges[i].verticeA != tmp.prev) {
				nodes.push(tmp.cell.edges[i].verticeA);
				stack.push({prev: tmp.cell, cell: tmp.cell.edges[i].verticeA});
			} else if (tmp.cell.edges[i].verticeA == tmp.cell &&
			    tmp.cell.edges[i].verticeB != tmp.prev) {
				nodes.push(tmp.cell.edges[i].verticeB);
				stack.push({prev: tmp.cell, cell: tmp.cell.edges[i].verticeB});
			}
		}
	}
	return nodes;
}

function
connectSelectedCells()
{
	connectCells(selected, selected_old, nonDirectional, currentLayer);
}

// direction: 0: bidirectional, 1: directional
function
connectCells(cellTarget, cellConnectTo, direction, layer)
{
	var i;
	if (cellTarget == null || cellConnectTo == null) {
		return;
	}
	// Disconnect each other if they are already connected
	var edge = cellTarget.edges.find(
	    function (edge) {
		    return (edge.layer == layer && ((edge.verticeA == cellConnectTo) || (edge.verticeB == cellConnectTo)));
	    });
	if (typeof edge !== "undefined") {
		// Remove the edge
		cellTarget.edges.splice(cellTarget.edges.indexOf(edge), 1);
		cellConnectTo.edges.splice(cellConnectTo.edges.indexOf(edge), 1);
		Edges.splice(Edges.indexOf(edge), 1);
		return;
	}
	// Decide whether they are connectable or not
	var find = findNode(cellTarget, cellConnectTo, layer);
	if (find == null) {
		// Add edge
		var newEdge = {layer: layer, direction: (direction > 0 ? 1 : direction < 0 ? -1 : 0), verticeA: cellTarget, verticeB: cellConnectTo};
		if (direction >= 0) {
			Edges.push(newEdge);
		} else {
			Edges.push(newEdge);
		}
		cellTarget.edges.push(newEdge);
		cellConnectTo.edges.push(newEdge);
	}
}

function
sumSelectedNetwork()
{
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
	connectCells(cellSum, selected, directionBtoA, currentLayer);
	// Update
	updateCellsSum();
}

function
updateCellsSum()
{
	var sumCells = document.getElementsByClassName("fcelSum");
	for (var i = 0; i < sumCells.length; i++) {
		var net = createNodeList(sumCells[i], sumCells[i].layer);
		if (net == null) {
			continue;
		}
		var sum = 0;
		for (var j = 0; j < net.length; j++) {
			if (net[j].className !== "fcel" &&
			    net[j].layer == sumCells[i].layer) {
				// Another sumCell or prodCell on same layer
				// may become recurrent network
				continue;
			}
			var num = parseFloat(net[j].value);
			if (isNaN(num) == false) {
				sum += num;
			}
		}
		sumCells[i].value = sum;
	}
}

function
prodSelectedNetwork()
{
	addCellProd(selected);
}

function
addCellProd(cell)
{
	var cellProd = addCell();
	cellProd.className = "fcelProd";
	cellProd.layer = currentLayer;
	cellProd.value = 0;
	// Connect prod cell to Network of cell
	connectCells(cellProd, selected, directionBtoA, currentLayer);
	// Update
	updateCellsProd();
}

function
updateCellsProd()
{
	var prodCells = document.getElementsByClassName("fcelProd");
	for (var i = 0; i < prodCells.length; i++) {
		var net = createNodeList(prodCells[i], prodCells[i].layer);
		if (net == null) {
			continue;
		}
		var prod = 1.0;
		for (var j = 0; j < net.length; j++) {
			if (net[j].className !== "fcel" &&
			    net[j].layer == prodCells[i].layer) {
				// Another sumCell or prodCell on same layer
				// may become recurrent network
				continue;
			}
			var num = parseFloat(net[j].value, 10);
			if (isNaN(num) == false) {
				prod *= num;
			}
		}
		prodCells[i].value = prod;
	}
}

function
updateCells()
{
	updateCellsSum();
	updateCellsProd();
}

function
draw()
{
	var sx = window.scrollX;
	var sy = window.scrollY;
	// Refresh
	//context.clearRect(0, 0, canvas.width, canvas.height);
	context.clearRect(sx, sy, sx + window.innerWidth, sy + window.innerHeight);
	// Background
	context.fillStyle = negateColor("rgba(" + colormap[currentLayer].red + "," + colormap[currentLayer].green + "," + colormap[currentLayer].blue + ",0.1)");
	context.fillRect(sx, sy, sx + window.innerWidth, sy + window.innerHeight);
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
	// Draw lines except current layer
	for (var n = 0; n < Edges.length; n++) {
		cell0 = window.getComputedStyle(Edges[n].verticeA);
		cell1 = window.getComputedStyle(Edges[n].verticeB);
		var layer = Edges[n].layer;
		context.strokeStyle = "rgba(" + colormap[layer].red + "," + colormap[layer].green + "," + colormap[layer].blue + ",0.8)";
		if (layer == currentLayer) {
			context.lineWidth = 6;
		} else {
			context.lineWidth = 3;
		}
		var A = {
			x: parseInt(cell0.left, 10) + parseInt(cell0.width, 10) / 2,
			y: parseInt(cell0.top, 10) + parseInt(cell0.height, 10) / 2};
		var B = {
			x: parseInt(cell1.left, 10) + parseInt(cell1.width, 10) / 2,
			y: parseInt(cell1.top, 10) + parseInt(cell1.height, 10) / 2};
		context.beginPath();
		context.moveTo(A.x, A.y);
		context.lineTo(B.x, B.y);
		if (Edges[n].direction != 0) {
			var norm = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
			var base = {x: (A.x + B.x) / 2, y: (A.y + B.y) / 2};
			var v;
			if (Edges.direction > 0) {
				v = {x: (A.x - B.x) / norm * 30, y: (A.y - B.y) / norm * 30};
			} else {
				v = {x: (B.x - A.x) / norm * 30, y: (B.y - A.y) / norm * 30};
			}
			context.moveTo(base.x, base.y);
			context.lineTo(base.x + v.x * Math.cos(Math.PI / 6.0) - v.y * Math.sin(Math.PI / 6.0),
			    base.y + v.y * Math.cos(Math.PI / 6.0) + v.x * Math.sin(Math.PI / 6.0))
			context.moveTo(base.x, base.y);
			context.lineTo(base.x + v.x * Math.cos(Math.PI / 6.0) + v.y * Math.sin(Math.PI / 6.0),
			    base.y + v.y * Math.cos(Math.PI / 6.0) - v.x * Math.sin(Math.PI / 6.0))
		}
		context.stroke();
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

