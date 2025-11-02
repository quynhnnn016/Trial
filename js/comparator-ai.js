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

// [THAY THẾ TOÀN BỘ] - getMockResponse (Cấp 4 - Đã sửa lỗi)

async function getMockResponse(selectedLaptopIDs, priorities, userPrompt) {

    // Mô phỏng độ trễ của API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // [LỖI 1 ĐÃ XÓA] - ĐÃ XÓA MẢNG 'allProducts' BỊ DÁN CỨNG Ở ĐÂY.
    // Hàm này bây giờ sẽ sử dụng biến 'allProducts' TOÀN CỤC (global) 
    // do hàm 'loadProducts()' tải lên.

    // --- BỘ NÃO CỦA AI (AI HELPERS) ---
    // (Toàn bộ 'aiHelpers' (dòng 31-426) của bạn được giữ nguyên)
    const aiHelpers = {

        // 1. CÔNG CỤ LƯỢNG HÓA (Normalize)
        normalizeSpec: (specString, type) => {
            if (!specString) return 0;
            const s = specString.toLowerCase();

            switch (type) {
                case 'cpu':
                    if (s.includes('m3 max') || s.includes('i9-14') || s.includes('ryzen 9 8')) return 10;
                    if (s.includes('m3 pro') || s.includes('i9-13') || s.includes('ryzen 9 7')) return 9.5;
                    if (s.includes('m3') || s.includes('i9') || s.includes('ryzen 9')) return 9;
                    if (s.includes('m2 max') || s.includes('i7-14') || s.includes('ryzen 7 8')) return 8.5;
                    if (s.includes('m2 pro') || s.includes('i7-13') || s.includes('ryzen 7 7')) return 8;
                    if (s.includes('m2') || s.includes('i7') || s.includes('ryzen 7')) return 7;
                    if (s.includes('m1 pro') || s.includes('i5-13') || s.includes('ryzen 5 7')) return 6.5;
                    if (s.includes('m1') || s.includes('i5') || s.includes('ryzen 5')) return 6;
                    if (s.includes('i3') || s.includes('ryzen 3')) return 4;
                    return 2; // Các CPU cơ bản khác
                case 'gpu':
                    if (s.includes('rtx 4090')) return 10;
                    if (s.includes('rtx 4080')) return 9.5;
                    if (s.includes('rtx 4070') || s.includes('m3 pro') || s.includes('m3 max')) return 9; // Apple GPU cao cấp
                    if (s.includes('rtx 4060') || s.includes('m2 pro') || s.includes('m2 max')) return 8;
                    if (s.includes('rtx 3070') || s.includes('rtx 3080')) return 7;
                    if (s.includes('rtx 3050') || s.includes('rtx 2060')) return 6;
                    if (s.includes('gtx 1650') || s.includes('amd radeon graphics')) return 5; // Card rời phổ thông/GPU tích hợp AMD
                    if (s.includes('iris xe') || s.includes('uhd graphics') || s.includes('m1') || s.includes('m2')) return 3; // GPU tích hợp Intel/Apple
                    return 2; // Các GPU cơ bản khác
                case 'ram':
                    const ram = parseInt(s.replace('gb', ''));
                    if (ram >= 64) return 10;
                    if (ram >= 32) return 9;
                    if (ram >= 16) return 7;
                    if (ram >= 8) return 5;
                    if (ram >= 4) return 3;
                    return 2;
                case 'battery':
                    const hrsMatch = s.match(/upto (\d+)\s*hrs?/);
                    if (hrsMatch && hrsMatch[1]) return parseFloat(hrsMatch[1]) / 2; // Chuẩn hóa về thang 10 (vd: 20hrs = 10 điểm)
                    const whMatch = s.match(/(\d+)\s*wh/);
                    if (whMatch && whMatch[1]) return parseFloat(whMatch[1]) / 10; // Chuẩn hóa về thang 10 (vd: 100Wh = 10 điểm)
                    return 4; // Giá trị mặc định nếu không parse được
                case 'weight':
                    const kgMatch = s.match(/([\d.]+)\s*kg/);
                    if (kgMatch && kgMatch[1]) {
                        const weightKg = parseFloat(kgMatch[1]);
                        if (weightKg <= 1.0) return 10;
                        if (weightKg <= 1.3) return 9;
                        if (weightKg <= 1.6) return 7;
                        if (weightKg <= 2.0) return 5;
                        if (weightKg <= 2.5) return 3;
                        return 1;
                    }
                    return 5; // Giá trị trung bình nếu không parse được
                case 'storage': // Thêm đánh giá Storage
                    const storageVal = parseInt(s.replace('tb', '000').replace('gb', ''));
                    if (s.includes('ssd')) {
                        if (storageVal >= 2000) return 10; // 2TB SSD
                        if (storageVal >= 1000) return 9;  // 1TB SSD
                        if (storageVal >= 512) return 7;   // 512GB SSD
                        if (storageVal >= 256) return 5;   // 256GB SSD
                    }
                    if (s.includes('hdd') && storageVal >= 1000) return 3; // 1TB HDD
                    return 2;
                case 'screen': // Thêm đánh giá Screen
                    if (s.includes('oled') || s.includes('xdr')) return 10;
                    if (s.includes('4k') || s.includes('uhd')) return 9;
                    if (s.includes('qhd') || s.includes('wqxga')) return 8;
                    if (s.includes('fhd+') || s.includes('retina')) return 7;
                    if (s.includes('fhd')) return 6;
                    return 4;
            }
            return 0;
        },

        // 2. CÔNG CỤ PHÂN TÍCH PROMPT (NLU)
        getNeedsProfile: (prompt, sliders) => {
            let profile = {
                weights: { performance: 1, mobility: 1, price: 1, balance: 0.5, ram: 1, storage: 1, screen: 1 }, // Thêm trọng số cho RAM, Storage, Screen
                filters: [],
                reason: "cho một nhu cầu cân bằng.",
                userKeywords: [] // Lưu lại các từ khóa người dùng để nhắc lại
            };
            const p = prompt.toLowerCase();

            const keywordMap = {
                // Ưu tiên (Weights)
                'game': { weights: { performance: 3.5, gpu: 2.0, mobility: 0.5, balance: 0, screen: 1.5 }, reason: "chơi game đồ họa cao" },
                'đồ họa': { weights: { performance: 3.0, gpu: 2.5, ram: 1.5, screen: 1.5, balance: 0 }, reason: "làm đồ họa chuyên nghiệp" },
                'render': { weights: { performance: 3.0, cpu: 1.5, gpu: 2.0, ram: 2.0, balance: 0 }, reason: "render video, 3D" },
                'lập trình': { weights: { performance: 2.5, ram: 2.0, cpu: 1.5, storage: 1.5, balance: 0 }, reason: "lập trình và phát triển phần mềm" },
                'văn phòng': { weights: { performance: 0.5, price: 2.0, mobility: 1.5, balance: 0.8 }, reason: "công việc văn phòng cơ bản" },
                'pin trâu': { weights: { mobility: 3.0, performance: 0.7, balance: 0 }, reason: "thời lượng pin dài" },
                'di chuyển': { weights: { mobility: 3.0, weight: 2.0, performance: 0.7, balance: 0 }, reason: "sự di động, gọn nhẹ" },
                'nhẹ': { weights: { mobility: 3.0, weight: 2.5, performance: 0.7, balance: 0 }, reason: "trọng lượng siêu nhẹ" },
                'giá rẻ': { weights: { price: 3.5, performance: 0.5, mobility: 0.8, balance: 0 }, reason: "mức giá phải chăng" },
                'sinh viên': { weights: { price: 2.5, mobility: 1.5, performance: 1.0, balance: 0.7 }, reason: "phù hợp cho sinh viên" },
                'doanh nhân': { weights: { mobility: 2.0, screen: 1.5, performance: 1.5, price: 1.0, balance: 0.5 }, reason: "doanh nhân, chuyên nghiệp" },
                'đa nhiệm': { weights: { ram: 2.5, cpu: 1.5, performance: 2.0, balance: 0 }, reason: "đa nhiệm mượt mà" },
                'màn hình đẹp': { weights: { screen: 2.5, gpu: 1.0, performance: 1.0, balance: 0 }, reason: "chất lượng màn hình hiển thị" },
                'lưu trữ nhiều': { weights: { storage: 2.5, price: 0.8, balance: 0 }, reason: "dung lượng lưu trữ lớn" },

                // Ràng buộc cứng (Hard Filters)
                'không game': { filters: [(s) => s.gpu < 6], reason: "loại bỏ máy gaming (GPU > 6)" },
                'không card rời': { filters: [(s) => s.gpu < 6], reason: "loại bỏ máy có card đồ họa rời" },
                '16gb ram': { filters: [(s) => s.ram >= 7], reason: "yêu cầu tối thiểu 16GB RAM" }, // điểm 7 tương ứng 16GB
                '32gb ram': { filters: [(s) => s.ram >= 9], reason: "yêu cầu tối thiểu 32GB RAM" }, // điểm 9 tương ứng 32GB
                'ssd': { filters: [(s, p) => p.storage.toLowerCase().includes('ssd')], reason: "chỉ ổ cứng SSD" },
                'dưới 20 triệu': { filters: [(s, p) => p.price < 20000000], reason: "giới hạn giá dưới 20 triệu VNĐ" },
                'dưới 30 triệu': { filters: [(s, p) => p.price < 30000000], reason: "giới hạn giá dưới 30 triệu VNĐ" },
                'dưới 1.5 kg': { filters: [(s) => s.weight >= 7], reason: "trọng lượng dưới 1.5kg" } // điểm 7 tương ứng <= 1.6kg
            };

            // Ưu tiên Prompt của người dùng
            if (p.trim().length > 3) {
                let appliedKeywords = [];
                for (const keyword in keywordMap) {
                    if (p.includes(keyword)) {
                        const rule = keywordMap[keyword];
                        if (rule.weights) {
                            for (const key in rule.weights) {
                                profile.weights[key] = (profile.weights[key] || 0) + rule.weights[key];
                            }
                        }
                        if (rule.filters) {
                            // Truyền lý do vào hàm filter
                            const filterFn = rule.filters[0];
                            const filterWithReason = (s, p) => filterFn(s, p);
                            filterWithReason.reason = rule.reason; // Gán lý do
                            profile.filters.push(filterWithReason);
                            appliedKeywords.push(rule.reason);
                        }
                        profile.userKeywords.push(keyword); // Lưu từ khóa gốc
                    }
                }
                if(profile.userKeywords.length > 0) {
                     profile.reason = `dựa trên mong muốn của bạn về <strong>"${prompt}"</strong>. Tôi đã hiểu rằng bạn đang tìm kiếm một chiếc laptop ${profile.userKeywords.join(', ')}.`;
                } else {
                     profile.reason = `dựa trên mong muốn của bạn về <strong>"${prompt}"</strong>. Tôi sẽ cố gắng tìm ra lựa chọn tối ưu nhất.`;
                }
                 if(appliedKeywords.length > 0) {
                    profile.reason += "<br>Các máy đã được lọc dựa trên: " + appliedKeywords.join(', ') + ".";
                }
                return profile;
            }

            // Nếu không có prompt, dùng thanh trượt
            const perfVal = parseInt(sliders.performance, 10);
            const mobVal = parseInt(sliders.mobility, 10);
            const priceVal = parseInt(sliders.price, 10);

            profile.weights.performance = (perfVal >= 50 ? (perfVal / 33.3) : 0.5); 
            profile.weights.mobility = (mobVal >= 50 ? (mobVal / 33.3) : 0.5);
            profile.weights.price = (priceVal >= 50 ? (priceVal / 33.3) : 0.5);
            profile.weights.balance = 0; 

            profile.weights.ram = profile.weights.performance * 0.8;
            profile.weights.storage = profile.weights.price * 0.7;
            profile.weights.screen = profile.weights.performance * 0.5 + profile.weights.mobility * 0.3;

            profile.reason = `vì bạn đã ưu tiên các yếu tố (Hiệu năng: ${perfVal}%, Di động: ${mobVal}%, Giá cả: ${priceVal}%).`;
            return profile;
        },

        // 3. CÔNG CỤ CHẤM ĐIỂM (Scoring Engine)
        scoreProduct: (product, needs) => {
            const specs = {
                cpu: aiHelpers.normalizeSpec(product.cpu, 'cpu'),
                gpu: aiHelpers.normalizeSpec(product.gpu, 'gpu'),
                ram: aiHelpers.normalizeSpec(product.ram, 'ram'),
                battery: aiHelpers.normalizeSpec(product.battery, 'battery'),
                weight: aiHelpers.normalizeSpec(product.weight, 'weight'),
                price: parseFloat(product.price),
                storage: aiHelpers.normalizeSpec(product.storage, 'storage'), 
                screen: aiHelpers.normalizeSpec(product.screen, 'screen') 
            };

            // Áp dụng Bộ lọc (Cấp 2)
            let filteredOutReason = null;
            for (const filter of needs.filters) {
                if (!filter(specs, product)) {
                    filteredOutReason = filter.reason || "không đáp ứng tiêu chí"; // Lưu lại lý do bị lọc
                    return { finalScore: -1, specs, product, filteredOutReason }; // Bị loại
                }
            }

            // Tính điểm cho các tiêu chí chính
            const performanceScore = (specs.cpu * (needs.weights.cpu || 1.5)) + (specs.gpu * (needs.weights.gpu || 1.0)) + (specs.ram * (needs.weights.ram || 1.0));
            const mobilityScore = (specs.battery * 1.5) + (specs.weight * 1.5); // Điểm trọng lượng ngược
            const priceScore = (1e10 / (specs.price + 1)); 
            const storageScore = specs.storage * (needs.weights.storage || 1.0);
            const screenScore = specs.screen * (needs.weights.screen || 1.0);

            // Tính điểm Cân bằng
            const scoresToBalance = [];
            if (needs.weights.performance > 0) scoresToBalance.push(performanceScore * needs.weights.performance);
            if (needs.weights.mobility > 0) scoresToBalance.push(mobilityScore * needs.weights.mobility);
            if (needs.weights.price > 0) scoresToBalance.push(priceScore * needs.weights.price);
            if (needs.weights.storage > 0) scoresToBalance.push(storageScore * needs.weights.storage);
            if (needs.weights.screen > 0) scoresToBalance.push(screenScore * needs.weights.screen);

            let balanceScore = 0;
            if (scoresToBalance.length > 1) {
                const mean = scoresToBalance.reduce((a, b) => a + b, 0) / scoresToBalance.length;
                const deviation = Math.sqrt(scoresToBalance.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / scoresToBalance.length);
                balanceScore = (1e10 / (deviation + 1)); 
            }

            // Áp dụng tất cả các trọng số vào điểm cuối cùng
            const finalScore =
                (performanceScore * needs.weights.performance) +
                (mobilityScore * needs.weights.mobility) +
                (priceScore * needs.weights.price) +
                (storageScore * needs.weights.storage) +
                (screenScore * needs.weights.screen) +
                (balanceScore * needs.weights.balance); 

            return { finalScore, specs, product, filteredOutReason: null };
        },

        // 4. CÔNG CỤ TẠO NGÔN NGỮ (NLG)
        generateSummary: (scoredProducts, needsProfile, userPrompt) => {

            const filteredOutProducts = scoredProducts.filter(p => p.finalScore === -1);
            const qualifiedProducts = scoredProducts.filter(p => p.finalScore > 0);

            let summary = `Chào bạn! Tôi đã nhận được yêu cầu của bạn ${userPrompt ? `về <strong>"${userPrompt}"</strong>` : ""}.\n\n`;

            if (scoredProducts.length === 0) {
                return `Rất tiếc, tôi không tìm thấy bất kỳ sản phẩm nào để so sánh. Vui lòng chọn một số laptop để tôi có thể hỗ trợ bạn nhé!`;
            }

            if (qualifiedProducts.length === 0) {
                summary += `Sau khi xem xét kỹ lưỡng ${scoredProducts.length} sản phẩm, tôi nhận thấy rằng <strong>không có chiếc laptop nào</strong> trong danh sách này hoàn toàn đáp ứng các tiêu chí khắt khe của bạn. \n`;
                if (filteredOutProducts.length > 0) {
                    summary += `Đặc biệt, một số máy đã bị loại vì ${filteredOutProducts[0].filteredOutReason || "không đạt yêu cầu cơ bản"}. `;
                }
                summary += `Bạn có muốn thử với các tiêu chí hoặc danh sách sản phẩm khác không?`;
                return summary.replace(/\n/g, '<br>'); // Thay thế \n bằng <br>
            }

            // Sắp xếp các máy đã qua lọc
            qualifiedProducts.sort((a, b) => b.finalScore - a.finalScore);

            const winner = qualifiedProducts[0];
            const runnerUp = qualifiedProducts.length > 1 ? qualifiedProducts[1] : null;

            summary += `Dựa trên ${needsProfile.reason}, tôi đã phân tích ${scoredProducts.length} sản phẩm bạn cung cấp.\n\n`;
            summary += `Kết quả cho thấy, <strong>${winner.product.name}</strong> chính là lựa chọn sáng giá nhất dành cho bạn! \n\n`;
            
            // Phân tích lý do chính
            const weights = needsProfile.weights;
            let mainReason = 'balance'; 
            let maxWeight = 0;
            for (const key in weights) {
                if (key !== 'ram' && key !== 'storage' && key !== 'screen' && weights[key] > maxWeight) {
                     maxWeight = weights[key];
                     mainReason = key;
                }
            }
             // Xử lý logic từ khóa đặc biệt (ví dụ: 'ram' có thể là lý do chính)
            if (needsProfile.userKeywords.includes('đa nhiệm') || needsProfile.userKeywords.includes('lưu trữ nhiều') || needsProfile.userKeywords.includes('màn hình đẹp')) {
                 if (weights.ram > maxWeight) mainReason = 'ram';
                 if (weights.storage > maxWeight) mainReason = 'storage';
                 if (weights.screen > maxWeight) mainReason = 'screen';
            }


            let recommendationDetails = "";
            let comparisonSentence = "";

            if (runnerUp) {
                const winnerPerf = (winner.specs.cpu * 2) + winner.specs.gpu + winner.specs.ram;
                const runnerUpPerf = (runnerUp.specs.cpu * 2) + runnerUp.specs.gpu + runnerUp.specs.ram;
                const winnerMob = winner.specs.battery * 1.5 + winner.specs.weight * 1.5;
                const runnerUpMob = runnerUp.specs.battery * 1.5 + runnerUp.specs.weight * 1.5;
                const winnerPrice = winner.product.price;
                const runnerUpPrice = runnerUp.product.price;

                switch (mainReason) {
                    case 'performance':
                        recommendationDetails = `Với nhu cầu về hiệu năng mạnh mẽ mà bạn đã nhắc đến, <strong>${winner.product.name}</strong> thực sự nổi bật. Với bộ vi xử lý ${winner.product.cpu} (Điểm: ${winner.specs.cpu}/10) và card đồ họa ${winner.product.gpu} (Điểm: ${winner.specs.gpu}/10), nó mang lại sức mạnh vượt trội.`;
                        comparisonSentence = `Mặc dù <strong>${runnerUp.product.name}</strong> cũng là một lựa chọn tốt, nhưng về khả năng xử lý các tác vụ nặng thì ${winner.product.name} vẫn chiếm ưu thế hơn.`;
                        break;
                    case 'mobility':
                        recommendationDetails = `Nếu ưu tiên hàng đầu của bạn là sự di động và tiện lợi, <strong>${winner.product.name}</strong> với trọng lượng chỉ ${winner.product.weight}kg (Điểm: ${winner.specs.weight}/10) và thời lượng pin ấn tượng (Điểm: ${winner.specs.battery.toFixed(1)}/10) là sự lựa chọn hoàn hảo.`;
                        comparisonSentence = `So với <strong>${runnerUp.product.name}</strong> (${runnerUp.product.weight}kg), chiếc ${winner.product.name} này mang lại trải nghiệm gọn nhẹ và thời lượng sử dụng dài hơn đáng kể.`;
                        break;
                    case 'price':
                        recommendationDetails = `Đối với yêu cầu về một mức giá phải chăng, <strong>${winner.product.name}</strong> nổi bật với mức giá chỉ ${new Intl.NumberFormat('vi-VN').format(winner.product.price)} VNĐ, cực kỳ kinh tế.`;
                        if(winnerPrice < runnerUpPrice) {
                             comparisonSentence = `Bạn có thể tiết kiệm được ${new Intl.NumberFormat('vi-VN').format(runnerUp.product.price - winner.product.price)} VNĐ so với <strong>${runnerUp.product.name}</strong> mà vẫn sở hữu một chiếc máy chất lượng.`;
                        } else {
                             comparisonSentence = `Mặc dù <strong>${runnerUp.product.name}</strong> rẻ hơn, ${winner.product.name} mang lại hiệu năng/giá (price/performance) tốt hơn.`;
                        }
                        break;
                    case 'ram':
                        recommendationDetails = `Để đáp ứng nhu cầu đa nhiệm, <strong>${winner.product.name}</strong> với ${winner.product.ram} (Điểm: ${winner.specs.ram}/10) sẽ giúp bạn làm việc mượt mà.`;
                        comparisonSentence = `<strong>${runnerUp.product.name}</strong> chỉ có ${runnerUp.product.ram}, có thể sẽ không đủ cho các tác vụ nặng của bạn.`;
                        break;
                    case 'storage':
                        recommendationDetails = `Nếu bạn cần nhiều không gian lưu trữ, <strong>${winner.product.name}</strong> với ${winner.product.storage} là một điểm cộng lớn.`;
                        comparisonSentence = `So với <strong>${runnerUp.product.name}</strong>, chiếc máy này cung cấp dung lượng lưu trữ rộng rãi hơn.`;
                        break;
                    case 'screen':
                        recommendationDetails = `Với việc bạn quan tâm đến chất lượng màn hình, <strong>${winner.product.name}</strong> tự hào sở hữu màn hình ${winner.product.screen} (Điểm: ${winner.specs.screen}/10) tuyệt đẹp.`;
                        comparisonSentence = `Chất lượng hiển thị của <strong>${runnerUp.product.name}</strong> cũng tốt, nhưng màn hình của ${winner.product.name} lại có phần nhỉnh hơn.`;
                        break;
                    default: // 'balance'
                        recommendationDetails = `Đây là một chiếc máy có sự cân bằng tuyệt vời giữa hiệu năng (Điểm: ${((winnerPerf/30)*10).toFixed(1)}/10), tính di động (Điểm: ${((winnerMob/30)*10).toFixed(1)}/10) và giá cả.`;
                        comparisonSentence = `Mặc dù <strong>${runnerUp.product.name}</strong> cũng là một đối thủ đáng gờm, nhưng <strong>${winner.product.name}</strong> mang lại gói tổng thể hài hòa hơn.`;
                }

                summary += `${recommendationDetails} ${comparisonSentence}\n\n`;

                const winnerAdvantages = [];
                if (winnerPerf > runnerUpPerf * 1.1 && !mainReason.includes('performance')) winnerAdvantages.push('hiệu năng mạnh mẽ');
                if (winnerMob > runnerUpMob * 1.1 && !mainReason.includes('mobility')) winnerAdvantages.push('tính di động cao');
                if (winnerPrice < runnerUpPrice * 0.9 && !mainReason.includes('price')) winnerAdvantages.push('mức giá cạnh tranh');
                
                if (winnerAdvantages.length > 0) {
                    summary += `Ngoài ra, ${winner.product.name} còn có ưu điểm về ${winnerAdvantages.join(', ')}. `;
                }

            } else {
                summary += `Đây là lựa chọn duy nhất đáp ứng được các yêu Rõ ràng, <strong>${winner.product.name}</strong> là lựa chọn tốt nhất trong nhóm này cho bạn.`;
            }

            if (filteredOutProducts.length > 0) {
                summary += `\n\nCó ${filteredOutProducts.length} sản phẩm khác (ví dụ: ${filteredOutProducts[0].product.name}) đã bị loại vì ${filteredOutProducts[0].filteredOutReason || "không đáp ứng các tiêu chí bạn đưa ra"}.`;
            }

            summary += `\n\nHãy cùng xem bảng so sánh chi tiết để có cái nhìn tổng quan hơn nhé!`;
            
            // Cuối cùng, thay thế \n bằng <br>
            return summary.replace(/\n/g, '<br>');
        }
    };

    // --- [LỖI 2 ĐÃ SỬA] ---
    // PHẦN THỰC THI BỊ MẤT ĐÃ ĐƯỢC THÊM LẠI DƯỚI ĐÂY

    // 1. Lấy ID và Dữ liệu sản phẩm (từ biến allProducts TOÀN CỤC)
    const fallbackData = { id: 'fallback', name: 'Sản phẩm không rõ', price: 0, cpu: 'N/A', ram: 'N/A', storage: 'N/A', gpu: 'N/A', battery: 'N/A', weight: 'N/A', screen: 'N/A' };
    
    // 'allProducts' ở đây là biến TOÀN CỤC (global) được load bởi loadProducts()
    const laptopData = selectedLaptopIDs.map(id => {
        return allProducts.find(p => p.id === id) || { ...fallbackData, id: id, name: `Laptop ${id}` };
    });

    // 2. Phân tích nhu cầu
    const needsProfile = aiHelpers.getNeedsProfile(userPrompt, priorities);

    // 3. Chấm điểm (đã bao gồm Lọc)
    const scoredProducts = laptopData.map(product => 
        aiHelpers.scoreProduct(product, needsProfile)
    );

    // 4. Tạo Tóm tắt (NLG)
    const aiSummary = aiHelpers.generateSummary(scoredProducts, needsProfile, userPrompt);

    // 5. Tạo Bảng so sánh
    const formatPrice = (price) => {
         const pPrice = parseFloat(price);
         return isNaN(pPrice) ? "Liên hệ" : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pPrice);
    };
    
    const laptopNames = laptopData.map(ld => ld.name);
    
    const mockComparisonDetails = [
        { "feature": "CPU" },
        { "feature": "RAM" },
        { "feature": "GPU" },
        { "feature": "Lưu trữ" },
        { "feature": "Giá" },
        { "feature": "Cân nặng" },
        { "feature": "Pin" },
        { "feature": "Màn hình" }
    ];

    mockComparisonDetails.forEach(item => {
        selectedLaptopIDs.forEach((id, index) => {
            const product = laptopData[index];
            const feature = item.feature.toLowerCase();
            
            // Gán giá trị dựa trên tên 'feature', đảm bảo an toàn
            switch (feature) {
                case 'cpu': item[id] = product.cpu || 'N/A'; break;
                case 'ram': item[id] = product.ram || 'N/A'; break;
                case 'gpu': item[id] = product.gpu || 'N/A'; break;
                case 'lưu trữ': item[id] = product.storage || 'N/A'; break;
                case 'giá': item[id] = formatPrice(product.price); break;
                case 'cân nặng': item[id] = product.weight || 'N/A'; break;
                case 'pin': item[id] = product.battery || 'N/A'; break;
                case 'màn hình': item[id] = product.screen || 'N/A'; break;
            }
        });
    });

    // 6. Trả về kết quả
    return {
        summary: aiSummary,
        laptop_names: laptopNames, 
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