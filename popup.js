document.addEventListener("DOMContentLoaded", () => {
    const count = Object.keys(localStorage).filter(k => k.startsWith("thinkbuy-")).length;
    document.getElementById("count").textContent = count;
  });
  