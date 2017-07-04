// The code written in BSD/KNF indent style
"use strict";

class Fcel {
	constructor(windowSystemRoot, rootWindow) {
		this.SysRoot = windowSystemRoot;
		this.rootWindow = rootWindow;
		this.rootWindow.style.overflow = "hidden";
		this.rootWindowStyle = window.getComputedStyle(this.rootWindow);
		this.timeClock = 0;

		this.pool = null;
		this.canvas = null;
		this.context = null;
		this.prev_clientX = 0;
		this.prev_clientY = 0;

		this.viewPoint = {x: 0, y: 0};
		this.maxNumberOfLayers = 32;
		this.currentLayer = 0;
		this.Layers = new Array();
		this.ColormapNumber = this.maxNumberOfLayers;
		this.Colormap = new Array(this.ColormapNumber);
		this.Cells = new Array();
		this.CellsID = 0;
		this.Edges = new Array();
		this.nonDirectional = 0;
		this.directionAtoB = 1;
		this.directionBtoA = -1;

		this.selected = null;
		this.selected_old = null;

		// Elements
		// Toolbar
		this.toolsToolbar = null;
		this.toolsAddCell = null;
		this.toolsDeleteCell = null;
		this.toolsConnectCells = null;
		this.toolsAddLayer = null;
		this.toolsSumCells = null;
		this.toolsProdCells = null;
		// Layer tools
		this.toolsLayerTools = null;
		this.toolsUpLayer = null;
		this.toolsDownLayer = null;
		this.toolsLayerSelector = null;

		this.init();
	}

	// ----- Initialize -----
	init()
	{
		// Events
		this.rootWindow.rootInstance = this;
		this.rootWindow.addEventListener("mousemove", function (e) { e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("touchmove", function (e) { e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("scroll", function (e) { e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("resize", function (e) { e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.updateCells(); e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("touchstart", function (e) { e.currentTarget.rootInstance.updateCells(); e.currentTarget.rootInstance.drawFcel(); }, false);
		this.rootWindow.addEventListener("input", function (e) { e.currentTarget.rootInstance.updateCells(); e.currentTarget.rootInstance.drawFcel(); }, false);

		// Append Elements to rootWindow
		this.prepareCanvas();
		this.prepareFcelPool();
		this.prepareButtons();
		// Initialize Colormap
		this.makeColormap();
		// Initialize layer
		this.addLayer();
		// Add initial cells
		this.addCell();
		this.addCell();
		// Initial drawing
		this.drawFcel();
	}



	// ----- MAIN -----
	prepareCanvas()
	{
		// Initialize canvas
		this.canvas = document.createElement("canvas");
		this.canvas.rootInstance = this;
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.canvas.addEventListener(
		    "windowdrag",
		    function (e) {
			    let style = window.getComputedStyle(e.currentTarget);
			    e.currentTarget.width = parseInt(style.width, 10);
			    e.currentTarget.height = parseInt(style.height, 10);
		    },
		    false);
		this.canvas.id = "mainPool";
		this.canvas.style.position = "absolute";
		this.canvas.style.top = "0px";
		this.canvas.style.left = "0px";
		this.canvas.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.MouseClick(e); }, false);
		this.canvas.addEventListener("mousemove", function (e) { e.currentTarget.rootInstance.MouseMove(e); }, false);
		this.canvas.addEventListener("touchstart", function (e) { e.currentTarget.rootInstance.MouseClick(e); }, false);
		this.canvas.addEventListener("touchmove", function (e) { e.currentTarget.rootInstance.MouseMove(e); }, false);
		this.context = this.canvas.getContext("2d");
		this.rootWindow.appendChild(this.canvas);
		let canvasStyle = window.getComputedStyle(this.canvas);
		this.canvas.width = parseInt(canvasStyle.width, 10);
		this.canvas.height = parseInt(canvasStyle.height, 10);
	}

	prepareFcelPool()
	{
		// Initialize Fcel Pool
		this.pool = document.createElement("div");
		this.pool.id = "FcelPool";
		this.pool.style.width = "100%";
		this.pool.style.height = "100%";
		this.pool.rootInstance = this;
		this.pool.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.unselectCell(e); }, false);
		this.rootWindow.appendChild(this.pool);
	}

	prepareButtons()
	{
		// Toolbar
		this.toolsToolbar = document.createElement("div");
		this.toolsToolbar.id = "FcelToolbar";
		this.rootWindow.appendChild(this.toolsToolbar);
		// ToolBar buttons
		this.toolsAddCell = document.createElement("div");
		this.toolsAddCell.innerHTML = "+";
		this.toolsAddCell.className = "FcelTools";
		this.toolsAddCell.rootInstance = this;
		this.toolsAddCell.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.addCell() }, false);
		this.toolsDeleteCell = document.createElement("div");
		this.toolsDeleteCell.innerHTML = "-";
		this.toolsDeleteCell.className = "FcelTools";
		this.toolsDeleteCell.rootInstance = this;
		this.toolsDeleteCell.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.deleteSelectedCell() }, false);
		this.toolsConnectCells = document.createElement("div");
		this.toolsConnectCells.innerHTML = "<nobr>-&gt;</nobr>";
		this.toolsConnectCells.className = "FcelTools";
		this.toolsConnectCells.rootInstance = this;
		this.toolsConnectCells.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.connectSelectedCells() }, false);
		this.toolsAddLayer = document.createElement("div");
		this.toolsAddLayer.innerHTML = "&#9633;+";
		this.toolsAddLayer.className = "FcelTools";
		this.toolsAddLayer.rootInstance = this;
		this.toolsAddLayer.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.addLayer() }, false);
		this.toolsSumCells = document.createElement("div");
		this.toolsSumCells.innerHTML = "&Sigma;";
		this.toolsSumCells.className = "FcelTools";
		this.toolsSumCells.rootInstance = this;
		this.toolsSumCells.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.sumSelectedNetwork() }, false);
		this.toolsProdCells = document.createElement("div");
		this.toolsProdCells.innerHTML = "&Pi;";
		this.toolsProdCells.className = "FcelTools";
		this.toolsProdCells.rootInstance = this;
		this.toolsProdCells.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.prodSelectedNetwork() }, false);
		this.toolsToolbar.appendChild(this.toolsAddCell);
		this.toolsToolbar.appendChild(this.toolsDeleteCell);
		this.toolsToolbar.appendChild(this.toolsConnectCells);
		this.toolsToolbar.appendChild(this.toolsAddLayer);
		this.toolsToolbar.appendChild(this.toolsSumCells);
		this.toolsToolbar.appendChild(this.toolsProdCells);

		// Layer Tools
		this.toolsLayerTools = document.createElement("div");
		this.toolsLayerTools.id = "FcelLayerTools";
		this.rootWindow.appendChild(this.toolsLayerTools);
		// Layer Tools buttons
		this.toolsUpLayer = document.createElement("div");
		this.toolsUpLayer.innerHTML = "&and;";
		this.toolsUpLayer.id = "upFcelLayer";
		this.toolsUpLayer.className = "FcelLayerSelectorControl";
		this.toolsUpLayer.style.cursor = "pointer";
		this.toolsUpLayer.rootInstance = this;
		this.toolsUpLayer.addEventListener(
		    "mousedown",
		    function (e) {
			    let o = e.currentTarget.rootInstance;
			    if (o.currentLayer < o.Layers.length - 1) {
				    o.currentLayer++;
			    }
			    console.log("up");
		    },
		    false);
		this.toolsDownLayer = document.createElement("div");
		this.toolsDownLayer.id = "downFcelLayer";
		this.toolsDownLayer.className = "FcelLayerSelectorControl";
		this.toolsDownLayer.innerHTML = "&or;";
		this.toolsDownLayer.style.cursor = "pointer";
		this.toolsDownLayer.rootInstance = this;
		this.toolsDownLayer.addEventListener(
		    "mousedown",
		    function (e) {
			    let o = e.currentTarget.rootInstance;
			    if (o.currentLayer > 0) {
				    o.currentLayer--;
			    }
			    console.log("down");
		    },
		    false);
		this.toolsLayerSelector = document.createElement("div");
		this.toolsLayerSelector.id = "FcelLayerSelector";
		this.toolsLayerTools.appendChild(this.toolsUpLayer);
		this.toolsLayerTools.appendChild(this.toolsLayerSelector);
		this.toolsLayerTools.appendChild(this.toolsDownLayer);
	}

	makeColormap()
	{
		let tmp = new Array(this.ColormapNumber);
		for (let i = 0; i < Math.floor(this.ColormapNumber / 2); i++) {
			tmp[i] = {
			    red: Math.max(255 - Math.floor(i * 255.0 * 2.0 / this.ColormapNumber), 0),
			    green: Math.min(Math.floor(i * 255.0 * 2.0 / this.ColormapNumber), 255),
			    blue: 0};
		}
		for (let i = Math.floor(this.ColormapNumber / 2); i < this.ColormapNumber; i++) {
			tmp[i] = {
			    red: 0,
			    green: Math.max(255 - Math.floor((i - this.ColormapNumber / 2) * 255.0 * 2.0 / this.ColormapNumber), 0),
			    blue: Math.min(Math.floor((i - this.ColormapNumber / 2) * 255.0 * 2.0 / this.ColormapNumber), 255)}
		}
		// Shuffle
		for (let i = 0; i < this.ColormapNumber; i++) {
			this.Colormap[i] = tmp[(i * Math.round(this.ColormapNumber / 3 + 0.5) + ((i % 2) == 0 ? 0 : Math.round(this.ColormapNumber / 6))) % this.ColormapNumber];
		}
	}

	addLayer()
	{
		if (this.Layers.length < this.maxNumberOfLayers) {
			this.Layers.push({});
			let offset = 5;
			let selector = document.createElement("div");
			selector.className = "FcelLayerSelectorLayer";
			selector.id = "layer0" + (this.Layers.length - 1);
			selector.style.left = offset * (this.Layers.length - 1) + "px";
			selector.style.backgroundColor = "rgba(" + this.Colormap[this.Layers.length - 1].red + "," + this.Colormap[this.Layers.length - 1].green + "," + this.Colormap[this.Layers.length - 1].blue + ",0.8)";
			selector.rootInstance = this;
			selector.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.currentLayer = parseInt(e.target.id.slice(e.target.id.indexOf('0')), 10); }, false);
			this.toolsLayerSelector.appendChild(selector);
			this.toolsLayerSelector.style.width = (40 + offset * (this.Layers.length - 1)) + "px";
			this.currentLayer = this.Layers.length - 1;
		}
	}

	addCell()
	{
		let style = window.getComputedStyle(this.rootWindow, "");
		let cell = this.SysRoot.createDraggableElement("input");
		cell.id = "Fcel" + this.CellsID;
		this.CellsID++;
		cell.className = "Fcel";
		cell.type = "text";
		cell.absolutePosition = {
			x: (Math.min(window.innerHeight, parseInt(style.height, 10)) - 100) * Math.random(),
			y: (Math.min(window.innerWidth, parseInt(style.width, 10)) - 100) * Math.random()
		    };
		cell.style.top = cell.absolutePosition.x - this.viewPoint.x + "px";
		cell.style.left = cell.absolutePosition.y - this.viewPoint.y + "px";
		cell.rootInstance = this;
		cell.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.selectCell(e); }, false);
		cell.addEventListener(
		    "windowdrag",
		    function (e) {
			    let win = e.currentTarget;
			    let root = win.rootInstance;
			    win.absolutePosition.x = e.detail.position.x - root.viewPoint.x;
			    win.absolutePosition.y = e.detail.position.y - root.viewPoint.y;
		    },
		    false);
		cell.edges = new Array();
		this.pool.appendChild(cell);
		this.Cells.push(cell);
		return cell;
	}

	deleteSelectedCell()
	{
		this.deleteCell(this.selected);
		this.selected = null;
	}

	deleteCell(cell)
	{
		if (cell == null) {
			return;
		}
		for (let i = 0; i < cell.edges.length; i++) {
			let index;
			if (cell.edges[i].verticeA == cell) {
				index = cell.edges[i].verticeB.edges.indexOf(cell.edges[i]);
				cell.edges[i].verticeB.edges.splice(index, 1);
			} else {
				index = cell.edges[i].verticeA.edges.indexOf(cell.edges[i]);
				cell.edges[i].verticeA.edges.splice(index, 1);
			}
			index = this.Edges.indexOf(cell.edges[i]);
			this.Edges.splice(index, 1);
		}
		this.Cells.splice(this.Cells.indexOf(cell), 1);
		cell.remove();
	}

	selectCell(event)
	{
		if ((event.type === "mousedown" && event.button == 0) ||
		    (event.type === "touchstart" && event.touches.length == 1)) {
			if (event.target != this.selected) {
				this.selected_old = this.selected;
				this.selected = event.target;
			}
		}
	}

	unselectCell(event)
	{
		if (event.target.id === "pool") {
			this.selected = null;
			this.selected_old = null;
		}
	}

	findNode(cellTarget, cellStart, layer)
	{
		let stack = [{prev: null, cell: cellStart}];
		let tmp;
		while (stack.length > 0) {
			tmp = stack.pop();
			if (tmp.cell == cellTarget) {
				return tmp.cell;
			}
			// Search and push node to stack connecting to current cell
			for (let i = 0; i < tmp.cell.edges.length; i++) {
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

	createNodeList(cell, layer)
	{
		let nodes = [];
		let stack = [{prev: null, cell: cell}];
		let tmp;
		while (stack.length > 0) {
			tmp = stack.pop();
			// Search and push node to stack connecting to current cell
			for (let i = 0; i < tmp.cell.edges.length; i++) {
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

	connectSelectedCells()
	{
		this.connectCells(this.selected, this.selected_old, this.nonDirectional, this.currentLayer);
	}

	// direction: 0: bidirectional, 1: directional
	connectCells(cellTarget, cellConnectTo, direction, layer)
	{
		let i;
		if (cellTarget == null || cellConnectTo == null) {
			return;
		}
		// Disconnect each other if they are already connected
		let edge = cellTarget.edges.find(
		    function (edge) {
			    return (edge.layer == layer && ((edge.verticeA == cellConnectTo) || (edge.verticeB == cellConnectTo)));
		    });
		if (typeof edge !== "undefined") {
			// Remove the edge
			cellTarget.edges.splice(cellTarget.edges.indexOf(edge), 1);
			cellConnectTo.edges.splice(cellConnectTo.edges.indexOf(edge), 1);
			this.Edges.splice(this.Edges.indexOf(edge), 1);
			return;
		}
		// Decide whether they are connectable or not
		let find = this.findNode(cellTarget, cellConnectTo, layer);
		if (find == null) {
			// Add edge
			let newEdge = {layer: layer, direction: (direction > 0 ? 1 : direction < 0 ? -1 : 0), verticeA: cellTarget, verticeB: cellConnectTo};
			if (direction >= 0) {
				this.Edges.push(newEdge);
			} else {
				this.Edges.push(newEdge);
			}
			cellTarget.edges.push(newEdge);
			cellConnectTo.edges.push(newEdge);
		}
	}

	sumSelectedNetwork()
	{
		this.addCellSum(this.selected);
	}

	addCellSum(cell)
	{
		let cellSum = this.addCell();
		cellSum.className = "FcelSum";
		cellSum.layer = this.currentLayer;
		cellSum.value = 0;
		// Connect sum cell to Network of cell
		this.connectCells(cellSum, this.selected, this.directionBtoA, this.currentLayer);
		// Update
		this.updateCellsSum();
	}

	updateCellsSum()
	{
		let sumCells = document.getElementsByClassName("FcelSum");
		for (let i = 0; i < sumCells.length; i++) {
			let net = this.createNodeList(sumCells[i], sumCells[i].layer);
			if (net == null) {
				continue;
			}
			let sum = 0;
			for (let j = 0; j < net.length; j++) {
				if (net[j].className !== "Fcel" &&
				    net[j].layer == sumCells[i].layer) {
					// Another sumCell or prodCell on same layer
					// may become recurrent network
					continue;
				}
				let num = parseFloat(net[j].value);
				if (isNaN(num) == false) {
					sum += num;
				}
			}
			sumCells[i].value = sum;
		}
	}

	prodSelectedNetwork()
	{
		this.addCellProd(this.selected);
	}

	addCellProd(cell)
	{
		let cellProd = this.addCell();
		cellProd.className = "FcelProd";
		cellProd.layer = this.currentLayer;
		cellProd.value = 0;
		// Connect prod cell to Network of cell
		this.connectCells(cellProd, this.selected, this.directionBtoA, this.currentLayer);
		// Update
		this.updateCellsProd();
	}

	updateCellsProd()
	{
		let prodCells = document.getElementsByClassName("FcelProd");
		for (let i = 0; i < prodCells.length; i++) {
			let net = this.createNodeList(prodCells[i], prodCells[i].layer);
			if (net == null) {
				continue;
			}
			let prod = 1.0;
			for (let j = 0; j < net.length; j++) {
				if (net[j].className !== "Fcel" &&
				    net[j].layer == prodCells[i].layer) {
					// Another sumCell or prodCell on same layer
					// may become recurrent network
					continue;
				}
				let num = parseFloat(net[j].value, 10);
				if (isNaN(num) == false) {
					prod *= num;
				}
			}
			prodCells[i].value = prod;
		}
	}

	updateCells()
	{
		this.updateCellsSum();
		this.updateCellsProd();
	}

	drawFcel()
	{
		let style = window.getComputedStyle(this.rootWindow, "");
		let sx = Math.min(window.scrollX - parseInt(style.left, 10), 0);
		let sy = Math.min(window.scrollY - parseInt(style.top, 10), 0);
		let width = Math.min(window.innerWidth, parseInt(style.width, 10));
		let height = Math.min(window.innerHeight, parseInt(style.height, 10));
		// Refresh
		this.context.clearRect(sx, sy, sx + width, sy + height);
		// Background
		this.context.fillStyle = negateColor("rgba(" + this.Colormap[this.currentLayer].red + "," + this.Colormap[this.currentLayer].green + "," + this.Colormap[this.currentLayer].blue + ",0.1)");
		this.context.fillRect(sx, sy, width, height);
		// Draw
		this.drawFcelLines();
		this.drawFcelSelected();
		this.drawFcelLayerSelector();
	}

	drawFcelLines()
	{
		let cell0;
		let cell1;
		// Draw lines except current layer
		for (let n = 0; n < this.Edges.length; n++) {
			cell0 = window.getComputedStyle(this.Edges[n].verticeA);
			cell1 = window.getComputedStyle(this.Edges[n].verticeB);
			let layer = this.Edges[n].layer;
			this.context.strokeStyle = "rgba(" + this.Colormap[layer].red + "," + this.Colormap[layer].green + "," + this.Colormap[layer].blue + ",0.8)";
			if (layer == this.currentLayer) {
				this.context.lineWidth = 6;
			} else {
				this.context.lineWidth = 3;
			}
			let A = {
				x: parseInt(cell0.left, 10) + parseInt(cell0.width, 10) / 2,
				y: parseInt(cell0.top, 10) + parseInt(cell0.height, 10) / 2};
			let B = {
				x: parseInt(cell1.left, 10) + parseInt(cell1.width, 10) / 2,
				y: parseInt(cell1.top, 10) + parseInt(cell1.height, 10) / 2};
			this.context.beginPath();
			this.context.moveTo(A.x, A.y);
			this.context.lineTo(B.x, B.y);
			if (this.Edges[n].direction != 0) {
				let norm = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
				let base = {x: (A.x + B.x) / 2, y: (A.y + B.y) / 2};
				let v;
				if (this.Edges.direction > 0) {
					v = {x: (A.x - B.x) / norm * 30, y: (A.y - B.y) / norm * 30};
				} else {
					v = {x: (B.x - A.x) / norm * 30, y: (B.y - A.y) / norm * 30};
				}
				this.context.moveTo(base.x, base.y);
				this.context.lineTo(base.x + v.x * Math.cos(Math.PI / 6.0) - v.y * Math.sin(Math.PI / 6.0),
				    base.y + v.y * Math.cos(Math.PI / 6.0) + v.x * Math.sin(Math.PI / 6.0))
				this.context.moveTo(base.x, base.y);
				this.context.lineTo(base.x + v.x * Math.cos(Math.PI / 6.0) + v.y * Math.sin(Math.PI / 6.0),
				    base.y + v.y * Math.cos(Math.PI / 6.0) - v.x * Math.sin(Math.PI / 6.0))
			}
			this.context.stroke();
		}
		// Reset context
		this.context.lineWidth = 1;
	}

	drawFcelSelected()
	{
		for (let i = 0; i < this.Cells.length; i++) {
			this.Cells[i].style.outlineStyle = "none";
		}
		if (this.selected != null) {
			this.selected.style.outlineStyle = "solid";
			this.selected.style.outlineColor = "rgba(255, 0, 0, 0.7)";
		}
		if (this.selected_old != null) {
			this.selected_old.style.outlineStyle = "solid";
			this.selected_old.style.outlineColor = "rgba(0, 255, 0, 0.7)";
		}
	}

	drawFcelLayerSelector()
	{
		let selector = document.getElementsByClassName("layerSelectorLayer");
		for (let n = 0; n < selector.length; n++) {
			if (n == this.currentLayer) {
				selector[n].style.outlineStyle = "solid";
			} else {
				selector[n].style.outlineStyle = "none";
			}
		}
	}



	// ----- EVENT -----
	MouseClick(event)
	{
		event.preventDefault();
		if (event.type === "mousedown") {
			this.prev_clientX = event.clientX;
			this.prev_clientY = event.clientY;
		} else if (event.type === "touchstart") {
			this.prev_clientX = event.touches[0].clientX;
			this.prev_clientY = event.touches[0].clientY;
		}
	}

	MouseMove(event)
	{
		event.preventDefault();
		if (event.type === "mousemove") {
			if ((event.buttons & 1) != 0) {
			} else if ((event.buttons & 4) != 0) {
				let move = {x: 0, y: 0}
				move.x = event.clientX - this.prev_clientX;
				move.y = event.clientY - this.prev_clientY;
			}
			this.prev_clientX = event.clientX;
			this.prev_clientY = event.clientY;
		} else if (event.type === "touchmove") {
			if (event.touches.length == 1) {
			} else if (event.touches.length == 2) {
				let move = {x: 0, y: 0}
				move.x = event.touches[0].clientX - this.prev_clientX;
				move.y = event.touches[0].clientY - this.prev_clientY;
			}
			this.prev_clientX = event.touches[0].clientX;
			this.prev_clientY = event.touches[0].clientY;
		}
	}
}

