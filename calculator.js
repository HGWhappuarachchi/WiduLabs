/**
 * Widu Labs - Cost Engineering & Invoice Matrix (All Constraints Fixed)
 */

const CONFIG = {
    fixedMachineOverhead: 350.00,
    fixedPreProcessing: 100.00,
    fixedPostProcessing: 350.00,
    fixedRiskContingency: 240.00,
    fixedDeliveryFee: 460.00
};

document.getElementById('calculateBtn').addEventListener('click', processQuotation);
document.getElementById('downloadBtn').addEventListener('click', downloadInvoicePDF);

let computedTotal = 0;

function processQuotation() {
    const pricePerKg = parseFloat(document.getElementById('pricePerKg').value) || 0;
    const weightUsedGrams = parseFloat(document.getElementById('weight').value) || 0;
    const hours = parseFloat(document.getElementById('hours').value) || 0;
    const minutes = parseFloat(document.getElementById('minutes').value) || 0;
    const discountRate = parseFloat(document.getElementById('discountType').value) || 0;
    const isDeliveryChecked = document.getElementById('includeDelivery').checked;
    
    const discountSelect = document.getElementById('discountType');
    const discountLabelText = discountSelect.options[discountSelect.selectedIndex].text;

    if (pricePerKg <= 0 || weightUsedGrams <= 0 || (hours === 0 && minutes === 0)) {
        alert("Execution Error: Invalid System Parameters Entered.");
        return;
    }

    // 1. Raw material baseline calculation
    const costPerGram = pricePerKg / 1000;
    const directMaterialCost = costPerGram * weightUsedGrams;

    // 2. Base Production Subtotal
    const baseProductionSubtotal = directMaterialCost + 
                                   CONFIG.fixedMachineOverhead + 
                                   CONFIG.fixedPreProcessing + 
                                   CONFIG.fixedPostProcessing + 
                                   CONFIG.fixedRiskContingency;

    // 3. Discount Mitigation Execution
    let totalDeduction = 0;
    const discountRow = document.getElementById('invoice-discount-row');
    
    if (discountRate > 0) {
        totalDeduction = baseProductionSubtotal * discountRate;
        document.getElementById('lbl-discount-type').innerText = `Applied: ${discountLabelText}`;
        document.getElementById('bill-discount').innerText = `-${totalDeduction.toFixed(2)}`;
        discountRow.style.display = 'table-row';
    } else {
        discountRow.style.display = 'none';
    }

    // 4. Logistics Toggle Processing
    const deliveryRow = document.getElementById('invoice-delivery-row');
    let dynamicDeliveryCost = 0;
    
    if (isDeliveryChecked) {
        dynamicDeliveryCost = CONFIG.fixedDeliveryFee;
        deliveryRow.style.display = 'table-row';
    } else {
        deliveryRow.style.display = 'none';
    }

    // 5. Final Compilation Equation
    computedTotal = (baseProductionSubtotal - totalDeduction) + dynamicDeliveryCost;

    // 6. Data Rendering to Document Object Model
    document.getElementById('lbl-weight').innerText = `${weightUsedGrams.toFixed(3)}g structural allocation`;
    document.getElementById('lbl-time').innerText = `${hours}h ${minutes}m continuous execution runtime`;

    document.getElementById('bill-material').innerText = directMaterialCost.toFixed(2);
    document.getElementById('bill-operational').innerText = CONFIG.fixedMachineOverhead.toFixed(2);
    document.getElementById('bill-preprocessing').innerText = CONFIG.fixedPreProcessing.toFixed(2);
    document.getElementById('bill-postprocessing').innerText = CONFIG.fixedPostProcessing.toFixed(2);
    document.getElementById('bill-risk').innerText = CONFIG.fixedRiskContingency.toFixed(2);
    document.getElementById('bill-total').innerText = computedTotal.toFixed(2);

    // Date and uniquely structured document serial generation
    const dateOpts = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateFormatted = new Date().toLocaleDateString('en-US', dateOpts);
    document.getElementById('invoice-date').innerText = `Date of Issue: ${dateFormatted}`;
    
    const timestampSeed = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('bill-serial').innerText = `DOC-REF: #WL-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${timestampSeed}`;

    // Enable PDF compilation
    document.getElementById('downloadBtn').disabled = false;
}

function downloadInvoicePDF() {
    if (computedTotal <= 0) return;

    const element = document.getElementById('invoice-bill');
    const docRef = document.getElementById('bill-serial').innerText.replace("DOC-REF: #", "");
    
    const optimizationOptions = {
        margin:       12,
        filename:     `WIDU_LABS_INV_${docRef}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(optimizationOptions).from(element).save();
}