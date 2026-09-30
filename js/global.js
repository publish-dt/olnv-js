window.onerror = function (message, url, line, col, error) {
	alert(message + "\n В " + line + ":" + col + " на " + url);
};

window.addEventListener('online', () => {
    window.netOffline = false;
});

window.addEventListener('offline', () => {
    window.netOffline = true;
});

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