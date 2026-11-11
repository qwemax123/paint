const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPick = document.getElementById("color");
const brushPick = document.getElementById("brush");
const sizePick = document.getElementById("size");
const eraserPick = document.getElementById("eraser");
const userId = Math.floor(Math.random() * 1000);
const WS = new WebSocket("ws://localhost:9000");

WS.onopen = () => console.log("Подключились, userId =", userId);
WS.onmessage = (event) => handleRemoteEvent(JSON.parse(event.data));
let drawing = false;
let lastLocalPoint = {
    x: 0,
    y: 0
};
let currentStroke = {};

const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

const applyStyle = (style) => {
    ctx.globalCompositeOperation = style.isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color;
    ctx.lineWidth = style.size;
    ctx.lineCap = style.brush === "round" ? "round" : "butt";
    ctx.lineJoin = style.brush === "round" ? "round" : "miter";
}

canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const pos = getPos(e);
    currentStroke.color = colorPick.value;
    currentStroke.size = Number(sizePick.value);
    currentStroke.brush = brushPick.value;
    currentStroke.isEraser = eraserPick.checked;
    lastLocalPoint = pos;
    applyStyle(currentStroke);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, currentStroke.size / 2, 0, Math.PI * 2);
    ctx.fill();

    WS.send(JSON.stringify({
        type: "start",
        userId: userId,
        x: pos.x,
        y: pos.y,
        color: currentStroke.color,
        size: currentStroke.size,
        brush: currentStroke.brush,
        isEraser: currentStroke.isEraser
    }));
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    applyStyle(currentStroke);
    ctx.beginPath();
    ctx.moveTo(lastLocalPoint.x, lastLocalPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    WS.send(JSON.stringify({
        type: "draw",
        userId: userId,
        prevX: lastLocalPoint.x,
        prevY: lastLocalPoint.y,
        x: pos.x,
        y: pos.y,
        color: currentStroke.color,
        size: currentStroke.size,
        brush: currentStroke.brush,
        isEraser: currentStroke.isEraser
    }));

    lastLocalPoint = pos;
});

canvas.addEventListener("mouseup", () => {
    if (!drawing) return;
    drawing = false;
    WS.send(JSON.stringify({ type: "end", userId: userId }));
});

canvas.addEventListener("mouseleave", () => {
    if (!drawing) return;
    drawing = false;
    WS.send(JSON.stringify({ type: "end", userId: userId }));
});


const handleRemoteEvent = (data) => {
    const style = {
        color: data.color,
        size: data.size,
        brush: data.brush,
        isEraser: data.isEraser,
    };

    if (data.type === "start") {
        applyStyle(style);
        ctx.beginPath();
        ctx.arc(data.x, data.y, style.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (data.type === "draw") {
        applyStyle(style);
        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    }
}