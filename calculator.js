/**
 * Widu Labs - Cost Engineering & Invoice Matrix (Refactored Logic)
 */

const CONFIG = {
    materialMarkupMultiplier: 1.3, // Compressed markup
    hourlyExecutionRate: 120.00,   // Reduced from 150
    baseMachineOverhead: 300.00,   // Reduced from 450
    fixedPreProcessing: 100.00,    // Reduced from 150
    fixedPostProcessing: 250.00,   // Reduced from 350
    fixedRiskContingency: 150.00,  // Reduced from 250
    fixedDeliveryFee: 460.00
};

document.getElementById('calculateBtn').addEventListener('click', processQuotation);
document.getElementById('downloadBtn').addEventListener('click', downloadInvoicePDF);

let computedTotal = 0;

function processQuotation() {
    const clientName = document.getElementById('customerName').value.trim() || "N/A";
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

    // 1. Raw material baseline with compressed profit markup
    const costPerGram = pricePerKg / 1000;
    const directMaterialCost = (costPerGram * weightUsedGrams) * CONFIG.materialMarkupMultiplier;

    // 2. Active Time Matrix Calculation
    const totalRuntimeHours = hours + (minutes / 60);
    const dynamicMachineCost = CONFIG.baseMachineOverhead + (totalRuntimeHours * CONFIG.hourlyExecutionRate);

    // 3. Base Production Subtotal
    const baseProductionSubtotal = directMaterialCost + 
                                   dynamicMachineCost + 
                                   CONFIG.fixedPreProcessing + 
                                   CONFIG.fixedPostProcessing + 
                                   CONFIG.fixedRiskContingency;

    // 4. Discount Mitigation Execution
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

    // 5. Logistics Toggle Processing
    let dynamicDeliveryCost = 0;
    const deliveryCell = document.getElementById('bill-delivery');
    
    if (isDeliveryChecked) {
        dynamicDeliveryCost = CONFIG.fixedDeliveryFee;
        deliveryCell.innerText = dynamicDeliveryCost.toFixed(2);
        deliveryCell.classList.remove('delivery-free');
    } else {
        deliveryCell.innerText = "FREE";
        deliveryCell.classList.add('delivery-free');
    }

    // 6. Final Compilation Equation
    computedTotal = (baseProductionSubtotal - totalDeduction) + dynamicDeliveryCost;

    // 7. Data Rendering to Document Object Model
    document.getElementById('bill-client').innerText = `CLIENT: ${clientName}`;
    document.getElementById('lbl-weight').innerText = `${weightUsedGrams.toFixed(3)}g structural allocation`;
    document.getElementById('lbl-time').innerText = `${hours}h ${minutes}m total execution runtime`;

    document.getElementById('bill-material').innerText = directMaterialCost.toFixed(2);
    document.getElementById('bill-operational').innerText = dynamicMachineCost.toFixed(2);
    document.getElementById('bill-preprocessing').innerText = CONFIG.fixedPreProcessing.toFixed(2);
    document.getElementById('bill-postprocessing').innerText = CONFIG.fixedPostProcessing.toFixed(2);
    document.getElementById('bill-risk').innerText = CONFIG.fixedRiskContingency.toFixed(2);
    document.getElementById('bill-total').innerText = computedTotal.toFixed(2);

    // Date and structured document serial generation
    const dateOpts = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateFormatted = new Date().toLocaleDateString('en-US', dateOpts);
    document.getElementById('invoice-date').innerText = `Date of Issue: ${dateFormatted}`;
    
    const timestampSeed = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('bill-serial').innerText = `DOC-REF: #WL-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${timestampSeed}`;

    document.getElementById('downloadBtn').disabled = false;
}

function downloadInvoicePDF() {
    // 1. Fix the silent failure with explicit user feedback
    if (computedTotal <= 0) {
        alert("Execution Error: You must compile metrics before exporting the official invoice.");
        return;
    }

    const element = document.getElementById('invoice-bill');
    const docRef = document.getElementById('bill-serial').innerText.replace("DOC-REF: #", "");
    
    // Failsafe for client name string parsing
    const nameInput = document.getElementById('customerName');
    const clientNameStr = (nameInput && nameInput.value) 
        ? nameInput.value.trim().replace(/\s+/g, '_').toUpperCase() 
        : "CLIENT";
    
    // 2. Bypass Canvas Taint and optimize renderer
    const optimizationOptions = {
        margin:       12,
        filename:     `WIDU_LABS_INV_${clientNameStr}_${docRef}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true, // Critical fix for local logo rendering
            logging: false
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 3. System status UI injection
    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerText;
    btn.innerText = "COMPILING PDF...";
    btn.disabled = true;

    // 4. Promise-based execution with error catching
    html2pdf().set(optimizationOptions).from(element).save().then(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    }).catch(err => {
        alert("System Error: PDF Generation Failed. If running this file directly from your desktop, your browser is blocking the logo image. Run this via a local server (like VS Code Live Server) or remove the logo.");
        console.error("PDF Engine Error:", err);
        btn.innerText = originalText;
        btn.disabled = false;
    });
}