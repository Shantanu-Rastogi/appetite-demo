// InventoryEngine.js
// Responsible for Advanced Inventory Management in Appetite OS

window.InventoryEngine = {
  // Existing function moved from app.js
  checkInventoryStatus: function(stock, unit) {
    if (stock <= 0) return 'sold_out';
    if (unit === 'portions' && stock < 10) return 'low';
    if (unit === 'kg' && stock < 2) return 'low';
    if (unit === 'grams' && stock < 500) return 'low';
    if (unit === 'liters' && stock < 2) return 'low';
    if (unit === 'ml' && stock < 750) return 'low';
    return 'ok';
  },

  // NEW: Recipe-Based Deduction
  deductIngredients: function(order, currentStock, recipes) {
    console.log("Deducting ingredients for order:", order);
    const updatedStock = JSON.parse(JSON.stringify(currentStock)); // Deep clone
    order.items.forEach(item => {
      const recipe = recipes[item.name];
      if (recipe) {
        Object.entries(recipe).forEach(([ingredient, qty]) => {
          if (updatedStock[ingredient]) {
            let qtyToDeduct = qty * (item.qty || 1);
            const itemCategory = updatedStock[ingredient].category;
            
            // Apply rotation rule to sort batches
            updatedStock[ingredient].batches = this.applyRotationRule(itemCategory, updatedStock[ingredient].batches);
            
            // Deduct from batches
            for (let i = 0; i < updatedStock[ingredient].batches.length; i++) {
              const batch = updatedStock[ingredient].batches[i];
              if (qtyToDeduct <= 0) break;
              
              if (batch.qty >= qtyToDeduct) {
                batch.qty -= qtyToDeduct;
                qtyToDeduct = 0;
              } else {
                qtyToDeduct -= batch.qty;
                batch.qty = 0;
              }
            }
            
            // Update total stock
            updatedStock[ingredient].stock = updatedStock[ingredient].batches.reduce((sum, b) => sum + b.qty, 0);
          }
        });
      }
    });
    return updatedStock;
  },

  // NEW: Optimization Logic (FEFO, FIFO, LEFO) + Zone Picking
  applyRotationRule: function(category, batches) {
    console.log("Applying rotation rule for:", category);
    // Clone batches to avoid mutating original array during sort
    const sortedBatches = [...batches];
    
    // Sort logic
    sortedBatches.sort((a, b) => {
      // Rule 1: Zone 1 priority
      if (a.zone === 1 && b.zone !== 1) return -1;
      if (a.zone !== 1 && b.zone === 1) return 1;
      
      // Rule 2: Category specific rotation
      if (category === 'perishable') { // FEFO
        return a.exp - b.exp;
      } else if (category === 'spirit') { // LEFO
        return b.exp - a.exp;
      } else { // FIFO (default for dry and others)
        return a.exp - b.exp; // Assuming exp is also used for FIFO based on received date/lot
      }
    });
    
    return sortedBatches;
  },

  // NEW: Variance Tracking
  calculateVariance: function(physicalCount, theoreticalCount, itemName) {
    const variance = physicalCount - theoreticalCount;
    const variancePct = theoreticalCount > 0 ? (variance / theoreticalCount) * 100 : 0;
    const requiresAlert = Math.abs(variancePct) > 5;
    
    if (requiresAlert) {
      window.dispatchEvent(new CustomEvent('inventoryVarianceAlert', {
        detail: { item: itemName || 'Unknown Item', variancePct }
      }));
    }
    
    return { variance, variancePct, requiresAlert };
  }
};
