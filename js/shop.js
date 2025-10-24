// js/shop.js

/**
 * Global array to store all loaded product data from products.json.
 * This is useful for retrieving product details by ID later.
 * @type {Array<Object>}
 */
let allShopProducts = [];

/**
 * Initializes the comparison list state when the DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load the list of all products into the UI
    loadAllProducts();

    // 2. Update the count on the badge in the header
    updateCompareCountBadge();
});

/**
 * Retrieves the list of product IDs from localStorage that are marked for comparison.
 * @returns {string[]} An array of product IDs.
 */
function getCompareList() {
    return JSON.parse(localStorage.getItem('compareList')) || [];
}

/**
 * Saves the list of product IDs to localStorage.
 * Also triggers an update of the compare count badge.
 * @param {string[]} idArray - An array of product IDs.
 */
function saveCompareList(idArray) {
    localStorage.setItem('compareList', JSON.stringify(idArray));
    updateCompareCountBadge();
}

/**
 * Updates the count displayed on the comparison badge in the header.
 * Shows the badge if items are present, hides it otherwise.
 */
function updateCompareCountBadge() {
    const badge = document.getElementById('compare-count-badge');
    const compareList = getCompareList();

    if (badge) {
        if (compareList.length > 0) {
            badge.textContent = compareList.length;
            badge.style.display = 'inline-block'; // Use inline-block for proper display
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Loads the products from `data/products.json` and displays all of them.
 * For each product, it renders a card with an "Add to Compare" button.
 */
async function loadAllProducts() {
    const container = document.getElementById('product-list-container');
    if (!container) {
        console.error("Product list container not found.");
        return;
    }

    try {
        // Load the JSON file containing ALL products
        const response = await fetch('./data/products.json');
        if (!response.ok) {
            throw new Error(`Failed to load products.json: ${response.statusText}`);
        }

        allShopProducts = await response.json(); // Store all products globally for potential future use
        const compareList = getCompareList();

        container.innerHTML = ''; // Clear old content

        allShopProducts.forEach(product => {
            // Check if the product is already in the comparison list
            const isAdded = compareList.includes(product.id);

            const productCardHTML = `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card product-card h-100" id="card-${product.id}">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted">${product.specs.cpu}, ${product.specs.ram}</p>
                            <p class="card-text fw-bold fs-5 mt-auto">${product.price}</p>
                            <button
                                class="btn ${isAdded ? 'btn-secondary' : 'btn-outline-primary'} mt-3"
                                onclick="toggleCompare('${product.id}')"
                                id="btn-compare-${product.id}">
                                ${isAdded ? 'Đã thêm (Xóa)' : 'Thêm vào So sánh'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', productCardHTML);
        });

    } catch (error) {
        console.error('Error loading products for shop page:', error);
        container.innerHTML = '<div class="alert alert-danger col-12">Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.</div>';
    }
}

/**
 * Handles adding or removing a product from the comparison list (in localStorage).
 * This function is called via onclick() from the HTML.
 * @param {string} productId - The ID of the product.
 */
function toggleCompare(productId) {
    let compareList = getCompareList();
    const button = document.getElementById(`btn-compare-${productId}`);
    const productCard = document.getElementById(`card-${productId}`); // Get the card element

    if (compareList.includes(productId)) {
        // --- Remove from list ---
        compareList = compareList.filter(id => id !== productId);
        if (button) {
            button.textContent = 'Thêm vào So sánh';
            button.classList.remove('btn-secondary');
            button.classList.add('btn-outline-primary');
        }
        if (productCard) {
            productCard.classList.remove('selected'); // Remove selected class
        }
    } else {
        // --- Add to list ---
        if (compareList.length >= 3) {
            alert('Bạn chỉ có thể chọn tối đa 3 laptop để so sánh. Vui lòng xóa một sản phẩm trước khi thêm sản phẩm mới.');
            return; // Prevent adding more than 3
        }
        compareList.push(productId);
        if (button) {
            button.textContent = 'Đã thêm (Xóa)';
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-secondary');
        }
        if (productCard) {
            productCard.classList.add('selected'); // Add selected class (uses style.css)
        }
    }

    // Save to localStorage
    saveCompareList(compareList);
}