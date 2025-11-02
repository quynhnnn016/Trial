// [CODE HOÀN CHỈNH] - comparator-ai.js

let allProducts = []; // Biến toàn cục lưu trữ tất cả sản phẩm

/**
 * [FIX 2.1] - Thêm hàm helper bị thiếu.
 * Lấy danh sách ID sản phẩm so sánh từ localStorage.
 */
function getCompareList() {
    return JSON.parse(localStorage.getItem('compareList')) || [];
}

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

    // 3. Gắn sự kiện cho việc tick/bỏ tick (viền sáng)
    const productSelectionContainer = document.getElementById('product-selection-container');
    if (productSelectionContainer) {
        productSelectionContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('product-checkbox')) {
                // Logic viền sáng (Logic 1)
                handleProductCardSelection(event.target);
            }
        });
    
        // 4. Gắn sự kiện giới hạn 3 sản phẩm
        // [FIX 1] - Sửa ID container từ 'product-list-container' thành 'product-selection-container'
        productSelectionContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('product-checkbox')) {
                const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
                const maxCompare = 3;

                if (checkedBoxes.length > maxCompare) {
                    alert(`Bạn chỉ có thể chọn tối đa ${maxCompare} sản phẩm để so sánh cùng một lúc.`);
                    e.target.checked = false; // Hủy lựa chọn
                    
                    // [FIX 1.1] - Phải tắt viền sáng nếu hủy lựa chọn
                    handleProductCardSelection(e.target); 
                }
            }
        });
    }

    // 5. Gắn sự kiện cho thanh trượt
    const perfSlider = document.getElementById('priority-performance');
    const mobSlider = document.getElementById('priority-mobility');
    const priceSlider = document.getElementById('priority-price');

    if(perfSlider) {
        perfSlider.addEventListener('input', (e) => updateSliderStatus(e.target.value, 'performance-status'));
    }
    if(mobSlider) {
        mobSlider.addEventListener('input', (e) => updateSliderStatus(e.target.value, 'mobility-status'));
    }
    if(priceSlider) {
        priceSlider.addEventListener('input', (e) => updateSliderStatus(e.target.value, 'price-status'));
    }
});

/**
 * [FIX LOGIC 1] - Đã sửa lỗi viền sáng.
 * Handles product card selection, toggling the 'selected' class based on checkbox state.
 * @param {HTMLInputElement} checkbox - The checkbox element that triggered the change.
 */
function handleProductCardSelection(checkbox) {
    // .closest() tìm thẻ .card cha gần nhất của checkbox
    const productCard = checkbox.closest('.card'); 
    
    if (productCard) {
        if (checkbox.checked) {
            productCard.classList.add('selected');
        } else {
            productCard.classList.remove('selected');
        }
    } else {
        console.error('Không thể tìm thấy thẻ .card cha cho checkbox:', checkbox);
    }
}

/**
 * Tải và hiển thị các sản phẩm có trong compareList.
 */
async function loadProducts() {
    const container = document.getElementById('product-selection-container');
    const compareListIDs = getCompareList(); // Dùng hàm helper

    if (!container) {
        console.error("Product selection container not found.");
        return;
    }

    // Hiển thị thông báo nếu không có sản phẩm
    if (compareListIDs.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center p-4 shadow-sm">
                    <h4 class="alert-heading">Chưa có sản phẩm nào để so sánh!</h4>
                    <p>Bạn chưa thêm sản phẩm nào vào danh sách so sánh. Vui lòng quay lại
                    <a href="index.html" class="alert-link">Trang Chủ</a> để chọn.</p>
                </div>
            </div>`;
        return;
    }

    try {
        const response = await fetch('./data/products_100.json'); // Tải file dữ liệu
        if (!response.ok) {
            throw new Error(`Failed to load products.json: ${response.statusText}`);
        }
        allProducts = await response.json(); // Lưu vào biến toàn cục

        const productsToCompare = allProducts.filter(product => compareListIDs.includes(product.id));
        container.innerHTML = ''; // Xóa nội dung cũ

        // [FIX 2] & [FIX 3] - Sửa lỗi "Tick" mặc định VÀ lỗi "HTML trùng lặp"
        productsToCompare.forEach((product, index) => {
            // Logic: Chỉ check 3 sản phẩm đầu tiên (index 0, 1, 2)
            const isChecked = index < 3; 

            // Đây là chuỗi HTML ĐÚNG (đã xóa bỏ phần trùng lặp)
            const productCardHTML = `
                <div class="col-md-3 mb-4" id="card-${product.id}"> <div class="card product-card ${isChecked ? 'selected' : ''} h-100" data-product-id="${product.id}">
                        
                        <button 
                            class="btn-close position-absolute top-0 end-0 p-2 bg-white" 
                            style="z-index: 10;" 
                            aria-label="Close"
                            onclick="removeFromComparePage('${product.id}')"
                            title="Bỏ sản phẩm này khỏi danh sách">
                        </button>

                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            
                            <ul class="list-unstyled text-muted small mt-2">
                                <li title="CPU"><i class="bi bi-cpu-fill"></i> ${product.cpu}</li>
                                <li title="RAM"><i class="bi bi-memory"></i> ${product.ram}</li>
                                <li title="Storage"><i class="bi bi-device-hdd"></i> ${product.storage}</li>
                                <li title="Battery"><i class="bi bi-battery-charging"></i> ${product.battery}</li>
                            </ul>
                            
                            <p class="card-text fw-bold fs-5 mt-auto">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                            
                            <div class="form-check mt-2">
                                <input class="form-check-input product-checkbox" type="checkbox"
                                        value="${product.id}" id="check-${product.id}" ${isChecked ? 'checked' : ''}>
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
        container.innerHTML = '<div class="alert alert-danger col-12">Không thể tải danh sách sản phẩm. Vui lòng thử lại.</div>';
    }
}

/**
 * Xử lý sự kiện nhấn nút "So sánh bằng AI".
 */
async function handleCompareClick() {
    // 1. Thu thập ID từ các ô ĐÃ ĐƯỢC CHECK
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    const selectedLaptopIDs = Array.from(checkedBoxes).map(cb => cb.value);

    // 2. Thu thập giá trị thanh trượt và prompt
    const priorities = {
        performance: document.getElementById('priority-performance')?.value || 50,
        mobility: document.getElementById('priority-mobility')?.value || 50,
        price: document.getElementById('priority-price')?.value || 50
    };
    const userPromptText = document.getElementById('user-prompt').value;

    // 3. Xác thực (Validate)
    if (selectedLaptopIDs.length < 2) {
        alert('Vui lòng chọn ít nhất 2 sản phẩm (đánh dấu tick) để bắt đầu so sánh.');
        return;
    }
    // (Logic giới hạn 3 sản phẩm đã được xử lý bởi listener ở DOMContentLoaded)

    // 4. Hiển thị Spinner
    toggleLoading(true);
    document.getElementById('results-container').style.display = 'none';

    try {
        let data;
        // --- BUỘC SỬ DỤNG GIẢ LẬP ---
        console.warn("Backend đang tạm dừng. Chuyển sang chế độ Giả lập (Mock Mode).");
        data = await getMockResponse(selectedLaptopIDs, priorities, userPromptText);
        // ------------------------------

        // 5. Hiển thị kết quả
        displayResults(data, selectedLaptopIDs);

    } catch (error) {
        console.error('Lỗi trong quá trình giả lập AI:', error);
        alert(`Đã xảy ra lỗi trong quá trình phân tích: ${error.message}. Vui lòng thử lại.`);
    } finally {
        // 6. Ẩn Spinner
        toggleLoading(false);
    }
}

/**
 * Bật/Tắt spinner loading.
 */
function toggleLoading(isLoading) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
}

/**
 * [FIX 4] - Đã sửa lỗi hiển thị kết quả.
 * Hiển thị kết quả (tóm tắt và bảng) ra UI.
 */
function displayResults(data, selectedLaptopIDs) {
    const resultsContainer = document.getElementById('results-container');
    const summaryEl = document.getElementById('ai-summary');
    const tableContainerEl = document.getElementById('comparison-table-container');

    if (!resultsContainer || !summaryEl || !tableContainerEl) {
        console.error("Results container, summary, or table container not found.");
        return;
    }

    // 1. Hiển thị Tóm tắt AI (dùng innerHTML để nhận thẻ <br>)
    summaryEl.innerHTML = data.summary || 'Không có tóm tắt từ AI.';

    // 2. Tạo Bảng so sánh
    let tableHTML = '<table class="table table-bordered table-striped align-middle">';

    // Tạo Header (Tên Laptop)
    tableHTML += '<thead class="table-dark"><tr><th>Tiêu chí</th>';
    // data.laptop_names là một MẢNG TÊN (đã sửa trong hàm mock)
    const laptopNames = data.laptop_names || [];
    laptopNames.forEach(name => {
        tableHTML += `<th>${name}</th>`; // Thêm TÊN vào header
    });
    tableHTML += '</tr></thead>';

    // Tạo Body (Chi tiết)
    tableHTML += '<tbody>';
    if (data.comparison_details && data.comparison_details.length > 0) {
        data.comparison_details.forEach(item => {
            tableHTML += `<tr><td><strong>${item.feature}</strong></td>`; // Cột Tiêu chí

            // Lặp qua MẢNG ID (selectedLaptopIDs) để lấy đúng giá trị theo thứ tự
            selectedLaptopIDs.forEach(id => {
                tableHTML += `<td>${item[id] !== undefined ? item[id] : 'N/A'}</td>`;
            });
            tableHTML += '</tr>';
        });
    } else {
        tableHTML += `<tr><td colspan="${selectedLaptopIDs.length + 1}">Không có chi tiết so sánh.</td></tr>`;
    }
    tableHTML += '</tbody></table>';

    // 3. Đưa bảng vào HTML và hiển thị
    tableContainerEl.innerHTML = tableHTML;
    resultsContainer.style.display = 'block';

    // Cuộn xuống để xem kết quả
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * [FIX LOGIC 2] - Đã sửa lỗi nút X (vì getCompareList() đã được thêm ở đầu tệp).
 * Xóa sản phẩm khỏi trang so sánh.
 */
function removeFromComparePage(productId) {
    // 1. Xóa khỏi localStorage
    let compareList = getCompareList(); // Hàm này giờ đã tồn tại
    compareList = compareList.filter(id => id !== productId);
    localStorage.setItem('compareList', JSON.stringify(compareList));

    // 2. Xóa thẻ (card) khỏi giao diện
    const cardElement = document.getElementById(`card-${productId}`);
    if (cardElement) {
        cardElement.remove();
    }
}

/**
 * HÀM MOCK AI (Đã nâng cấp)
 */
async function getMockResponse(selectedLaptopIDs, priorities, userPrompt) {

    // Mô phỏng độ trễ của API
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const id1 = selectedLaptopIDs[0];
    const id2 = selectedLaptopIDs[1];
    const id3 = selectedLaptopIDs.length > 2 ? selectedLaptopIDs[2] : null;

    const fallbackData = { name: 'N/A', price: 0, cpu: 'N/A', ram: 'N/A', storage: 'N/A', gpu: 'N/A', battery: 'N/A', weight: 'N/A', screen: 'N/A' };
    const laptopData1 = allProducts.find(p => p.id === id1) || fallbackData;
    const laptopData2 = allProducts.find(p => p.id === id2) || fallbackData;
    let laptopData3 = null;
    if(id3) {
        laptopData3 = allProducts.find(p => p.id === id3) || fallbackData;
    }

    let aiSummary = "";

    // ----- Logic AI Giả lập -----
    if (userPrompt && userPrompt.trim() !== "") {
        aiSummary = `Phân tích dựa trên nhu cầu của bạn: "${userPrompt}". 
                    <br><br> Dựa trên mô tả, <strong>${laptopData1.name}</strong> dường như là lựa chọn phù hợp nhất. 
                    Nó cân bằng tốt giữa ${laptopData1.cpu} và ${laptopData1.gpu}. 
                    Tuy nhiên, hãy cân nhắc <strong>${laptopData2.name}</strong> nếu bạn cần mức giá tốt hơn.`;
    } else {
        const perf = parseInt(priorities.performance, 10);
        const mob = parseInt(priorities.mobility, 10);
        const priceVal = parseInt(priorities.price, 10);
        const maxPriority = Math.max(perf, mob, priceVal);
        
        if (maxPriority === perf) {
            aiSummary = `Bạn ưu tiên <strong>Hiệu năng</strong>. 
                        <br><br><strong>${laptopData1.name}</strong> là lựa chọn vượt trội với ${laptopData1.cpu} và ${laptopData1.gpu}. 
                        Nó sẽ xử lý các tác vụ nặng tốt nhất trong nhóm này.`;
        } else if (maxPriority === mob) {
            aiSummary = `Bạn ưu tiên <strong>Tính di động</strong>. 
                        <br><br>Với trọng lượng chỉ ${laptopData2.weight} và pin ${laptopData2.battery}, 
                        <strong>${laptopData2.name}</strong> là người bạn đồng hành lý tưởng.`;
        } else {
            aiSummary = `Bạn ưu tiên <strong>Giá cả</strong>. 
                        <br><br>Với mức giá ${new Intl.NumberFormat('vi-VN').format(laptopData2.price)}, 
                        <strong>${laptopData2.name}</strong> cung cấp giá trị tốt nhất.`;
        }
    }
    // ----- Hết Logic AI Giả lập -----

    const formatPrice = (price) => {
         const pPrice = parseFloat(price);
         return isNaN(pPrice) ? "Liên hệ" : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pPrice);
    };

    const mockComparisonDetails = [
        { "feature": "CPU", [id1]: laptopData1.cpu, [id2]: laptopData2.cpu },
        { "feature": "RAM", [id1]: laptopData1.ram, [id2]: laptopData2.ram },
        { "feature": "GPU", [id1]: laptopData1.gpu, [id2]: laptopData2.gpu },
        { "feature": "Lưu trữ", [id1]: laptopData1.storage, [id2]: laptopData2.storage },
        { "feature": "Giá", [id1]: formatPrice(laptopData1.price), [id2]: formatPrice(laptopData2.price) },
        { "feature": "Cân nặng", [id1]: laptopData1.weight, [id2]: laptopData2.weight },
        { "feature": "Pin", [id1]: laptopData1.battery, [id2]: laptopData2.battery },
        { "feature": "Màn hình", [id1]: laptopData1.screen, [id2]: laptopData2.screen }
    ];

    if (laptopData3) {
        mockComparisonDetails.forEach(item => {
            const key = item.feature;
            if (key === "Giá") item[id3] = formatPrice(laptopData3.price);
            else if (key === "CPU") item[id3] = laptopData3.cpu;
            else if (key === "RAM") item[id3] = laptopData3.ram;
            else if (key === "GPU") item[id3] = laptopData3.gpu;
            else if (key === "Lưu trữ") item[id3] = laptopData3.storage;
            else if (key === "Cân nặng") item[id3] = laptopData3.weight;
            else if (key === "Pin") item[id3] = laptopData3.battery;
            else if (key === "Màn hình") item[id3] = laptopData3.screen;
        });
    }

    return {
        summary: aiSummary,
        laptop_names: [laptopData1.name, laptopData2.name, laptopData3?.name].filter(Boolean),
        comparison_details: mockComparisonDetails
    };
}

/**
 * Cập nhật trạng thái (text) của thanh trượt.
 */
function updateSliderStatus(sliderValue, outputId) {
    const outputEl = document.getElementById(outputId);
    if (!outputEl) return;

    if (sliderValue <= 20) {
        outputEl.textContent = 'Rất thấp';
    } else if (sliderValue <= 40) {
        outputEl.textContent = 'Thấp';
    } else if (sliderValue <= 60) {
        outputEl.textContent = 'Trung bình';
    } else if (sliderValue <= 80) {
        outputEl.textContent = 'Cao';
    } else {
        outputEl.textContent = 'Rất cao';
    }
}