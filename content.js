function delayModal(itemName = "this item") {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "20%";
    modal.style.left = "50%";
    modal.style.transform = "translateX(-50%)";
    modal.style.zIndex = "9999";
    modal.style.background = "#fff";
    modal.style.border = "2px solid #222";
    modal.style.padding = "20px";
    modal.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    modal.innerHTML = `
      <h3>Think Before You Buy</h3>
      <p>Do you really need ${itemName}?</p>
      <p>Wait 10 seconds before buying...</p>
      <button id="confirmBuy" disabled>Buy Now</button>
    `;
  
    document.body.appendChild(modal);
  
    let timer = 10;
    const btn = modal.querySelector("#confirmBuy");
    const interval = setInterval(() => {
      timer--;
      btn.textContent = `Buy Now (${timer})`;
      if (timer <= 0) {
        clearInterval(interval);
        btn.textContent = "Buy Now";
        btn.disabled = false;
      }
    }, 1000);
  
    btn.addEventListener("click", () => {
      localStorage.setItem(`thinkbuy-${Date.now()}`, itemName);
      modal.remove();
    });
  }
  
  // Replace "Add to Cart" / "Buy Now" buttons
  const buyButtons = [...document.querySelectorAll("button, input[type='submit']")].filter(el => {
    const text = el.innerText.toLowerCase();
    return text.includes("buy now") || text.includes("add to cart");
  });
  
  buyButtons.forEach(btn => {
    const clone = btn.cloneNode(true);
    clone.addEventListener("click", e => {
      e.preventDefault();
      delayModal("this item");
    });
    btn.replaceWith(clone);
  });
  