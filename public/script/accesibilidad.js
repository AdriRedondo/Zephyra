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

const html = document.documentElement;
const lightBtn = document.getElementById("light-btn");
const darkBtn = document.getElementById("dark-btn");

// Cargar preferencia guardada
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    html.setAttribute("data-theme", "dark");
    darkBtn.disabled = true;
    lightBtn.disabled = false;
} else {
    html.removeAttribute("data-theme");
    lightBtn.disabled = true;
    darkBtn.disabled = false;
}

// Activar modo claro
lightBtn.addEventListener("click", () => {
    html.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    lightBtn.disabled = true;
    darkBtn.disabled = false;
});

// Activar modo oscuro
darkBtn.addEventListener("click", () => {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    darkBtn.disabled = true;
    lightBtn.disabled = false;
});