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
var CellsID = 0;



// Events
window.addEventListener("load", init, false);
window.addEventListener("mousemove", draw, false);



// ----- Initialize -----
function
init()
{
	// Get pool
	pool = document.getElementById("pool");
	poolStyle = window.getComputedStyle(pool);
	sizePool.width = parseInt(poolStyle.width, 10);
	sizePool.height = parseInt(poolStyle.height, 10);
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
	cell.addEventListener("mousedown", dragWindow, false);
	cell.addEventListener("touchstart", dragWindow, false);
	document.getElementById("pool").appendChild(cell);
	Cells.push(cell);
}

function
draw()
{
	drawLines();
}

function
drawLines()
{
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.strokeStyle = 'lime';
	var cell0 = window.getComputedStyle(Cells[0]);
	var cell1;
	for (var i = 1; i < Cells.length; i++) {
		context.beginPath();
		cell1 = window.getComputedStyle(Cells[i]);
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

