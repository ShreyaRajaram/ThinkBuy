function delayModal(itemName = "this item") {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "20%";
  modal.style.left = "50%";
  modal.style.transform = "translateX(-50%)";
  modal.style.zIndex = "9999";
  modal.style.background = "rgb(251, 196, 236)";
  modal.style.border = "2px solid rgb(190, 31, 147)";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 0 10px rgb(237, 53, 188)";
  modal.style.borderRadius = "10px"; // Added to round the edges
  modal.innerHTML = `
    <h3>Think Before You Buy</h3>
    <p id="countdownText">Do you really need ${itemName}? Wait 10 seconds before buying...</p>
    <p id="considerText">Consider the following:</p>
    <ul id="considerList">
      <li> - Can you afford it?</li>
      <li> - Do you own something similar?</li>
      <li> - Is it worth the price?</li>
    </ul>
  `;

  document.body.appendChild(modal);

  let timer = 10;
  const countdownText = modal.querySelector("#countdownText");
  const considerText = modal.querySelector("#considerText");
  const considerList = modal.querySelector("#considerList");

  const interval = setInterval(() => {
    timer--;
    countdownText.textContent = `Do you really need ${itemName}? Wait ${timer} seconds before deciding...`;
    if (timer <= 0) {
      clearInterval(interval);
      countdownText.textContent = `Time's up! Make sure to purchase mindfully!`;
      // Hide the "Consider the following" text and list
      considerText.style.display = "none";
      considerList.style.display = "none";
    }
  }, 1000);
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
