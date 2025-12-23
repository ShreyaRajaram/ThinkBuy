


// Function to extract product price from the page
function extractProductPrice() {
  // Common price selectors
  const priceSelectors = [
    '[data-price]',
    '.price',
    '.product-price',
    '[class*="price"]',
    '[id*="price"]',
    'span[class*="currency"]',
    '.a-price-whole', // Amazon
    '[data-testid*="price"]'
  ];
  
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent || element.innerText;
      // Extract number from price string (e.g., "$29.99" -> 29.99)
      const match = text.match(/[\d,]+\.?\d*/);
      if (match) {
        const price = parseFloat(match[0].replace(/,/g, ''));
        if (price > 0 && price < 1000000) { // Reasonable price range
          return price;
        }
      }
    }
  }
  
  return null;
}

// Function to check if extension should be active on current site
async function isExtensionEnabled() {
  try {
    // Get user auth info
    const result = await chrome.storage.local.get(['supabase_token', 'user_id', 'supabase_url', 'supabase_key']);
    
    if (!result.supabase_token || !result.user_id || !result.supabase_url || !result.supabase_key) {
      // Not logged in, default to enabled on all sites
      return true;
    }
    
    // Get current domain
    const currentDomain = window.location.hostname.replace('www.', '').toLowerCase();
    
    // Get user settings
    const response = await fetch(`${result.supabase_url}/rest/v1/user_settings?user_id=eq.${result.user_id}`, {
      headers: {
        'apikey': result.supabase_key,
        'Authorization': `Bearer ${result.supabase_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // If error, default to enabled
      return true;
    }
    
    const settings = await response.json();
    
    if (!settings || settings.length === 0) {
      // No settings, default to enabled on all sites
      return true;
    }
    
    const enabledSites = settings[0].enabled_sites || ['*'];
    
    // Check if all sites enabled
    if (enabledSites.includes('*')) {
      return true;
    }
    
    // Check if current domain is enabled (exact match or subdomain)
    return enabledSites.some(site => {
      const normalizedSite = site.replace('www.', '').toLowerCase();
      return currentDomain === normalizedSite || currentDomain.endsWith('.' + normalizedSite);
    });
  } catch (error) {
    console.error('Error checking extension settings:', error);
    // Default to enabled on error
    return true;
  }
}

// Function to track purchase attempt in Supabase
async function trackPurchaseAttempt(itemName) {
  try {
    // Get user auth info
    const result = await chrome.storage.local.get(['supabase_token', 'user_id', 'supabase_url', 'supabase_key']);
    
    if (!result.supabase_token || !result.user_id) {
      // User not logged in, skip tracking
      return;
    }
    
    // Extract price if available
    const price = extractProductPrice();
    const amountSaved = price || 0; // Use price as amount saved, or 0 if not found
    
    // Prepare data
    const purchaseData = {
      user_id: result.user_id,
      product_name: itemName,
      price: price,
      amount_saved: amountSaved,
      website_url: window.location.href,
      created_at: new Date().toISOString()
    };
    
    // Save to Supabase
    await savePurchaseAttemptToSupabase(result.supabase_token, purchaseData);
    
    console.log('Purchase attempt tracked:', purchaseData);
  } catch (error) {
    console.error('Error tracking purchase attempt:', error);
    // Don't show error to user, just log it
  }
}// Supabase helper functions (for content script)
async function savePurchaseAttemptToSupabase(accessToken, data) {
  // Get Supabase URL and key from storage (set by popup)
  const config = await chrome.storage.local.get(['supabase_url', 'supabase_key']);
  if (!config.supabase_url || !config.supabase_key) {
    console.error('Supabase not configured');
    return;
  }
  
  const url = `${config.supabase_url}/rest/v1/purchase_attempts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.supabase_key,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save purchase attempt');
  }
  
  return await response.json();
}

function delayModal(itemName = "this item") {
  // Create backdrop
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9998;
    animation: fadeIn 0.2s ease-out;
  `;

  const modal = document.createElement("div");
  modal.id = "thinkbuy-modal";
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-0.5deg);
    z-index: 9999;
    width: 90%;
    max-width: 420px;
    background: #fce4f0;
    border: 3px solid #f8a5c2;
    border-radius: 18px;
    box-shadow: 8px 8px 0 rgba(237, 53, 188, 0.2), 0 0 0 1px rgba(190, 31, 147, 0.1);
    padding: 28px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  `;

  modal.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translate(-50%, -45%) rotate(-1deg) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translate(-50%, -50%) rotate(-0.5deg) scale(1);
        }
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(-0.5deg); }
        50% { transform: rotate(0.5deg); }
      }
      #thinkbuy-modal {
        animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), wiggle 3s ease-in-out infinite;
      }
    </style>
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="
        font-size: 56px;
        font-weight: 700;
        color: #ed35bc;
        margin: 0 0 8px;
        line-height: 1;
        text-shadow: 2px 2px 0 rgba(190, 31, 147, 0.2);
        transform: rotate(-1deg);
        display: inline-block;
      " id="countdownNumber">10</div>
      <p style="
        color: #8b5a7a;
        font-size: 16px;
        margin: 0;
        font-weight: 500;
      " id="countdownText">seconds to pause and think</p>
    </div>
    
    <div style="
      background: white;
      border: 2px dashed #f8a5c2;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      position: relative;
    ">
      <p style="
        color: #5a3a4a;
        font-size: 17px;
        margin: 0 0 16px;
        line-height: 1.5;
        font-weight: 500;
      ">
        Before you buy <strong style="color: #be1f93;">${itemName}</strong>, take a breath
      </p>
      
      <div id="considerSection">
        <p style="
          color: #8b5a7a;
          font-size: 14px;
          margin: 0 0 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">Quick check-in:</p>
        <ul id="considerList" style="
          list-style: none;
          padding: 0;
          margin: 0;
          color: #5a3a4a;
          font-size: 15px;
          line-height: 1.8;
        ">
          <li style="margin-bottom: 8px; padding-left: 22px; position: relative;">
            <span style="position: absolute; left: 0; color: #ed35bc; font-size: 18px;">•</span>
            Can you actually afford this right now?
          </li>
          <li style="margin-bottom: 8px; padding-left: 22px; position: relative;">
            <span style="position: absolute; left: 0; color: #ed35bc; font-size: 18px;">•</span>
            Do you already have something like this?
          </li>
          <li style="margin-bottom: 0; padding-left: 22px; position: relative;">
            <span style="position: absolute; left: 0; color: #ed35bc; font-size: 18px;">•</span>
            Is it really worth the price?
          </li>
        </ul>
      </div>
    </div>
    
    <div id="completionMessage" style="
      display: none;
      text-align: center;
      padding: 20px;
      background: white;
      border: 2px solid #f8a5c2;
      border-radius: 12px;
      margin-top: 20px;
    ">
      <div style="
        font-size: 25px;
        font-weight: 700;
        color: #ed35bc;
        margin-bottom: 8px;
        letter-spacing: -1px;
        text-align: center;
      ">You're all set!</div>
      <p style="
        color: #be1f93;
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 4px;
      ">Make a choice that feels right for you</p>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // Close functionality
  const closeModal = () => {
    modal.style.animation = "fadeIn 0.2s ease-out reverse";
    backdrop.style.animation = "fadeIn 0.2s ease-out reverse";
    setTimeout(() => {
      modal.remove();
      backdrop.remove();
    }, 200);
  };
  
  backdrop.addEventListener("click", closeModal);

  // Countdown
  let timer = 10;
  const countdownNumber = modal.querySelector("#countdownNumber");
  const countdownContainer = countdownNumber.parentElement; // The div containing countdown
  const whiteBox = modal.querySelector("#considerSection").parentElement; // The white box div
  const completionMessage = modal.querySelector("#completionMessage");

  const interval = setInterval(() => {
    timer--;
    countdownNumber.textContent = timer;
    
    if (timer <= 0) {
      clearInterval(interval);
      whiteBox.style.display = "none";
      completionMessage.style.display = "block";
      countdownContainer.style.display = "none";
      
      setTimeout(closeModal, 2500);
    }
  }, 1000);
}

function cleanProductName(text) {
  if (!text) return null;
  
  // Remove common separators and split to get the product part
  let cleaned = text
    .split("|")[0]  // "Product | Store"
    .split("–")[0]  // "Product – Store"
    .split("—")[0]  // "Product — Store"
    .split("-")[0]  // "Product - Store"
    .split("•")[0]  // "Product • Store"
    .trim();
  
  // Remove common store/brand patterns (case insensitive)
  const storePatterns = [
    /^\s*(amazon|walmart|target|ebay|etsy|aliexpress|shopify|buy|purchase|order|add to cart)\s*[:\-–—•|]/i,
    /[:\-–—•|]\s*(amazon|walmart|target|ebay|etsy|aliexpress|shopify|store|official store|online|shop|buy now|free shipping|prime)\s*$/i,
    /\s*\|\s*.+$/i,  // Remove anything after |
    /\s*-\s*(amazon|walmart|target|ebay|etsy).*$/i,
    /\s*\([^)]*store[^)]*\)/i,  // Remove "(Store Name)"
    /\s*\[[^\]]*store[^\]]*\]/i,  // Remove "[Store Name]"
  ];
  
  storePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, "").trim();
  });
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // If cleaning resulted in empty or very short text, return null to use fallback
  if (!cleaned || cleaned.length < 3) {
    return null;
  }
  
  return cleaned;
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
    clone.addEventListener("click", async (e) => {
      e.preventDefault();

      // Check if extension is enabled on this site
      const enabled = await isExtensionEnabled();
      if (!enabled) {
        // Extension disabled on this site, allow normal button behavior
        btn.click();
        return;
      }

      //extract the item name 
      let itemName = "this item";
      
      // Strategy 1: Look in parent containers with common product selectors
      const parentElement = btn.closest("div, section, article, li");
      if (parentElement) {
        const selectors = [
          "[data-pname]",
          "[data-test='product-title']",
          ".product-title",
          "h1[id*='product'], h1[class*='product'], h1[class*='title']",
          "h2[id*='product'], h2[class*='product'], h2[class*='title']",
          "h3[id*='product'], h3[class*='product'], h3[class*='title']",
          "span.a-size-medium", // Amazon
          "[class*='product-title']",
          "[class*='product-name']",
          "[class*='item-title']",
          "[id*='product-title']",
          "[id*='product-name']"
        ];
        
        for (const selector of selectors) {
          const element = parentElement.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text && text.length > 0 && text.length < 200) {
              const cleaned = cleanProductName(text);
              if (cleaned) {
                itemName = cleaned;
                break;
              }
            }
          }
        }
      }
      
      // Strategy 2: Look for page title or meta tags if nothing found
      if (itemName === "this item") {
        const pageTitle = document.querySelector("title")?.textContent?.trim();
        if (pageTitle) {
          const cleaned = cleanProductName(pageTitle);
          if (cleaned) {
            itemName = cleaned;
          }
        }
      }
      
      // Strategy 3: Look for h1 on the page if still nothing found
      if (itemName === "this item") {
        const h1 = document.querySelector("h1");
        if (h1) {
          const text = h1.textContent?.trim();
          if (text && text.length > 0 && text.length < 200) {
            const cleaned = cleanProductName(text);
            if (cleaned) {
              itemName = cleaned;
            }
          }
        }
      }

      delayModal(itemName);
      
      // Track purchase attempt
      trackPurchaseAttempt(itemName);
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
