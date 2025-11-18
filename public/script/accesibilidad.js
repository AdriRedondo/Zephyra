document.getElementById("font-sm-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "80%";
    localStorage.setItem("fontSize", "80"); //esto es temporal, habrá q meterlo en la bd supongo
});

document.getElementById("font-nm-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "100%";
    localStorage.setItem("fontSize", "100");
});

document.getElementById("font-lg-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "120%";
    localStorage.setItem("fontSize", "120");
});