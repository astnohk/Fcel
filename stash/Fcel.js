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

var Cells = new Array();
var Networks = new Array();
var CellsID = 0;

var selected = null;
var selected_old = null;



// Events
window.addEventListener("load", init, false);
window.addEventListener("mousemove", draw, false);
window.addEventListener("mousedown", draw, false);



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
	document.getElementById("addCell").addEventListener("mousedown", makeCell, false);
	document.getElementById("connectCells").addEventListener("mousedown", connectCells, false);
	document.getElementById("sumCells").addEventListener("mousedown", sumCells, false);
	// Initialize canvas
	canvas = document.getElementById("mainPool");
	canvas.addEventListener("mousedown", mouseClick, false);
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("touchstart", mouseClick, false);
	canvas.addEventListener("touchmove", mouseMove, false);
	context = canvas.getContext("2d");
	makeCell();
	makeCell();
}



// ----- MAIN -----
function
makeCell()
{
	var cell = createDraggableElement("div");
	cell.id = "fcel" + CellsID;
	CellsID++;
	cell.className = "fcel";
	cell.style.top = window.innerHeight * Math.random() + "px";
	cell.style.left = window.innerWidth * Math.random() + "px";
	cell.addEventListener("mousedown", selectCell, false);
	document.getElementById("pool").appendChild(cell);
	Cells.push(cell);
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
connectCells()
{
	if (selected == null || selected_old == null) {
		return;
	}
	var net_selected = null;
	var net_selected_old = null;
	for (var i = 0; i < Networks.length; i++) {
		for (var j = 0; j < Networks[i].length; j++) {
			if (Networks[i][j] == selected) {
				net_selected = i;
			} else if (Networks[i][j] == selected_old) {
				net_selected_old = i;
			}
		}
	}
	if (net_selected == null && net_selected_old == null) {
		Networks.push([selected_old, selected]);
	} else if (net_selected == net_selected_old) {
		return;
	} else if (net_selected == null) {
		Networks[net_selected_old].push(selected);
	} else {
		Array.prototype.push.apply(Networks[net_selected], Networks[net_selected_old]);
		Networks.splice(net_selected_old, 1);
	}
}

function
sumCells()
{
}

function
draw()
{
	drawLines();
	drawSelected();
}

function
drawLines()
{
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.strokeStyle = 'lime';
	var cell0;
	var cell1;
	for (var i = 0; i < Networks.length; i++) {
		cell0 = window.getComputedStyle(Networks[i][0]);
		for (var j = 1; j < Networks[i].length; j++) {
			context.beginPath();
			cell1 = window.getComputedStyle(Networks[i][j]);
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

function
drawSelected()
{
	for (var i = 0; i < Cells.length; i++) {
		Cells[i].style.outlineStyle = "none";
	}
	if (selected != null) {
		selected.style.outlineStyle = "solid";
		selected.style.outlineColor = "rgba(255, 0, 0, 0.8)";
	}
	if (selected_old != null) {
		selected_old.style.outlineStyle = "solid";
		selected_old.style.outlineColor = "rgba(0, 255, 0, 0.8)";
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

