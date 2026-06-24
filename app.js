const { useState, useEffect, useMemo, useCallback } = React;



const INITIAL_CUSTOMERS = [
  { phone: '9876543210', name: 'Rahul S.', pointsByRestaurant: { 'Lumina - Fine Dine': 4500, 'Breeze Cafe': 1200 }, visits: 8, lastVisit: '10 mins ago', tags: ['VIP', 'Prawn Lover'] },
  { phone: '9876543211', name: 'Priya K.', pointsByRestaurant: { 'Lumina - Fine Dine': 1200 }, visits: 3, lastVisit: '1 day ago', tags: ['Dessert Lover', 'Weekend Diner'] },
  { phone: '9876543212', name: 'Amit Desai', pointsByRestaurant: { 'Lumina - Fine Dine': 8500, 'The Rusty Nail': 500 }, visits: 14, lastVisit: '2 days ago', tags: ['VIP', 'High Spender', 'Cocktails'] },
  { phone: '9876543213', name: 'Neha Gupta', pointsByRestaurant: { 'Lumina - Fine Dine': 300 }, visits: 1, lastVisit: '1 week ago', tags: ['New Customer', 'Vegetarian'] },
  { phone: '9876543214', name: 'Vikram Singh', pointsByRestaurant: { 'Lumina - Fine Dine': 2100 }, visits: 5, lastVisit: '3 weeks ago', tags: ['Spice Lover', 'Frequent'] },
];





// checkInventoryStatus moved to InventoryEngine.js

function App() {
  console.log("App component rendering start");
  const SuperAppComponent = window.SuperApp;
  const StaffAppComponent = window.StaffApp;
  const KitchenAppComponent = window.KitchenApp;
  const BarAppComponent = window.BarApp;
  const OwnerDashboardComponent = window.OwnerDashboard;
  const CustomerAppComponent = window.CustomerApp;
  // UPI Test Component removed

  const [viewMode, setViewMode] = useState('customer');
  const [isSuperAppReady, setIsSuperAppReady] = useState(false);
  const [componentsReady, setComponentsReady] = useState(false);
  const [dismissedHeaderAlerts, setDismissedHeaderAlerts] = useState([]);

  const [missingComponents, setMissingComponents] = useState([]);

  useEffect(() => {
    // Polling to ensure Babel Standalone scripts have all downloaded and executed
    const checkInterval = setInterval(() => {
      const required = [
        'LUMINA_MENU', 
        'StaffApp', 
        'KitchenApp', 
        'BarApp', 
        'OwnerDashboard', 
        'CustomerApp', 
        'WelcomeScreen', 
        'SuperApp'
      ];
      const missing = required.filter(k => !window[k]);
      setMissingComponents(missing);

      if (missing.length === 0) {
        setComponentsReady(true);
        setIsSuperAppReady(true);
        clearInterval(checkInterval);
      }
    }, 250);

    return () => clearInterval(checkInterval);
  }, []);

  // ... (keeping other state initializations) ...

  // GLOBAL STATE
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [sales, setSales] = useState({ totalRevenue: 124500, ordersToday: 84 });
  const [activeOrders, setActiveOrders] = useState([
    { id: 'TKT-104', table: 12, items: [{ id: 'i1', name: 'Mutton Seekh', qty: 1, status: 'cooking' }], status: 'cooking', createdAt: Date.now() - 300000 },
    { id: 'TKT-105', table: 8, items: [{ id: 'i2', name: 'Dynamite Prawns', qty: 1, status: 'new' }, { id: 'i3', name: 'Dynamite Prawns', qty: 1, status: 'new' }], status: 'new', createdAt: Date.now() - 60000 }
  ]);
  const [pendingPayments, setPendingPayments] = useState([]);

  // INVENTORY STATE
  const [inventoryLedger, setInventoryLedger] = useState({
    'Bourbon': { stock: 10000, unit: 'ml', batches: [{ exp: Date.now() + 1000000, qty: 10000 }] },
    'Simple Syrup': { stock: 5000, unit: 'ml', batches: [{ exp: Date.now() + 500000, qty: 5000 }] },
    'Mutton': { stock: 20, unit: 'kg', batches: [{ exp: Date.now() + 200000, qty: 20 }] },
    'Prawns': { stock: 50, unit: 'portions', batches: [{ exp: Date.now() + 300000, qty: 50 }] }
  });
  const [inventoryMode, setInventoryMode] = useState('automated');
  const [recipes, setRecipes] = useState({
    'Old Fashioned': { 'Bourbon': 60, 'Simple Syrup': 5 },
    'Mutton Seekh': { 'Mutton': 0.2 }, // 200g
    'Dynamite Prawns': { 'Prawns': 1 } // 1 portion
  });

  // NEW STATES FOR NC & CREDIT NOTE
  const [pendingCredits, setPendingCredits] = useState(() => {
    try {
      const saved = localStorage.getItem('pendingCredits');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        { id: 'c1', guest: 'Rahul (Regular)', amount: 4500, timestamp: Date.now() }
      ];
    } catch (e) {
      console.error("Failed to parse pendingCredits from localStorage:", e);
      return [
        { id: 'c1', guest: 'Rahul (Regular)', amount: 4500, timestamp: Date.now() }
      ];
    }
  });
  const [ncOrders, setNcOrders] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('manager');
  console.log("App state initialized up to line 80");

  useEffect(() => {
    try {
      localStorage.setItem('pendingCredits', JSON.stringify(pendingCredits));
    } catch (e) {
      console.error("Failed to save pendingCredits to localStorage:", e);
    }
  }, [pendingCredits]);

  // CUSTOMER STATE
  const [custScreen, setCustScreen] = useState('welcome');
  const [custPhone, setCustPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [custCart, setCustCart] = useState([]);
  const [customTabs, setCustomTabs] = useState(['NC']); // Demo custom tab
  const [animatingItem, setAnimatingItem] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]); // Credit notes for pay later
  const [custSubmittedTickets, setCustSubmittedTickets] = useState([]);
  const [custSelectedPayment, setCustSelectedPayment] = useState('');
  const [custTipAmount, setCustTipAmount] = useState(0); // TIPPING INTEGRATION
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [lastTableInteraction, setLastTableInteraction] = useState(Date.now()); // HEARTBEAT
  const [serviceRequests, setServiceRequests] = useState([]); // SERVICE REQUESTS
  const [activeBills, setActiveBills] = useState([]); // Unlocked bills for tables
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false); // INVENTORY MODAL
  const [toastMessage, setToastMessage] = useState(''); // GLOBAL TOAST
  const [unavailableItems, setUnavailableItems] = useState([]); // Array of OUT OF STOCK item names

  useEffect(() => {
    const handleVarianceAlert = (e) => {
      const { item, variancePct } = e.detail;
      setServiceRequests(prev => [...prev, { 
        table: 'System', 
        type: 'Inventory Alert', 
        message: `Variance for ${item} is ${variancePct.toFixed(2)}%! (>5%)` 
      }]);
    };
    window.addEventListener('inventoryVarianceAlert', handleVarianceAlert);
    return () => window.removeEventListener('inventoryVarianceAlert', handleVarianceAlert);
  }, []);

  console.log("Components state:", {
    LUMINA_MENU: !!window.LUMINA_MENU,
    StaffApp: !!window.StaffApp,
    KitchenApp: !!window.KitchenApp,
    BarApp: !!window.BarApp,
    OwnerDashboard: !!window.OwnerDashboard,
    CustomerApp: !!window.CustomerApp,
    WelcomeScreen: !!window.WelcomeScreen,
    SuperApp: !!window.SuperApp
  });

  if (!componentsReady) {
    console.log("Missing components:", missingComponents);
    return (
      <div style={{ color: 'var(--text-main)', padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Application...</h2>
        <p>Waiting for: {missingComponents.join(', ')}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand"><i className="fa-solid fa-leaf"></i> Appetite OS</div>
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'super_app' ? 'active' : ''}`} onClick={() => setViewMode('super_app')} style={{ background: viewMode === 'super_app' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: viewMode === 'super_app' ? 'var(--primary)' : 'var(--text-muted)' }}>
            <i className="fa-solid fa-compass"></i> Super App
          </button>
          <button className={`toggle-btn ${viewMode === 'customer' ? 'active' : ''}`} onClick={() => setViewMode('customer')}>
            <i className="fa-solid fa-mobile-screen"></i> Customer App
          </button>
          <button className={`toggle-btn ${viewMode === 'staff' ? 'active' : ''}`} onClick={() => setViewMode('staff')}>
            <i className="fa-solid fa-tablet-screen-button"></i> Staff UI
          </button>
          <button className={`toggle-btn ${viewMode === 'kitchen' ? 'active' : ''}`} onClick={() => setViewMode('kitchen')}>
            <i className="fa-solid fa-fire-burner"></i> Kitchen (KDS)
          </button>
          <button className={`toggle-btn ${viewMode === 'bar' ? 'active' : ''}`} onClick={() => setViewMode('bar')}>
            <i className="fa-solid fa-martini-glass"></i> Bar (BDS)
          </button>

          <button className={`toggle-btn ${viewMode === 'owner' ? 'active' : ''}`} onClick={() => setViewMode('owner')}>
            <i className="fa-solid fa-laptop"></i> Owner Dash
          </button>
        </div>
      </header>

      <main className="main-content">
        <div style={{ display: viewMode === 'super_app' ? 'flex' : 'none', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          {isSuperAppReady && window.SuperApp ? (
            <SuperAppComponent setViewMode={setViewMode} activeOrders={activeOrders} setActiveOrders={setActiveOrders} setServiceRequests={setServiceRequests} customers={customers} submittedTickets={custSubmittedTickets} setSubmittedTickets={setCustSubmittedTickets} activeBills={activeBills} ncOrders={ncOrders} />
          ) : (
            <div style={{ color: 'var(--text-main)', padding: '2rem', textAlign: 'center' }}>Loading Super App...</div>
          )}
        </div>

        <div style={{ display: viewMode === 'customer' ? 'flex' : 'none', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <CustomerAppComponent
            globalCustomers={customers} setGlobalCustomers={setCustomers} setGlobalOrders={setActiveOrders} globalOrders={activeOrders}
            setAnimatingItem={setAnimatingItem}
            setToastMessage={setToastMessage}
            toastMessage={toastMessage}
            setPendingPayments={setPendingPayments} pendingPayments={pendingPayments}
            currentScreen={custScreen} setCurrentScreen={setCustScreen}
            phoneInput={custPhone} setPhoneInput={setCustPhone}
            nameInput={custName} setNameInput={setCustName}
            cart={custCart} setCart={setCustCart}
            submittedTickets={custSubmittedTickets} setSubmittedTickets={setCustSubmittedTickets}
            selectedPayment={custSelectedPayment} setSelectedPayment={setCustSelectedPayment}
            custTipAmount={custTipAmount} setCustTipAmount={setCustTipAmount} isCustomTip={isCustomTip} setIsCustomTip={setIsCustomTip}
            setLastTableInteraction={setLastTableInteraction} // Ping heartbeat
            setServiceRequests={setServiceRequests}
            setCustomTabs={setCustomTabs}
            activeBills={activeBills} setActiveBills={setActiveBills}
            setGlobalSales={setSales}
            unavailableItems={unavailableItems}
            inventoryLedger={inventoryLedger} setInventoryLedger={setInventoryLedger}
            inventoryMode={inventoryMode} recipes={recipes}
          />
        </div>

        <div style={{ display: viewMode === 'staff' ? 'flex' : 'none', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <div className="tablet-simulator">
            <div className="tablet-screen">
              <StaffAppComponent
                activeOrders={activeOrders} setActiveOrders={setActiveOrders}
                setAnimatingItem={setAnimatingItem}
                setToastMessage={setToastMessage}
                pendingPayments={pendingPayments} setPendingPayments={setPendingPayments}
                setGlobalSales={setSales} setGlobalCustomers={setCustomers}
                lastTableInteraction={lastTableInteraction} // For Staff warning pulse
                serviceRequests={serviceRequests}
                setServiceRequests={setServiceRequests}
                activeBills={activeBills} setActiveBills={setActiveBills}
                customTabs={customTabs} setCustomTabs={setCustomTabs}
                unavailableItems={unavailableItems} setUnavailableItems={setUnavailableItems}
                creditNotes={creditNotes} setCreditNotes={setCreditNotes}
                ncOrders={ncOrders} setNcOrders={setNcOrders}
                pendingCredits={pendingCredits} setPendingCredits={setPendingCredits}
                currentUserRole={currentUserRole} setCurrentUserRole={setCurrentUserRole}
                isInventoryModalOpen={isInventoryModalOpen} setIsInventoryModalOpen={setIsInventoryModalOpen}
                inventoryLedger={inventoryLedger} setInventoryLedger={setInventoryLedger}
                dismissedHeaderAlerts={dismissedHeaderAlerts} setDismissedHeaderAlerts={setDismissedHeaderAlerts}
              />
            </div>
          </div>
        </div>

        <div style={{ display: viewMode === 'kitchen' ? 'block' : 'none', width: '100%' }}>
          <KitchenAppComponent activeOrders={activeOrders} setActiveOrders={setActiveOrders} unavailableItems={unavailableItems} setUnavailableItems={setUnavailableItems} />
        </div>

        <div style={{ display: viewMode === 'bar' ? 'block' : 'none', width: '100%' }}>
          <BarAppComponent
            activeOrders={activeOrders} setActiveOrders={setActiveOrders}
            pendingPayments={pendingPayments} setPendingPayments={setPendingPayments}
            setGlobalSales={setSales} setGlobalCustomers={setCustomers}
            lastTableInteraction={lastTableInteraction}
            serviceRequests={serviceRequests} setServiceRequests={setServiceRequests}
            activeBills={activeBills} setActiveBills={setActiveBills}
            customTabs={customTabs} setCustomTabs={setCustomTabs}
            unavailableItems={unavailableItems} setUnavailableItems={setUnavailableItems}
          />
        </div>



        <div style={{ display: viewMode === 'owner' ? 'flex' : 'none', height: '100%', width: '100%' }}>
          <OwnerDashboardComponent customers={customers} sales={sales} ncOrders={ncOrders} creditNotes={creditNotes} setCreditNotes={setCreditNotes} setGlobalSales={setSales} inventoryLedger={inventoryLedger} />
        </div>

      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
