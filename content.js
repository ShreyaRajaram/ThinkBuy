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
    <ul id="considerList" style="list-style: disc; padding-left: 20px;">
      <li> Can you afford it?</li>
      <li> Do you own something similar?</li>
      <li> Is it worth the price?</li>
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
  // Select all buttons and inputs of type 'submit'
  const buyButtons = [...document.querySelectorAll("button, input[type='submit']")].filter(el => {
    const text = el.textContent?.trim().toLowerCase() || el.value?.trim().toLowerCase(); // Check textContent or value
    const siblingText = el.nextElementSibling?.textContent?.trim().toLowerCase(); // Check sibling text
    return (
      (text && (
        text.includes("buy now") ||
        text.includes("add to cart") ||
        text.includes("add to bag") ||
        text.includes("checkout") ||
        text.includes("purchase") ||
        text.includes("order") ||
        text.includes("add")
      )) ||
      (siblingText && (
        siblingText.includes("buy now") ||
        siblingText.includes("add to cart") ||
        siblingText.includes("add to bag") ||
        siblingText.includes("checkout") ||
        siblingText.includes("purchase") ||
        siblingText.includes("order") ||
        siblingText.includes("add")
      ))
    ) && !el.classList.contains("thinkbuy-processed"); // Avoid processing the same button multiple times
  });

  buyButtons.forEach(btn => {
    const clone = btn.cloneNode(true); // Clone the button to preserve its appearance
    clone.classList.add("thinkbuy-processed");
    clone.addEventListener("click", e => {
      e.preventDefault();

      // Extract the item name from the button's context
      const parentElement = btn.closest("div, section, article"); // Look for a parent container
      const itemNameElement = parentElement?.querySelector("[data-pname], [data-test='product-title'], .product-title, h1, h2, h3, span.a-size-medium");
      const itemName = itemNameElement?.textContent?.trim() || "this item";

      delayModal(itemName);
    });
    btn.replaceWith(clone); // Replace the original button with the cloned one
  });
}

// Initial scan
processBuyButtons();

// Watch for new buttons added to the page
const observer = new MutationObserver(() => {
  processBuyButtons();
});

observer.observe(document.body, { childList: true, subtree: true });
