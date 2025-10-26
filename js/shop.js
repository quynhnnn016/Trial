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

//Các hàm helper cho localStorage
function getFavoriteList() {
    return JSON.parse(localStorage.getItem('favoriteList')) || [];
}

function getCartList() {
    return JSON.parse(localStorage.getItem('cartList')) || [];
}

//Hàm cập nhật Sidebar
function updateSidebar() {
    // Lấy 3 danh sách từ localStorage
    const compareList = getCompareList();
    const favoriteList = getFavoriteList();
    const cartList = getCartList();

    // Lấy 3 vị trí trên HTML
    const compareContainer = document.getElementById('compare-sidebar-list');
    const favoriteContainer = document.getElementById('favorite-sidebar-list');
    const cartContainer = document.getElementById('cart-sidebar-list');

    // Hàm trợ giúp để render danh sách
    const renderList = (container, list, placeholder) => {
        container.innerHTML = ''; // Xóa nội dung cũ
        if (list.length === 0) {
            container.innerHTML = `<li class="list-group-item text-muted">${placeholder}</li>`;
            return;
        }
        list.forEach(productId => {
            const product = allShopProducts.find(p => p.id === productId);
            if (product) {
                container.innerHTML += `<li class="list-group-item small">${product.name}</li>`;
            }
        });
    };

    // Render cả 3 danh sách
    renderList(compareContainer, compareList, 'Chưa chọn sản phẩm so sánh...');
    renderList(favoriteContainer, favoriteList, 'Chưa thích sản phẩm nào...');
    renderList(cartContainer, cartList, 'Giỏ hàng trống...');
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
        const response = await fetch('./data/products_100.json');
        if (!response.ok) {
            throw new Error(`Failed to load products.json: ${response.statusText}`);
        }

        const compareList = getCompareList();
        const favoriteList = getFavoriteList();

        allShopProducts = await response.json(); // Store all products globally for potential future use

        container.innerHTML = ''; // Clear old content

        allShopProducts.forEach(product => {
            // Check if the product is already in the comparison list
            const isCompareSelected = compareList.includes(product.id);
            const isFavoriteSelected = favoriteList.includes(product.id);

            const productCardHTML = `
            <div class="col">
                <div class="card h-100 product-card shadow-sm">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">

                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title product-name">${product.name}</h5>
                        <p class="card-text text-muted product-specs">${product.cpu}, ${product.ram}</p>

                        <p class="card-text fw-bold fs-5 mt-auto">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>

                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="addToCart(this, '${product.id}')">
                                <i class="bi bi-cart-plus"></i> Thêm vào giỏ
                            </button>
                            <div class="btn-group">
                                <button class="btn btn-outline-primary w-100 ${isCompareSelected ? 'active' : ''}" onclick="toggleCompare(this, '${product.id}')">
                                    <i class="bi bi-bar-chart-steps"></i> 
                                    <span class="compare-text">${isCompareSelected ? ' Đã chọn' : ' So sánh'}</span>
                                </button>
                                <button class="btn ${isFavoriteSelected ? 'btn-danger' : 'btn-outline-danger'}" onclick="toggleFavorite(this, '${product.id}')" title="Thêm vào yêu thích">
                                    <i class="bi ${isFavoriteSelected ? 'bi-heart-fill' : 'bi-heart'}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            container.innerHTML += productCardHTML;
        });

        updateSidebar();

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
// [CẬP NHẬT] - Hàm toggleCompare (Sửa lỗi)
function toggleCompare(element, productId) { // Thêm 'element'
    const compareList = getCompareList();
    const maxLimit = 3;
    const productIndex = compareList.indexOf(productId);

    const compareButtonText = element.querySelector('.compare-text'); // Lấy text bên trong

    if (productIndex > -1) {
        // Product is already in the list, REMOVE it
        compareList.splice(productIndex, 1);
        // Cập nhật nút (UI)
        element.classList.remove('active'); // Bỏ trạng thái active
        compareButtonText.textContent = ' So sánh'; // Đổi text
    } else {
        // Product is NOT in the list, ADD it
        if (compareList.length >= maxLimit) {
            alert(`Bạn chỉ có thể so sánh tối đa ${maxLimit} sản phẩm.`);
            return; // Không làm gì cả
        }
        compareList.push(productId);
        // Cập nhật nút (UI)
        element.classList.add('active'); // Thêm trạng thái active
        compareButtonText.textContent = ' Đã chọn'; // Đổi text
    }

    localStorage.setItem('compareList', JSON.stringify(compareList));

    // BỎ LỆNH loadAllProducts()
    // loadAllProducts(); 

    // THAY BẰNG:
    updateSidebar(); // Chỉ cập nhật sidebar
}

// [THÊM VÀO] - Hàm cho nút Yêu thích (có toggle)
function toggleFavorite(element, productId) {
    const favoriteList = getFavoriteList();
    const productIndex = favoriteList.indexOf(productId);

    if (productIndex > -1) {
        // Đã có -> Xóa đi
        favoriteList.splice(productIndex, 1);
        // Cập nhật nút (UI)
        element.classList.remove('btn-danger'); // Bỏ nền đỏ
        element.classList.add('btn-outline-danger'); // Thêm viền đỏ
        element.querySelector('i').classList.remove('bi-heart-fill'); // Bỏ icon tô đầy
        element.querySelector('i').classList.add('bi-heart'); // Thêm icon viền
    } else {
        // Chưa có -> Thêm vào
        favoriteList.push(productId);
        // Cập nhật nút (UI)
        element.classList.add('btn-danger'); // Thêm nền đỏ
        element.classList.remove('btn-outline-danger'); // Bỏ viền đỏ
        element.querySelector('i').classList.add('bi-heart-fill'); // Thêm icon tô đầy
        element.querySelector('i').classList.remove('bi-heart'); // Bỏ icon viền
    }

    localStorage.setItem('favoriteList', JSON.stringify(favoriteList));
    updateSidebar(); // Cập nhật sidebar
}

// [THÊM VÀO] - Hàm cho nút Giỏ hàng (chỉ thêm)
function addToCart(element, productId) {
    const cartList = getCartList();

    // (Logic đơn giản: chỉ thêm, không kiểm tra trùng lặp)
    cartList.push(productId);
    localStorage.setItem('cartList', JSON.stringify(cartList));

    // Cập nhật nút (UI)
    element.textContent = 'Đã thêm vào giỏ';
    element.classList.add('disabled'); // Vô hiệu hóa nút

    updateSidebar(); // Cập nhật sidebar
}