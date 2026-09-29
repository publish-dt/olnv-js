window.onerror = function (message, url, line, col, error) {
	alert(message + "\n В " + line + ":" + col + " на " + url);
};

const optShortDate = {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
};

/*window.onload = function () {

}*/

/*function handleImgLoad(el) {
	debugger
}*/