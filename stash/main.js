window.addEventListener("load", initSystem, false);

var SystemRoot;
var FcelWindow;
var FcelApplication;

function
initSystem()
{
	SystemRoot = new ECMASystem(document.body);

	FcelWindow = SystemRoot.createWindow({id: "Fcel", noCloseButton: null});
	FcelWindow.ECMASystemWindowFixed = true;
	FcelWindow.style.position = "absolute";
	FcelWindow.style.top = "0px";
	FcelWindow.style.left = "0px";
	FcelWindow.style.width = "100%";
	FcelWindow.style.height = "100%";
	FcelWindow.style.padding = "0";
	FcelWindow.style.outline = "0";
	FcelWindow.style.border = "0";
	FcelWindow.style.backgroundColor = "rgba(20, 20, 20, 0.5)";
	document.body.appendChild(FcelWindow);
	SystemRoot.windowScroller.style.display = "none";

	FcelApplication = new Fcel(SystemRoot, FcelWindow);
}

