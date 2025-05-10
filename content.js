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
  modal.style.boxShadow = "0 0 10px rgb(224, 16, 169)";
  modal.innerHTML = `
    <h3>Think Before You Buy</h3>
    <p id="countdownText">Do you really need ${itemName}? Wait 10 seconds before buying...</p>
    <button id="confirmBuy" disabled>Buy Now</button>
  `;

  document.body.appendChild(modal);

  let timer = 10;
  const btn = modal.querySelector("#confirmBuy");
  const countdownText = modal.querySelector("#countdownText");
  const interval = setInterval(() => {
    timer--;
    countdownText.textContent = `Do you really need ${itemName}? Wait ${timer} seconds before buying...`;
    btn.textContent = `Buy Now (${timer})`;
    if (timer <= 0) {
      clearInterval(interval);
      countdownText.textContent = `Do you really need ${itemName}? You can now buy it.`;
      btn.textContent = "Buy Now";
      btn.disabled = false;
    }
  }, 1000);

  btn.addEventListener("click", () => {
    localStorage.setItem(`thinkbuy-${Date.now()}`, itemName);
    modal.remove();
  });
}

function processBuyButtons() {
  const buyButtons = [...document.querySelectorAll("button, input[type='submit']")].filter(el => {
    const text = el.innerText.toLowerCase();
    const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
    return (text.includes("buy now") || text.includes("add to cart") || ariaLabel.includes("buy") || ariaLabel.includes("cart"))
      && !el.classList.contains("thinkbuy-processed");
  });

  buyButtons.forEach(btn => {
    const clone = btn.cloneNode(true);
    clone.classList.add("thinkbuy-processed");
    clone.addEventListener("click", e => {
      e.preventDefault();
      delayModal("this item");
    });
    btn.replaceWith(clone);
  });
}

// Initial scan
processBuyButtons();

// Watch for new buttons added to the page
const observer = new MutationObserver(() => {
  processBuyButtons();
});

observer.observe(document.body, { childList: true, subtree: true });
