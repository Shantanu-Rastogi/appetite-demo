// LoyaltyManager.js
// Responsible for Loyalty Points and Guest Segmentation in Appetite OS

window.LoyaltyManager = {
  // NEW: Points Clawback System
  clawbackDormantPoints: function(customers, dormantThresholdDays = 60) {
    console.log("Identifying dormant members and clawing back points liability...");
    const now = Date.now();
    const thresholdMs = dormantThresholdDays * 24 * 60 * 60 * 1000;
    let liabilityTransferred = 0;
    
    const updatedCustomers = customers.map(customer => {
      const lastVisit = customer.lastVisit || now; // Fallback to now if not available
      const isDormant = (now - lastVisit) > thresholdMs;
      
      if (isDormant && customer.points > 0) {
        liabilityTransferred += customer.points;
        return { ...customer, points: 0, pointsClawedBack: customer.points };
      }
      return customer;
    });
    
    return { updatedCustomers, liabilityTransferred };
  },

  // NEW: Guest Lifetime Value (LTV) Tracking
  calculateLTV: function(customer) {
    // Simple LTV = Average Spend per visit * Total Visits
    const avgSpend = customer.totalSpend / (customer.visits || 1);
    return avgSpend * customer.visits;
  }
};
