// AnalyticsHub.js
// Responsible for the Universal Owner Dashboard and Analytics in Appetite OS

window.AnalyticsHub = {
  // NEW: Menu Engineering Matrix
  categorizeItems: function (menuItems, salesData) {
    console.log("Categorizing items into matrix quadrants...");
    const matrix = { stars: [], puzzles: [], plowhorses: [], dogs: [] };

    // Aggregate sales by item name
    const aggregatedSales = {};
    salesData.forEach(sale => {
      const name = sale.name || sale.itemName;
      if (!aggregatedSales[name]) aggregatedSales[name] = 0;
      aggregatedSales[name] += sale.qty;
    });

    const totalSales = Object.values(aggregatedSales).reduce((sum, qty) => sum + qty, 0);
    const avgPopularity = totalSales / menuItems.length;

    const totalMargin = Object.keys(aggregatedSales).reduce((sum, name) => {
      const product = menuItems.find(p => p.name === name);
      const margin = product ? (product.price - (product.costPrice || 0)) * aggregatedSales[name] : 0;
      return sum + margin;
    }, 0);

    const avgWeightedMargin = totalSales > 0 ? totalMargin / totalSales : 0;

    Object.keys(aggregatedSales).forEach(name => {
      const product = menuItems.find(p => p.name === name);
      if (!product) return;

      const margin = product.price - (product.costPrice || 0);
      const popularity = aggregatedSales[name];

      const isHighPop = popularity >= avgPopularity;
      const isHighMargin = margin >= avgWeightedMargin;

      if (isHighPop && isHighMargin) matrix.stars.push(name);
      else if (!isHighPop && isHighMargin) matrix.puzzles.push(name);
      else if (isHighPop && !isHighMargin) matrix.plowhorses.push(name);
      else matrix.dogs.push(name);
    });

    // Add items with 0 sales to dogs or puzzles based on margin
    menuItems.forEach(product => {
      if (!aggregatedSales[product.name]) {
        const margin = product.price - (product.costPrice || 0);
        const isHighMargin = margin >= avgWeightedMargin;
        if (isHighMargin) matrix.puzzles.push(product.name);
        else matrix.dogs.push(product.name);
      }
    });

    return matrix;
  },

  // NEW: Guest 360 & Segmentation
  segmentGuests: function (guests) {
    console.log("Segmenting guests...");
    const segments = {
      'Music & Nightlife': [],
      'Corporate': [],
      'Foodies': [],
      'Regulars': []
    };

    guests.forEach(guest => {
      // Mock logic based on visits and spend
      if (guest.visits > 10 && guest.totalSpend > 50000) {
        segments['Regulars'].push(guest.name);
      }

      if (guest.preferences && guest.preferences.includes('Cocktails')) {
        segments['Music & Nightlife'].push(guest.name);
      }

      if (guest.company) {
        segments['Corporate'].push(guest.name);
      }

      if (guest.preferences && guest.preferences.includes('Fine Dining')) {
        segments['Foodies'].push(guest.name);
      }
    });

    return segments;
  },

  // NEW: Financial Pulse
  calculateRevPASH: function (revenue, availableSeats, hours) {
    return revenue / (availableSeats * hours);
  },

  calculatePrimeCostPct: function (foodCost, laborCost, totalRevenue) {
    const pct = ((foodCost + laborCost) / totalRevenue) * 100;
    if (pct > 60) {
      alert('Prime Cost Alert: Prime Cost exceeds 60%!');
    }
    return pct;
  }
};
