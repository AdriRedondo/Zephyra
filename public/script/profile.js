const hex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "A", "B", "D", "D", "E", "F"];
const profile_circle = document.getElementById("color_button");

btn.addEventListener('click', function () {
    let hexColor = "#";
    for (let i = 0; i < 6; i++) {
        hexColor += hex[Math.floor(Math.random() * hex.length)];
    }
    color.textContent = hexColor;
    document.body.style.backgroundColor = hexColor;
});