// js/comparator-ai.js

// Keep the existing global allProducts array if you have it from the previous version.
// If not, declare it here:
let allProducts = []; // This will store all products loaded from JSON, not just selected ones.

/**
 * Runs all initialization functions once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải danh sách sản phẩm mẫu lên UI
    loadProducts();

    // 2. Gắn sự kiện cho nút so sánh
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', handleCompareClick);
    } else {
        console.error("Compare button not found. Please check its ID.");
    }

    // Initialize product card selection listener
    // This is important because loadProducts now pre-checks the boxes based on localStorage
    const productSelectionContainer = document.getElementById('product-selection-container');
    if (productSelectionContainer) {
        productSelectionContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('product-checkbox')) {
                handleProductCardSelection(event.target);
            }
        });
    }
});

/**
 * Handles product card selection, toggling the 'selected' class based on checkbox state.
 * @param {HTMLInputElement} checkbox - The checkbox element that triggered the change.
 */
function handleProductCardSelection(checkbox) {
    const productId = checkbox.value;
    const productCard = document.getElementById(`card-${productId}`);
    if (productCard) {
        if (checkbox.checked) {
            productCard.classList.add('selected');
        } else {
            productCard.classList.remove('selected');
        }
    }
}


/**
 * NEW VERSION: Loads products from the JSON file, but only displays
 * those that have been selected by the user (stored in localStorage) from the shop page.
 * It also pre-checks their checkboxes.
 */
async function loadProducts() {
    const container = document.getElementById('product-selection-container');
    // Retrieve the list of product IDs from localStorage
    const compareListIDs = JSON.parse(localStorage.getItem('compareList')) || [];

    if (!container) {
        console.error("Product selection container not found.");
        return;
    }

    // If no products are in the comparison list, display a message
    if (compareListIDs.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center p-4 shadow-sm">
                    <h4 class="alert-heading">Chưa có sản phẩm nào để so sánh!</h4>
                    <p>Bạn chưa thêm sản phẩm nào vào danh sách so sánh. Vui lòng quay lại
                    <a href="index.html" class="alert-link">Trang Chủ</a> để chọn những chiếc laptop bạn quan tâm.</p>
                    <hr>
                    <p class="mb-0">Sau khi chọn, chúng sẽ tự động xuất hiện ở đây.</p>
                </div>
            </div>
        `;
        return;
    }

    try {
        // Load the JSON file (containing information for ALL products)
        const response = await fetch('./data/products.json');
        if (!response.ok) {
            throw new Error(`Failed to load products.json: ${response.statusText}`);
        }

        allProducts = await response.json(); // Store all products globally for comparison logic

        // Filter out only the products whose IDs are in the comparison list
        const productsToCompare = allProducts.filter(product => compareListIDs.includes(product.id));

        container.innerHTML = ''; // Clear existing content

        // Render the selected products into the UI
        productsToCompare.forEach(product => {
            const productCardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card selected h-100" data-product-id="${product.id}" id="card-${product.id}">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted">${product.specs.cpu}, ${product.specs.ram}</p>
                            <p class="card-text fw-bold mt-auto">${product.price}</p>
                            <div class="form-check mt-2">
                                <input class="form-check-input product-checkbox" type="checkbox"
                                       value="${product.id}" id="check-${product.id}" checked>
                                <label class="form-check-label" for="check-${product.id}">
                                    So sánh sản phẩm này
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', productCardHTML);
        });

    } catch (error) {
        console.error('Error loading products for comparison page:', error);
        container.innerHTML = '<div class="alert alert-danger col-12">Không thể tải danh sách sản phẩm để so sánh. Vui lòng thử lại sau.</div>';
    }
}


/**
 * Handles the click event for the "So sánh bằng AI" button.
 * Collects selected laptop IDs and priorities, then calls the AI API (or mock).
 */
async function handleCompareClick() {
    // 1. Collect data from the UI
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    const selectedLaptopIDs = Array.from(selectedCheckboxes).map(cb => cb.value);

    const priorities = {
        performance: document.getElementById('priority-performance')?.value || 50,
        mobility: document.getElementById('priority-mobility')?.value || 50,
        price: document.getElementById('priority-price')?.value || 50
    };

    // 2. Validate data
    if (selectedLaptopIDs.length < 2 || selectedLaptopIDs.length > 3) {
        alert('Vui lòng chọn 2 hoặc 3 laptop để so sánh.');
        return;
    }

    // 3. Update UI state (Show loading spinner)
    toggleLoading(true);
    document.getElementById('results-container').style.display = 'none';

    // 4. Send data to Noco AI Workflow (API Call)
    // Replace 'YOUR_NOCO_AI_WEBHOOK_URL_HERE' with your actual Noco AI webhook URL.
    const NOCO_AI_WEBHOOK_URL = 'YOUR_NOCO_AI_WEBHOOK_URL_HERE';

    try {
        let data;
        if (NOCO_AI_WEBHOOK_URL === 'YOUR_NOCO_AI_WEBHOOK_URL_HERE' || NOCO_AI_WEBHOOK_URL.trim() === '') {
            // --- MOCK SECTION FOR DEMO (60-80% functionality) ---
            // Use mock function instead of real API call for testing
            console.warn("Using mock API response. Please update NOCO_AI_WEBHOOK_URL for real integration.");
            data = await getMockResponse(selectedLaptopIDs, priorities);
            // ----------------------------------------------------
        } else {
            // --- REAL INTEGRATION SECTION ---
            const response = await fetch(NOCO_AI_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    laptopIDs: selectedLaptopIDs,
                    priorities: priorities
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown API error' }));
                throw new Error(`API call failed: ${response.status} - ${errorData.message || response.statusText}`);
            }
            data = await response.json();
            // ----------------------------------------------------
        }


        // 5. Display results
        displayResults(data, selectedLaptopIDs);

    } catch (error) {
        console.error('Error calling comparison API:', error);
        alert(`Đã xảy ra lỗi trong quá trình phân tích: ${error.message}. Vui lòng thử lại.`);
    } finally {
        // 6. Hide loading
        toggleLoading(false);
    }
}

/**
 * Toggles the visibility of the loading spinner.
 * @param {boolean} isLoading - True to show spinner, false to hide.
 */
function toggleLoading(isLoading) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
}

/**
 * Displays the comparison results (summary and table) in the UI.
 * @param {Object} data - The comparison data received from the AI.
 * @param {Array<string>} selectedLaptopIDs - IDs of laptops that were selected.
 */
function displayResults(data, selectedLaptopIDs) {
    const resultsContainer = document.getElementById('results-container');
    const summaryEl = document.getElementById('ai-summary');
    const tableContainerEl = document.getElementById('comparison-table-container');

    if (!resultsContainer || !summaryEl || !tableContainerEl) {
        console.error("Results container, summary, or table container not found.");
        return;
    }

    // 1. Display AI Summary
    summaryEl.textContent = data.summary || 'Không có tóm tắt từ AI.';

    // 2. Create Detailed Comparison Table
    let tableHTML = '<table class="table table-bordered table-striped align-middle">';

    // Create Table Header (Laptop Names)
    tableHTML += '<thead class="table-dark"><tr><th>Tiêu chí</th>';

    // Ensure laptop_names from data or use selected IDs for fallback
    const laptopNamesInResponse = data.laptop_names || {};
    const effectiveLaptopIDs = selectedLaptopIDs || Object.keys(laptopNamesInResponse);

    effectiveLaptopIDs.forEach(id => {
        // Use name from response if available, otherwise try to find from allProducts, or default to ID
        const laptopName = laptopNamesInResponse[id] ||
                           (allProducts.find(p => p.id === id)?.name) ||
                           `Laptop ${id}`;
        tableHTML += `<th>${laptopName}</th>`; // Add Laptop name to header
    });
    tableHTML += '</tr></thead>';

    // Create Table Body (Feature rows)
    tableHTML += '<tbody>';
    if (data.comparison_details && data.comparison_details.length > 0) {
        data.comparison_details.forEach(item => {
            tableHTML += `<tr><td><strong>${item.feature}</strong></td>`; // Criteria column
            effectiveLaptopIDs.forEach(id => {
                tableHTML += `<td>${item[id] !== undefined ? item[id] : 'N/A'}</td>`; // Get value for corresponding laptop ID
            });
            tableHTML += '</tr>';
        });
    } else {
        tableHTML += '<tr><td colspan="4">Không có chi tiết so sánh.</td></tr>';
    }
    tableHTML += '</tbody></table>';

    // 3. Insert table into container and show results
    tableContainerEl.innerHTML = tableHTML;
    resultsContainer.style.display = 'block';

    // Scroll down to view results smoothly
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * MOCK FUNCTION
 * Returns sample data to test the UI without needing a real Noco AI API call.
 * This JSON structure is what Noco AI MUST return.
 * @param {Array<string>} selectedLaptopIDs - The IDs of laptops selected by the user.
 * @param {Object} priorities - User-defined priorities.
 * @returns {Promise<Object>} A promise that resolves with mock comparison data.
 */
async function getMockResponse(selectedLaptopIDs, priorities) {
    console.log("Calling Mock function with IDs:", selectedLaptopIDs, "and Priorities:", priorities);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Sample data (returns the first 2 selected products)
    const id1 = selectedLaptopIDs[0] || 'laptop_a';
    const id2 = selectedLaptopIDs[1] || 'laptop_b';
    const id3 = selectedLaptopIDs[2] || 'laptop_c'; // For 3 selected laptops

    // Find the actual product data from the loaded allProducts array
    const laptopData1 = allProducts.find(p => p.id === id1) || { name: `Laptop ${id1}`, price: '25.000.000 VNĐ', specs: { cpu: 'i7', ram: '16GB', storage: '512GB', gpu: 'RTX 3060', battery: '70Wh', weight: '2.0 kg' }};
    const laptopData2 = allProducts.find(p => p.id === id2) || { name: `Laptop ${id2}`, price: '18.000.000 VNĐ', specs: { cpu: 'i5', ram: '8GB', storage: '256GB', gpu: 'Iris Xe', battery: '50Wh', weight: '1.4 kg' }};
    const laptopData3 = allProducts.find(p => p.id === id3) || { name: `Laptop ${id3}`, price: '35.000.000 VNĐ', specs: { cpu: 'i9', ram: '32GB', storage: '1TB', gpu: 'RTX 4070', battery: '90Wh', weight: '2.5 kg' }};


    let aiSummary = `Đây là tóm tắt từ Chuyên gia AI của bạn. Dựa trên ưu tiên của bạn (Hiệu năng: ${priorities.performance}%, Di động: ${priorities.mobility}%, Giá: ${priorities.price}%):\n\n`;

    if (priorities.performance > priorities.mobility && priorities.performance > priorities.price) {
        aiSummary += `Với ưu tiên hàng đầu là hiệu năng mạnh mẽ, <strong>${laptopData1.name}</strong> nổi bật với ${laptopData1.specs.cpu} và ${laptopData1.specs.gpu}. Đây sẽ là lựa chọn tuyệt vời cho các tác vụ nặng.`;
        if (selectedLaptopIDs.length > 1) {
            aiSummary += ` Trong khi đó, <strong>${laptopData2.name}</strong> mang lại sự cân bằng tốt hơn về giá cả và tính di động, phù hợp cho người dùng cần linh hoạt hơn.`;
        }
    } else if (priorities.mobility > priorities.performance && priorities.mobility > priorities.price) {
        aiSummary += `Nếu tính di động là yếu tố quan trọng nhất, <strong>${laptopData2.name}</strong> với trọng lượng chỉ ${laptopData2.specs.weight} và pin ${laptopData2.specs.battery} là lựa chọn lý tưởng. Nó sẽ rất tiện lợi cho công việc khi di chuyển.`;
        if (selectedLaptopIDs.length > 1) {
            aiSummary += ` Mặc dù <strong>${laptopData1.name}</strong> có hiệu năng cao hơn, nhưng trọng lượng ${laptopData1.specs.weight} có thể là một hạn chế về di động.`;
        }
    } else if (priorities.price >= priorities.performance && priorities.price >= priorities.mobility) { // Price is highest or balanced
        aiSummary += `Để tối ưu chi phí mà vẫn đảm bảo hiệu suất tốt, <strong>${laptopData2.name}</strong> với mức giá ${laptopData2.price} mang lại giá trị rất cạnh tranh.`;
        if (selectedLaptopIDs.length > 1) {
            aiSummary += ` Nếu ngân sách cho phép, <strong>${laptopData1.name}</strong> sẽ cung cấp trải nghiệm cao cấp hơn với mức giá ${laptopData1.price}.`;
        }
    } else {
        aiSummary += `Sau khi phân tích, các lựa chọn của bạn đều có những ưu và nhược điểm riêng. Hãy xem xét kỹ hơn bảng so sánh chi tiết dưới đây để đưa ra quyết định phù hợp nhất với nhu cầu cụ thể của bạn.`;
    }
    aiSummary += "\n\nHãy xem bảng so sánh chi tiết dưới đây để có cái nhìn toàn diện hơn và đưa ra quyết định cuối cùng.";


    const mockComparisonDetails = [
        { "feature": "CPU", [id1]: laptopData1.specs.cpu, [id2]: laptopData2.specs.cpu },
        { "feature": "RAM", [id1]: laptopData1.specs.ram, [id2]: laptopData2.specs.ram },
        { "feature": "GPU", [id1]: laptopData1.specs.gpu, [id2]: laptopData2.specs.gpu },
        { "feature": "Lưu trữ", [id1]: laptopData1.specs.storage, [id2]: laptopData2.specs.storage },
        { "feature": "Giá", [id1]: laptopData1.price, [id2]: laptopData2.price },
        { "feature": "Cân nặng", [id1]: laptopData1.specs.weight, [id2]: laptopData2.specs.weight },
        { "feature": "Pin", [id1]: laptopData1.specs.battery, [id2]: laptopData2.specs.battery },
        { "feature": "Màn hình", [id1]: laptopData1.specs.screen, [id2]: laptopData2.specs.screen }
    ];

    // Add data for the third laptop if selected
    if (selectedLaptopIDs.length === 3) {
        mockComparisonDetails.forEach(item => {
            if (item.feature === "CPU") item[id3] = laptopData3.specs.cpu;
            if (item.feature === "RAM") item[id3] = laptopData3.specs.ram;
            if (item.feature === "GPU") item[id3] = laptopData3.specs.gpu;
            if (item.feature === "Lưu trữ") item[id3] = laptopData3.specs.storage;
            if (item.feature === "Giá") item[id3] = laptopData3.price;
            if (item.feature === "Cân nặng") item[id3] = laptopData3.specs.weight;
            if (item.feature === "Pin") item[id3] = laptopData3.specs.battery;
            if (item.feature === "Màn hình") item[id3] = laptopData3.specs.screen;
        });
    }


    return {
        summary: aiSummary,
        laptop_names: {
            [id1]: laptopData1.name,
            [id2]: laptopData2.name,
            ...(selectedLaptopIDs.length === 3 && { [id3]: laptopData3.name }) // Conditionally add laptop 3
        },
        comparison_details: mockComparisonDetails
    };
}