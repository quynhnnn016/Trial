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

// [THAY THẾ] - Hàm updateSidebar (Đã nâng cấp)
function updateSidebar() {
    const compareList = getCompareList();
    const favoriteList = getFavoriteList();
    const cartList = getCartList();

    const compareContainer = document.getElementById('compare-sidebar-list');
    const favoriteContainer = document.getElementById('favorite-sidebar-list');
    const cartContainer = document.getElementById('cart-sidebar-list');

    // Cập nhật số lượng (badge) trên Navbar
    document.getElementById('cart-count-badge').textContent = cartList.length;
    document.getElementById('fav-count-badge').textContent = favoriteList.length;
    document.getElementById('compare-count-badge').textContent = compareList.length;

    // Hàm trợ giúp để render danh sách (thêm nút Xóa)
    const renderList = (container, list, placeholder, removeFnName) => {
        container.innerHTML = ''; 
        if (list.length === 0) {
            container.innerHTML = `<li class="list-group-item text-muted">${placeholder}</li>`;
            return;
        }
        list.forEach(productId => {
            const product = allShopProducts.find(p => p.id === productId);
            if (product) {
                const removeButton = removeFnName 
                    ? `<button class="btn-close small float-end" onclick="${removeFnName}('${productId}')" aria-label="Xóa"></button>`
                    : '';

                container.innerHTML += `<li class="list-group-item small d-flex justify-content-between align-items-center">
                                            ${product.name.substring(0, 30)}...
                                            ${removeButton}
                                        </li>`;
            }
        });
        // Thêm nút điều hướng (nếu là So sánh)
        if (removeFnName === 'removeFromCompare' && list.length > 0) {
            container.innerHTML += `<li class="list-group-item p-2">
                                        <a href="comparator.html" class="btn btn-primary btn-sm w-100">Đến trang So sánh</a>
                                    </li>`;
        }
    };

    // Render 3 danh sách (với hàm xóa tương ứng)
    renderList(compareContainer, compareList, 'Chưa chọn sản phẩm...', 'removeFromCompare');
    renderList(favoriteContainer, favoriteList, 'Chưa thích sản phẩm nào...', 'removeFromFavorite');
    renderList(cartContainer, cartList, 'Giỏ hàng trống...', 'removeFromCart');
}

// [THÊM VÀO] - 2 hàm helper (vì updateSidebar giờ cũng dùng chúng)
function removeFromFavorite(productId) {
    let favoriteList = getFavoriteList();
    favoriteList = favoriteList.filter(id => id !== productId);
    localStorage.setItem('favoriteList', JSON.stringify(favoriteList));
    updateSidebar();

    // Cập nhật lại nút yêu thích trên thẻ sản phẩm
    const button = document.querySelector(`button[onclick*="toggleFavorite(this, '${productId}')"]`);
    if (button) {
        button.classList.remove('btn-danger');
        button.classList.add('btn-outline-danger');
        button.querySelector('i').classList.remove('bi-heart-fill');
        button.querySelector('i').classList.add('bi-heart');
    }
}

function removeFromCompare(productId) {
    let compareList = getCompareList();
    compareList = compareList.filter(id => id !== productId);
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateSidebar();

    // Cập nhật lại nút so sánh trên thẻ sản phẩm
    const button = document.querySelector(`button[onclick*="toggleCompare(this, '${productId}')"]`);
    if (button) {
        button.classList.remove('active');
        button.querySelector('.compare-text').textContent = ' So sánh';
    }
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
    try {
        // Chỉ tải dữ liệu 1 lần
        const response = await fetch('./data/products_100.json'); // Sửa tên tệp nếu cần
        if (!response.ok) {
            throw new Error(`Failed to load products.json: ${response.statusText}`);
        }
        allShopProducts = await response.json(); // Lưu vào biến toàn cục

        // Hiển thị TẤT CẢ sản phẩm ban đầu
        renderProductList(allShopProducts);

        // Cập nhật sidebar (vì renderProductList không gọi nó)
        updateSidebar(); 

        // Sau khi dữ liệu đã sẵn sàng, GẮN CÁC SỰ KIỆN TÌM KIẾM
        setupSearchListeners();

    } catch (error) {
        console.error('Error loading products for shop page:', error);
        const container = document.getElementById('product-list-container');
        if (container) {
            container.innerHTML = '<div class="alert alert-danger col-12">Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Handles adding or removing a product from the comparison list (in localStorage).
 * This function is called via onclick() from the HTML.
 * @param {string} productId - The ID of the product.
 */
// [CẬP NHẬT] - Hàm toggleCompare (Sửa lỗi)
function toggleCompare(element, productId) {
    const compareList = getCompareList();
    if (compareList.includes(productId)) {
        removeFromCompare(productId); // Dùng hàm xóa mới
    } else {
        compareList.push(productId);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        updateSidebar();
        // Cập nhật nút
        element.classList.add('active');
        element.querySelector('.compare-text').textContent = ' Đã chọn';
    }
}

// [THÊM VÀO] - Hàm cho nút Yêu thích (có toggle)

function toggleFavorite(element, productId) {
    const favoriteList = getFavoriteList();
    if (favoriteList.includes(productId)) {
        removeFromFavorite(productId); // Dùng hàm xóa mới
    } else {
        favoriteList.push(productId);
        localStorage.setItem('favoriteList', JSON.stringify(favoriteList));
        updateSidebar();
        // Cập nhật nút
        element.classList.remove('btn-outline-danger');
        element.classList.add('btn-danger');
        element.querySelector('i').classList.remove('bi-heart');
        element.querySelector('i').classList.add('bi-heart-fill');
    }
}

// [THAY THẾ] - Hàm addToCart đã cập nhật
function addToCart(element, productId) {
    const cartList = getCartList();

    if (cartList.includes(productId)) {
        // Nếu đã có, không làm gì cả (vì nút đã bị vô hiệu hóa)
        return; 
    }

    cartList.push(productId);
    localStorage.setItem('cartList', JSON.stringify(cartList));

    // Cập nhật nút (UI)
    element.textContent = 'Đã thêm vào giỏ';
    element.classList.add('disabled'); 

    updateSidebar(); // Cập nhật sidebar
}

function removeFromCart(productId) {
    let cartList = getCartList();
    cartList = cartList.filter(id => id !== productId); // Lọc bỏ sản phẩm
    localStorage.setItem('cartList', JSON.stringify(cartList));

    updateSidebar(); // Cập nhật sidebar

    // Kích hoạt lại nút "Thêm" trên thẻ sản phẩm (nếu có)
    const button = document.querySelector(`button[onclick="addToCart(this, '${productId}')"]`);
    if (button) {
        button.textContent = 'Thêm vào giỏ';
        button.classList.remove('disabled');
    }
}

// [HÀM MỚI] - Chỉ chịu trách nhiệm hiển thị sản phẩm
function renderProductList(productsToRender) {
    const container = document.getElementById('product-list-container');
    if (!container) return; // Dừng lại nếu không tìm thấy container

    container.innerHTML = ''; // Xóa sản phẩm cũ

    // Lấy danh sách từ localStorage để kiểm tra trạng thái
    const compareList = getCompareList();
    const favoriteList = getFavoriteList();
    const cartList = getCartList(); // Lấy danh sách giỏ hàng

    // Hiển thị thông báo nếu không có kết quả
    if (productsToRender.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <p class="text-center text-muted fs-4 p-5">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>`;
        return;
    }

    // Vòng lặp forEach bạn vừa CẮT
    productsToRender.forEach(product => {
        const isCompareSelected = compareList.includes(product.id);
        const isFavoriteSelected = favoriteList.includes(product.id);
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const isCartSelected = cartList.includes(product.id); 

        const productCardHTML = `
        <div class="col">
            <div class="card h-100 product-card shadow-sm">
                <img src="${product.image}" class="card-img-top" alt="${product.name}">

                <div class="card-body d-flex flex-column">
                    <h5 class="card-title product-name">${product.name}</h5>
                    <p class="card-text text-muted product-specs">${product.cpu}, ${product.ram}</p>

                    <p class="card-text fw-bold fs-5 mt-auto">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>

                    <div class="d-grid gap-2">
                        <button 
                            class="btn btn-success ${isCartSelected ? 'disabled' : ''}" 
                            onclick="addToCart(this, '${product.id}')">
                            <i class="bi bi-cart-plus"></i> ${isCartSelected ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
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
}

// [THÊM VÀO] - Hàm Debounce (Tối ưu hiệu năng)
/**
 * Trì hoãn việc thực thi một hàm cho đến khi người dùng ngừng gõ.
 * @param {Function} func - Hàm cần thực thi.
 * @param {number} delay - Thời gian chờ (miligiây).
 */
function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// [THÊM VÀO] - Hàm Lọc và Hiển thị Kết quả
/**
 * Xử lý logic tìm kiếm, lọc và gọi hàm render.
 */
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase().trim(); // Chuẩn hóa từ khóa

    if (searchTerm === '') {
        // Nếu ô tìm kiếm rỗng, hiển thị lại tất cả sản phẩm
        renderProductList(allShopProducts);
        return;
    }

    // Lọc dựa trên Tên, Thương hiệu (Brand), và CPU
    const filteredProducts = allShopProducts.filter(product => {
        const productName = product.name ? product.name.toLowerCase() : '';
        const productBrand = product.brand ? product.brand.toLowerCase() : '';
        const productCpu = product.cpu ? product.cpu.toLowerCase() : '';

        return productName.includes(searchTerm) || 
               productBrand.includes(searchTerm) || 
               productCpu.includes(searchTerm);
    });

    // Gọi hàm render với kết quả đã lọc
    renderProductList(filteredProducts);
}

// [THÊM VÀO] - Hàm Gắn Sự kiện Tìm kiếm
/**
 * Gắn các event listener cho form và input tìm kiếm.
 */
// [CẬP NHẬT] - Hàm Gắn Sự kiện Tìm kiếm (Hoàn chỉnh)

// [CẬP NHẬT] - Hàm Gắn Sự kiện Tìm kiếm (Hoàn chỉnh)
function setupSearchListeners() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (!searchForm || !searchInput) {
        console.error('Không tìm thấy form hoặc input tìm kiếm.');
        return;
    }

    // === LOGIC MỚI ===

    // 1. Khi gõ (input): Cập nhật đề xuất (dùng debounce)
    const debouncedUpdateSuggestions = debounce(updateSearchSuggestions, 300);
    searchInput.addEventListener('input', debouncedUpdateSuggestions);

    // 2. Khi nhấn nút (submit): Lọc trang (gọi handleSearch)
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Ngăn trang tải lại
        handleSearch(); // Thực thi tìm kiếm (lọc trang)
    });
}

// [HÀM MỚI] - Cập nhật danh sách đề xuất tìm kiếm
function updateSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const suggestionsContainer = document.getElementById('search-suggestions');

    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = ''; // Xóa đề xuất cũ

    if (searchTerm.length < 2) { // Chỉ đề xuất khi gõ ít nhất 2 ký tự
        return;
    }

    // Tạo một Set để tránh đề xuất trùng lặp (ví dụ: Tên và Brand trùng nhau)
    const suggestions = new Set();

    allShopProducts.forEach(product => {
        const pName = product.name ? product.name.toLowerCase() : '';
        const pBrand = product.brand ? product.brand.toLowerCase() : '';
        const pCpu = product.cpu ? product.cpu.toLowerCase() : '';

        // Nếu tìm thấy, thêm Tên sản phẩm gốc vào đề xuất
        if (pName.includes(searchTerm) || pBrand.includes(searchTerm) || pCpu.includes(searchTerm)) {
            suggestions.add(product.name); // Hiển thị tên đầy đủ
        }
    });

    // Giới hạn 5 đề xuất
    let count = 0;
    for (const item of suggestions) {
        if (count >= 5) break;
        const option = document.createElement('option');
        option.value = item; // Nội dung sẽ hiển thị
        suggestionsContainer.appendChild(option);
        count++;
    }
}