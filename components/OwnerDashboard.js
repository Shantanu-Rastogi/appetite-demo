const { useState, useEffect, useMemo, useCallback } = React;

// --- 4. OWNER DASHBOARD VIEW ---
function OwnerDashboard({ customers, sales, ncOrders = [], creditNotes = [], setCreditNotes, setGlobalSales, inventoryLedger }) {
  const [activeTab, setActiveTab] = useState('kpi');
  const [showLiabilityDetails, setShowLiabilityDetails] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dismissedStockAlerts, setDismissedStockAlerts] = useState(false);
  
  // Universal Filter Bar State
  const [filterTime, setFilterTime] = useState('Today');
  const [filterCompare, setFilterCompare] = useState('Previous Period');
  const [filterChannel, setFilterChannel] = useState('All Channels');
  const [filterOutlet, setFilterOutlet] = useState('Lumina');
  
  const totalNcCost = ncOrders.reduce((sum, order) => sum + (order.costPrice * order.qty), 0);

  // Dynamic calculations based on filters and huge dataset
  const filteredSales = (window.MOCK_SALES_HISTORY || []).filter(sale => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let timeMatch = true;
    if (filterTime === 'Today') timeMatch = sale.timestamp >= now - oneDay;
    else if (filterTime === 'This Week') timeMatch = sale.timestamp >= now - (oneDay * 7);
    else if (filterTime === 'This Month') timeMatch = sale.timestamp >= now - (oneDay * 30);
    
    const channelMatch = filterChannel === 'All Channels' || sale.channel === filterChannel;
    const outletMatch = filterOutlet === 'All Outlets' || sale.outlet === filterOutlet;
    
    return timeMatch && channelMatch && outletMatch;
  });

  const computedSales = {
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.amount, 0),
    ordersToday: filteredSales.length
  };

  const availableSeats = 50; 
  const hours = filterTime === 'Today' ? 8 : (filterTime === 'This Week' ? 56 : 240); 
  
  const revPASH = window.AnalyticsHub ? window.AnalyticsHub.calculateRevPASH(computedSales.totalRevenue, availableSeats, hours) : 0;
  
  const foodCost = computedSales.totalRevenue * 0.3; 
  const laborCost = computedSales.totalRevenue * 0.2; 
  const primeCostPct = window.AnalyticsHub ? window.AnalyticsHub.calculatePrimeCostPct(foodCost, laborCost, computedSales.totalRevenue) : 0;

  return (
    <div className="dashboard-view">
      <div className="dash-sidebar">
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)' }}>Lumina</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kalyani Nagar</p>
        </div>
        <nav>
          <div className={`nav-item ${activeTab === 'kpi' ? 'active' : ''}`} onClick={() => setActiveTab('kpi')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-chart-line"></i> Operations KPIs
          </div>
          <div className={`nav-item ${activeTab === 'operations' ? 'active' : ''}`} onClick={() => setActiveTab('operations')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-boxes-stacked"></i> Operations Pulse
          </div>
          <div className={`nav-item ${activeTab === 'guest_insights' ? 'active' : ''}`} onClick={() => setActiveTab('guest_insights')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-users-viewfinder"></i> Guest Insights
          </div>
          <div className={`nav-item ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-id-card"></i> CRM & Loyalty
          </div>
          <div className={`nav-item ${activeTab === 'liability' ? 'active' : ''}`} onClick={() => setActiveTab('liability')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-scale-unbalanced"></i> Liability Dashboard
          </div>
        </nav>
      </div>

      <div className="dash-main glass-panel" style={{ padding: '1.5rem' }}>
        {/* Universal Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-darker)', borderRadius: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time Period</label>
            <select value={filterTime} onChange={e => setFilterTime(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comparison</label>
            <select value={filterCompare} onChange={e => setFilterCompare(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
              <option>Previous Period</option>
              <option>Last Year</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Channel</label>
            <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
              <option>All Channels</option>
              <option>Dine-In</option>
              <option>Delivery</option>
              <option>Takeaway</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outlet</label>
            <select value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
              <option>Lumina</option>
              <option>All Outlets</option>
            </select>
          </div>
        </div>
        {activeTab === 'kpi' && (
          <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            <div className="dash-header">
              <h2>Command Center</h2>
              <p>Live sales data and operational metrics.</p>
            </div>

            {/* Sophisticated KPI Grid */}
            <div className="stats-grid" style={{ marginTop: '2rem' }}>
              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid var(--primary)' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-wallet"></i> Gross Revenue</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{computedSales.totalRevenue.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--primary)' }}><i className="fa-solid fa-arrow-trend-up"></i> 14% vs last week</span>
                  <span style={{ color: 'var(--text-muted)' }}>Target: ₹200K</span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-glass)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: '62%', height: '100%', background: 'var(--primary)' }}></div>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #3b82f6' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-receipt"></i> Total Orders</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{computedSales.ordersToday}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#3b82f6' }}><i className="fa-solid fa-arrow-trend-up"></i> 5% vs yesterday</span>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Ticket: ₹{Math.floor(computedSales.totalRevenue / computedSales.ordersToday || 0)}</span>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #f59e0b' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-clock"></i> Table Turn Time</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>42 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>mins</span></span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#ef4444' }}><i className="fa-solid fa-arrow-trend-up"></i> 4 mins slower</span>
                </div>
              </div>

              <div className="stat-card glass-panel" onClick={() => setShowLiabilityDetails(!showLiabilityDetails)} style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #8b5cf6', cursor: 'pointer' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-gift"></i> Liability (Points)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Math.floor(computedSales.totalRevenue * 0.08).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#ef4444' }}>Outstanding Wallet Balances</span>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, var(--bg-card), #111827)', borderTop: '4px solid #ef4444' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-hand-holding-heart"></i> NC Expenses</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{totalNcCost.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>House expenses (Cost Price)</span>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #10b981' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-chair"></i> RevPASH</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Math.floor(revPASH)}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Per available seat hour</span>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #f59e0b' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-percent"></i> Prime Cost %</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{primeCostPct.toFixed(1)}%</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target: &lt; 60%</span>
                </div>
              </div>

              <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #ef4444' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-dumpster"></i> Waste & Void Cost</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Math.floor(computedSales.totalRevenue * 0.05).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#ef4444' }}><i className="fa-solid fa-arrow-trend-up"></i> 5% of revenue</span>
                </div>
              </div>
            </div>

            {showLiabilityDetails && (
              <div className="glass-panel fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card)', borderTop: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}><i className="fa-solid fa-gift" style={{ color: '#8b5cf6', marginRight: '0.5rem' }}></i> Liability Breakdown (Points)</h3>
                  <button onClick={() => setShowLiabilityDetails(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><i className="fa-solid fa-times"></i></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {customers.map(c => {
                    const points = c.pointsByRestaurant?.['Lumina - Fine Dine'] || 0;
                    return (
                      <div key={c.phone} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                        </div>
                        <div style={{ fontWeight: '800', color: '#8b5cf6', fontSize: '1rem' }}>Regular</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* USP Metrics (KPI Compliance) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderTop: '4px solid var(--primary)' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>RevPASH</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.5rem' }}>₹250</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Revenue per available seat hour</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderTop: '4px solid #10b981' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prime Cost %</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>50%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: &lt; 60%</div>
              </div>
            </div>

            {/* Revenue Activity (Full Width for better display) */}
            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-card)', borderTop: '4px solid var(--primary)', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-chart-area" style={{ color: 'var(--primary)' }}></i> Revenue Activity (Today)</h3>
                <span style={{ fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '14px', fontWeight: 'bold' }}>Live Updates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '220px', paddingTop: '1rem' }}>
                {[30, 45, 20, 80, 100, 75, 40, 60, 90, 120, 140, 110].map((h, i) => (
                  <div key={i} className="jump-hover" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: h > 100 ? 'linear-gradient(to top, var(--primary), #34d399)' : 'rgba(16, 185, 129, 0.2)', borderRadius: '6px 6px 0 0', cursor: 'pointer', transition: '0.3s' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginTop: '0.75rem' }}>{11 + i}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Balanced Grid for Matrix and Small Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              
              {/* Menu Engineering Matrix */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.1rem' }}><i className="fa-solid fa-border-all" style={{ color: '#f59e0b', marginRight: '0.5rem' }}></i> Menu Engineering Matrix</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {(() => {
                    const mockSalesData = [
                      { name: 'Dynamite Prawns', qty: filterTime === 'Today' ? 50 : 350 },
                      { name: 'Mutton Seekh', qty: filterTime === 'Today' ? 30 : 150 },
                      { name: 'Truffle Fries', qty: filterTime === 'Today' ? 40 : 300 },
                      { name: 'Old Fashioned', qty: filterTime === 'Today' ? 20 : 200 },
                      { name: 'Truffle Mushroom Risotto', qty: filterTime === 'Today' ? 10 : 80 }
                    ];
                    let matrix = { stars: [], puzzles: [], plowhorses: [], dogs: [] };
                    matrix = window.AnalyticsHub ? (window.AnalyticsHub.categorizeItems(window.LUMINA_MENU, mockSalesData) || matrix) : matrix;
                    
                    return (
                      <>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '120px', overflowY: 'auto' }}>
                          <span style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>Stars</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{(matrix.stars || []).join(', ') || 'None'}</span>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '120px', overflowY: 'auto' }}>
                          <span style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>Puzzles</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{(matrix.puzzles || []).join(', ') || 'None'}</span>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '120px', overflowY: 'auto' }}>
                          <span style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>Plowhorses</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{(matrix.plowhorses || []).join(', ') || 'None'}</span>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '120px', overflowY: 'auto' }}>
                          <span style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>Dogs</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{(matrix.dogs || []).join(', ') || 'None'}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sales by Category (Rich Progress Bars) */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}><i className="fa-solid fa-chart-pie" style={{ color: '#8b5cf6', marginRight: '0.5rem' }}></i> Sales by Category</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Mains', pct: 45, color: '#3b82f6' },
                    { label: 'Starters', pct: 30, color: '#10b981' },
                    { label: 'Beverages', pct: 15, color: '#f59e0b' },
                    { label: 'Desserts', pct: 10, color: '#8b5cf6' }
                  ].map(cat => (
                    <div key={cat.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{cat.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{cat.pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                        <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plate Waste Index (Rich Progress Bars) */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}><i className="fa-solid fa-scale-unbalanced" style={{ color: '#ec4899', marginRight: '0.5rem' }}></i> Plate Waste Index</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Too Much', pct: 12, color: '#ef4444' },
                    { label: 'Perfect', pct: 82, color: '#10b981' },
                    { label: 'Too Little', pct: 6, color: '#f59e0b' }
                  ].map(cat => (
                    <div key={cat.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{cat.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{cat.pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                        <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            <div className="dash-header">
              <h2>Operations Pulse</h2>
              <p>Live inventory stock and operations alerts.</p>
            </div>

            {(() => {
              const items = Object.keys(inventoryLedger || {});
              let normalCount = 0;
              let concerningCount = 0;
              let criticalCount = 0;
              
              items.forEach(item => {
                let hash = 0;
                for (let i = 0; i < item.length; i++) hash = item.charCodeAt(i) + ((hash << 5) - hash);
                const variance = Math.abs(hash % 15);
                if (variance > 10) criticalCount++;
                else if (variance > 5) concerningCount++;
                else normalCount++;
              });

              return (
                <>
                  {/* Variance HUD */}
                  <div className="stats-grid" style={{ marginTop: '2rem' }}>
                    <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #10b981' }}>
                      <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-scale-balanced"></i> Normal Variance</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{normalCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>items</span></span>
                      </div>
                    </div>
                    <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #f59e0b' }}>
                      <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-triangle-exclamation"></i> Concerning (&gt;5%)</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{concerningCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>items</span></span>
                      </div>
                    </div>
                    <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, #ffffff, #f3f4f6)', borderTop: '4px solid #ef4444' }}>
                      <span className="stat-title" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-circle-exclamation"></i> Critical (&gt;10%)</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>{criticalCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>items</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Alerts Banner */}
                  {!dismissedStockAlerts && (
                    <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #fef2f2, #ffffff)', border: '2px solid #ef4444', borderRadius: '12px', position: 'relative' }}>
                      <button onClick={() => setDismissedStockAlerts(true)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }}>&times;</button>
                      <h3 style={{ color: '#b91c1c', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> Critical Low Stock Alerts
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {items.map(item => {
                          const theoretical = inventoryLedger[item];
                          const stock = theoretical ? theoretical.stock : 0;
                          const unit = theoretical ? theoretical.unit : '';
                          
                          const threshold = unit === 'ml' ? 1000 : 500;
                          
                          if (stock < threshold) {
                            return (
                              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>Zone: {theoretical.zone}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <span style={{ color: '#ef4444', fontWeight: '800' }}>{stock} {unit}</span>
                                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Below Threshold</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock Ledger Table */}
                  <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)' }}><i className="fa-solid fa-list-check"></i> Stock Ledger</h3>
                      <input type="text" placeholder="Search SKUs..." style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem' }}>SKU / Item</th>
                            <th style={{ padding: '0.75rem' }}>Batch ID</th>
                            <th style={{ padding: '0.75rem' }}>Current Qty</th>
                            <th style={{ padding: '0.75rem' }}>Storage Zone</th>
                            <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => {
                            const theoretical = inventoryLedger[item];
                            const stock = theoretical ? theoretical.stock : 0;
                            const unit = theoretical ? theoretical.unit : '';
                            const batch = theoretical && theoretical.batches && theoretical.batches[0] ? theoretical.batches[0] : null;
                            const exp = batch ? new Date(batch.exp).toLocaleDateString() : 'N/A';
                            
                            let hash = 0;
                            for (let i = 0; i < item.length; i++) hash = item.charCodeAt(i) + ((hash << 5) - hash);
                            const variance = (hash % 15);
                            
                            let statusColor = '#10b981';
                            let statusText = 'Normal';
                            if (Math.abs(variance) > 10) {
                              statusColor = '#ef4444';
                              statusText = 'Critical';
                            } else if (Math.abs(variance) > 5) {
                              statusColor = '#f59e0b';
                              statusText = 'Concerning';
                            }
                            
                            return (
                              <tr key={item} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>BCH-{Math.abs(hash % 1000)}</td>
                                <td style={{ padding: '0.75rem' }}>{stock} {unit}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Main Store</td>
                                <td style={{ padding: '0.75rem' }}>{exp}</td>
                                <td style={{ padding: '0.75rem' }}>
                                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px', background: `${statusColor}20`, color: statusColor }}>{statusText} ({variance}%)</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Waste Tracking */}
            <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}><i className="fa-solid fa-chart-bar"></i> Void & Waste Cost</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Chart placeholder - Void & Waste Cost over time
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guest_insights' && (
          <div className="fade-in" style={{ paddingBottom: '2rem' }}>
            <div className="dash-header">
              <h2>Guest Insights</h2>
              <p>AI-powered behavioral and interest profiling based on order history.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              {/* Behavioral Data */}
              <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}><i className="fa-solid fa-user-tag"></i> Behavioral Data</h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>Visit Frequency</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', height: '24px' }}>
                    <div style={{ flex: 4, background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>Weekly (40%)</div>
                    <div style={{ flex: 3, background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>Monthly (30%)</div>
                    <div style={{ flex: 2, background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>Rarely (20%)</div>
                    <div style={{ flex: 1, background: '#ef4444', borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>Average Spend per Visit</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>65%</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹1k - ₹2.5k</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--primary)' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>25%</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹2.5k - ₹5k</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>10%</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹5k+ (VIP)</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Dining Preferences</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="loyalty-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Vegetarian Leaning</span>
                    <span className="loyalty-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>Dessert Lovers</span>
                    <span className="loyalty-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>High Cocktail Affinity</span>
                    <span className="loyalty-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Weekend Diners</span>
                  </div>
                </div>
              </div>

              {/* Interest Data */}
              <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '1.5rem' }}><i className="fa-solid fa-icons"></i> Interest & Demographic Data</h3>

                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>Age Distribution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '50px', fontSize: '0.8rem' }}>18-24</div><div style={{ flex: 1, height: '8px', background: 'var(--bg-glass)', borderRadius: '4px' }}><div style={{ width: '20%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div></div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '50px', fontSize: '0.8rem' }}>25-34</div><div style={{ flex: 1, height: '8px', background: 'var(--bg-glass)', borderRadius: '4px' }}><div style={{ width: '55%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div></div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '50px', fontSize: '0.8rem' }}>35-44</div><div style={{ flex: 1, height: '8px', background: 'var(--bg-glass)', borderRadius: '4px' }}><div style={{ width: '15%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div></div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '50px', fontSize: '0.8rem' }}>45+</div><div style={{ flex: 1, height: '8px', background: 'var(--bg-glass)', borderRadius: '4px' }}><div style={{ width: '10%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div></div></div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>Gender</div>
                    <div style={{ display: 'flex', gap: '1rem', height: '100px' }}>
                      <div style={{ flex: 1, background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #3b82f6' }}>
                        <i className="fa-solid fa-person" style={{ fontSize: '2rem', color: '#3b82f6' }}></i>
                        <span style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#3b82f6' }}>48%</span>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(236,72,153,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #ec4899' }}>
                        <i className="fa-solid fa-person-dress" style={{ fontSize: '2rem', color: '#ec4899' }}></i>
                        <span style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#ec4899' }}>52%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>Lifestyle & Affinities</div>
                  <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: '#10b981', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}><i className="fa-solid fa-dumbbell"></i></div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>Fitness Enthusiasts</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>32% of audience</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: '#8b5cf6', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}><i className="fa-solid fa-music"></i></div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>Live Music Fans</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>68% of audience</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Spenders & Loyal Guests */}
              <div className="glass-panel fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}><i className="fa-solid fa-crown"></i> Top Spenders & Loyal Guests</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Guest Name</th>
                        <th style={{ padding: '0.75rem' }}>Total Spend</th>
                        <th style={{ padding: '0.75rem' }}>Visits</th>
                        <th style={{ padding: '0.75rem' }}>Avg Ticket</th>
                        <th style={{ padding: '0.75rem' }}>Favorite Item</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Amit Sharma', spend: '₹45,200', visits: 12, avg: '₹3,766', fav: 'Truffle Mushroom Risotto', status: 'VIP' },
                        { name: 'Priya Patel', spend: '₹38,500', visits: 9, avg: '₹4,277', fav: 'Dynamite Prawns', status: 'VIP' },
                        { name: 'Rahul Verma', spend: '₹28,900', visits: 15, avg: '₹1,926', fav: 'Old Fashioned', status: 'Regular' },
                        { name: 'Sneha Gupta', spend: '₹22,400', visits: 6, avg: '₹3,733', fav: 'Mutton Seekh', status: 'Regular' },
                        { name: 'Vikram Singh', spend: '₹18,600', visits: 4, avg: '₹4,650', fav: 'Lumina Menu', status: 'Occasional' },
                        { name: 'Ananya Rao', spend: '₹15,200', visits: 8, avg: '₹1,900', fav: 'Truffle Fries', status: 'Regular' }
                      ].map((guest, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{guest.name}</td>
                          <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>{guest.spend}</td>
                          <td style={{ padding: '0.75rem' }}>{guest.visits}</td>
                          <td style={{ padding: '0.75rem' }}>{guest.avg}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{guest.fav}</td>
                          <td>
                            <span style={{ 
                              background: guest.status === 'VIP' ? 'rgba(245,158,11,0.2)' : guest.status === 'Regular' ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)',
                              color: guest.status === 'VIP' ? '#f59e0b' : guest.status === 'Regular' ? '#10b981' : '#6b7280',
                              padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                            }}>
                              {guest.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-panel fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderTop: '4px solid #10b981' }}>
                <h3 style={{ color: '#10b981', marginBottom: '1rem' }}><i className="fa-solid fa-robot"></i> AI Recommendations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Target Live Music Fans</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>68% of your audience likes live music. Consider a weekend live music event to boost sales.</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Promote Healthy Options</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>32% are fitness enthusiasts. Feature salads and healthy bowls on the menu.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="fade-in">
            <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Customer Database</h2>
                <p>AI-driven loyalty points (Syncs after Waiter Payment Confirmation).</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <i className="fa-solid fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={crmSearch}
                  onChange={e => setCrmSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['All', 'VIP', 'Regular', 'New'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setCrmFilter(tag)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '20px', 
                      border: '1px solid', 
                      borderColor: crmFilter === tag ? 'var(--primary)' : 'var(--glass-border)', 
                      background: crmFilter === tag ? 'var(--primary)' : 'transparent', 
                      color: crmFilter === tag ? '#fff' : 'var(--text-main)', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table className="data-table">
                <thead><tr><th>Customer Info</th><th>Loyalty Value</th><th>Total Visits</th><th>Tags</th></tr></thead>
                <tbody>
                  {customers
                    .filter(c => {
                      const matchesSearch = c.name.toLowerCase().includes(crmSearch.toLowerCase()) || c.phone.includes(crmSearch);
                      const matchesFilter = crmFilter === 'All' || c.tags.includes(crmFilter);
                      return matchesSearch && matchesFilter;
                    })
                    .map((c, i) => (
                    <tr key={i} onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                      <td><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div></td>
                      <td><div style={{ fontWeight: 700, color: 'var(--primary)' }}>Regular</div></td>
                      <td>{c.visits}</td>
                      <td><div style={{ display: 'flex', gap: '0.25rem' }}>{c.tags.map(t => <span key={t} className="loyalty-badge">{t}</span>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCustomer && (
              <div className="modal-overlay fade-in" onClick={() => setSelectedCustomer(null)} style={{ backdropFilter: 'blur(5px)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-main)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedCustomer.name}</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Loyalty Value</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Regular</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Visits</span>
                      <span style={{ fontWeight: 'bold' }}>{selectedCustomer.visits}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tags</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {selectedCustomer.tags.map(t => <span key={t} className="loyalty-badge">{t}</span>)}
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn-primary" onClick={() => setSelectedCustomer(null)} style={{ width: '100%' }}>Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liability' && (
          <div className="fade-in" style={{ padding: '2rem' }}>
            <div className="dash-header">
              <h2>Liability Dashboard</h2>
              <p>Pending credit notes and amounts owed by regular guests.</p>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {creditNotes.map((cn, idx) => (
                <div key={`cn-${idx}`} className="glass-panel" style={{ background: '#111827', color: '#fff', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#8b5cf6', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}><i className="fa-solid fa-credit-card"></i> Credit Note</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{cn.guestName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Table: {cn.table} | Amount: ₹{cn.amount}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => {
                      setGlobalSales(prev => ({ ...prev, totalRevenue: prev.totalRevenue + cn.amount }));
                      setCreditNotes(prev => prev.filter((_, i) => i !== idx));
                      alert(`Payment of ₹${cn.amount} received from ${cn.guestName}. Sales updated.`);
                    }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Mark Paid</button>
                  </div>
                </div>
              ))}
              {creditNotes.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No pending credit notes.</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

window.OwnerDashboard = OwnerDashboard;
