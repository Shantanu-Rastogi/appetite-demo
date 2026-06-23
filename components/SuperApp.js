const { useState, useEffect, useMemo } = React;

function SuperApp({ setViewMode, activeOrders, setActiveOrders, setServiceRequests, customers, submittedTickets, setSubmittedTickets, activeBills, ncOrders }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [isWaitingForBill, setIsWaitingForBill] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [hasDeclinedTip, setHasDeclinedTip] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('app');
  const [venueSubTab, setVenueSubTab] = useState('menu'); // 'menu' | 'vibes'
  const [selectedDay, setSelectedDay] = useState('Fri');
  const [walletBalance, setWalletBalance] = useState(2500);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false); // New state for onboarding quiz
  const [quizStep, setQuizStep] = useState(1); // Step tracker for multi-step quiz
  const [toast, setToast] = useState(null); // Toast notification state

  // OTP Login State (Bypass constraint per user demand)
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loginStep, setLoginStep] = useState('phone'); // 'phone' | 'otp'
  const [isCuisineMenuOpen, setIsCuisineMenuOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [eggityOnly, setEggityOnly] = useState(false); // New eggitarian state
  const [animateIsland, setAnimateIsland] = useState(false);
  const [sharedViewers, setSharedViewers] = useState([
    { initials: 'S', name: 'Shantanu (me)', color: '#3b82f6' }
  ]);

  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/users')
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          const now = Date.now();
          const activeUsers = data.filter(u => now - u.lastSeen < 10000); // 10 seconds timeout
          setSharedViewers(activeUsers);
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
          // Fallback to default users if empty
          setSharedViewers(prev => prev.length > 0 ? prev : [
            { initials: 'S', name: 'Shantanu (me)', color: '#3b82f6' },
            { initials: 'R', name: 'Rahul', color: '#10b981' }
          ]);
        });
    };
    
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const [showUserListModal, setShowUserListModal] = useState(false);
  
  // Feature-Heavy Drawer States
  const [drawerSubView, setDrawerSubView] = useState('main'); // 'main' | 'preferences' | 'orders' | 'profile' | 'habits'
  const [userPrefs, setUserPrefs] = useState(['Veg Only', 'Spicy']);
  const [musicPrefs, setMusicPrefs] = useState(['Jazz', 'Pop']);
  const [habitPrefs, setHabitPrefs] = useState(['Coffee Addict', 'Fitness Freak']);
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('Rahul');
  const [lastName, setLastName] = useState('S.');
  const [userPhone, setUserPhone] = useState('9876543210');
  const [pastOrders, setPastOrders] = useState([
    { id: 101, rest: 'Lumina', total: 1250, date: 'Yesterday', items: ['Sushi Platter', 'Sake', 'Miso Soup'] },
    { id: 102, rest: 'Breeze Cafe', total: 450, date: '2 days ago', items: ['Cold Brew', 'Croissant'] }
  ]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  useEffect(() => {
    if (activeBills && activeBills.includes(7)) {
      setIsWaitingForBill(false);
    }
  }, [activeBills]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'table7_users') {
        setSharedViewers(e.newValue ? JSON.parse(e.newValue) : []);
      }

    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);



  // In-App Menu & Checkout States
  const [cartItems, setCartItems] = useState([]); // [{id, name, price, qty}]

  const applyOffers = (items) => {
    let result = [...items];
    const barCategories = ['Beer', 'Cocktails'];
    
    // BOGO: 1+1 and 1+2 logic (Zero out price for free units)
    result = result.map(item => {
      if (barCategories.includes(item.category)) {
        let freeQty = 0;
        let paidQty = item.qty;
        
        // Assuming offerType is available or derived
        const offerType = item.name.includes('BOGO') ? '1+1' : (item.name.includes('1+2') ? '1+2' : null);
        
        if (offerType === '1+1' && item.qty >= 2) {
          freeQty = Math.floor(item.qty / 2);
          paidQty = item.qty - freeQty;
        } else if (offerType === '1+2' && item.qty >= 3) {
          freeQty = Math.floor(item.qty / 3) * 2;
          paidQty = item.qty - freeQty;
        }
        
        const originalPrice = item.originalPrice || item.price;
        return { ...item, originalPrice, price: (originalPrice * paidQty) / item.qty };
      }
      return item;
    });
    
    // Thresholds: If Cart Total > 2000, inject Complimentary Starter per user request
    const subtotal = result.reduce((acc, c) => acc + (c.price * c.qty), 0);
    if (subtotal > 2000) {
      if (!result.some(u => u.name === 'Complimentary Starter')) {
        result.push({ id: 'comp-starter', name: 'Complimentary Starter', price: 0, qty: 1, category: 'Starters' });
      }
    }
    
    // Unlimited
    const hasUnlimitedBeer = result.some(u => u.name === 'Unlimited Beer' || u.name === 'Unlimited Beer for ₹1500');
    if (hasUnlimitedBeer) {
      result = result.map(item => {
        if (item.category === 'Beer' && item.name !== 'Unlimited Beer' && item.name !== 'Unlimited Beer for ₹1500') {
          return { ...item, price: 0 };
        }
        return item;
      });
    }
    
    return result;
  };
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // Click to view sample menu
  const [activeMenuCategory, setActiveMenuCategory] = useState('');
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(4500); // For Lumina Fine Dine
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');




  const handleScanMenu = () => {
      if (isScanning) return; // Prevent double clicks if already scanning
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setScanSuccess(true);
        
        const name = isLoggedIn ? (loginPhone === '9876543210' ? 'Rahul S.' : `Guest ${loginPhone.slice(-4)}`) : 'Guest User';
        const initials = isLoggedIn ? (loginPhone === '9876543210' ? 'RS' : `G${loginPhone.slice(-1)}`) : 'GU';
        const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const newUser = { initials, name, color };
        
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        })
        .then(res => res.json())
        .then(data => setSharedViewers(data))
        .catch(err => console.error("Failed to update user on scan:", err));
        
        const matchedCust = customers ? customers.find(c => c.phone === userPhone) : null;
      if (matchedCust && matchedCust.tags.includes('VIP') && setServiceRequests) {
         setServiceRequests(prev => [...prev, { table: 7, type: 'VIP Arrival ✨', note: `Offer complimentary starter to ${matchedCust.name} based on history (Prawn Lover)!` }]);
      }

      setTimeout(() => {
        setScanSuccess(false);
        setCartItems([]); // Clear cart for new session
        setIsRedeemingPoints(false);
        setShowCheckout(false);
        if (setServiceRequests) {
          setServiceRequests(prev => [...prev, { table: 7, type: 'vip_alert', message: 'VIP Rahul S. scanned Table 7 QR!' }]);
        }
        setActiveTab('menu'); // Transitions to Table Ordering INSIDE SuperApp!
      }, 1500);
    }, 2000);
  };

  const handleStaffCall = (reason) => {
    if (setServiceRequests) {
      const reasonLabels = {
        water: 'Water',
        order_direct: 'Place order directly',
        checkout: 'Request Checkout',
        other: 'Any other request'
      };
      setServiceRequests(prev => [...prev, { table: 7, type: 'Staff Call', note: reasonLabels[reason] || reason }]);
      setToast(`Request sent for: ${reasonLabels[reason] || reason} 🚀`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const mockRestaurants = [
    { id: 1, name: 'Lumina - Fine Dine', type: 'Fine Dining', location: 'Kalyani Nagar', distance: '0.8 km', offer: '20% Off + 10% Cashback', tags: ['Fine Dining', 'Romantic'], image: '🍽️', points: 4500, menu: [
      { category: 'Starters', name: 'Truffle Mushroom Risotto', price: 1200, desc: 'Creamy arborio rice with black truffle.' },
      { category: 'Starters', name: 'Edamame with Sea Salt', price: 500, desc: 'Steamed soybeans with Himalayan pink salt.' },
      { category: 'Starters', name: 'Burrata & Tomato', price: 900, desc: 'Burrata cheese, heirloom tomatoes, pesto.' },
      { category: 'Mains', name: 'Pan Seared Salmon', price: 1500, desc: 'Fresh Atlantic salmon with asparagus.' },
      { category: 'Mains', name: 'New York Striploin', price: 2800, desc: 'Prime aged beef with truffle mash.' },
      { category: 'Mains', name: 'Wild Mushroom Tagliatelle', price: 1300, desc: 'Fresh pasta with wild mushrooms.' },
      { category: 'Desserts', name: 'Chocolate Fondant', price: 800, desc: 'Hot lava cake with vanilla gelato.' },
      { category: 'Desserts', name: 'Matcha Tiramisu', price: 900, desc: 'Classic tiramisu with a matcha twist.' },
      { category: 'Desserts', name: 'New York Cheesecake', price: 750, desc: 'Creamy cheesecake with berry compote.' },
      { category: 'Beverages', name: 'Red Wine Glass', price: 1000, desc: 'Classic Bordeaux.' },
      { category: 'Beverages', name: 'Signature Martini', price: 1200, desc: 'Gin, vermouth, twist of lemon.' },
      { category: 'Beverages', name: 'Sparkling Mineral Water', price: 300, desc: 'Chilled bubbly water.' }
    ] },
    { id: 2, name: 'Breeze Cafe', type: 'Café', location: 'Koregaon Park', distance: '1.2 km', offer: 'Free Dessert over ₹500', tags: ['Cafe', 'Casual'], image: '☕', points: 1200, menu: [
      { category: 'Breakfast', name: 'Avocado Toast', price: 450, desc: 'Sourdough with poached egg & feta.' },
      { category: 'Breakfast', name: 'Eggs Benedict', price: 550, desc: 'Poached eggs, hollandaise, english muffin.' },
      { category: 'Breakfast', name: 'Pancakes Stack', price: 400, desc: 'Maple syrup, berries, whipped butter.' },
      { category: 'Coffee', name: 'Affogato', price: 350, desc: 'Espresso over vanilla gelato.' },
      { category: 'Coffee', name: 'Cold Brew Tonic', price: 400, desc: 'Smooth cold brew with tonic water.' },
      { category: 'Coffee', name: 'Spanish Latte', price: 380, desc: 'Espresso with condensed milk.' },
      { category: 'Snacks', name: 'Cheesy Garlic Bread', price: 250, desc: 'Garlic bread with herb butter.' },
      { category: 'Snacks', name: 'Truffle Fries', price: 450, desc: 'Crispy fries with truffle mayo.' },
      { category: 'Snacks', name: 'Chicken Sliders', price: 600, desc: 'Mini burgers with spicy sauce.' },
      { category: 'Desserts', name: 'Macarons Set', price: 400, desc: 'Box of 4 french macarons.' },
      { category: 'Desserts', name: 'Tiramisu Slice', price: 450, desc: 'Layers of espresso and mascarpone.' }
    ] },
    { id: 3, name: 'The Rusty Nail', type: 'Pub', location: 'Viman Nagar', distance: '2.5 km', offer: 'Happy Hours Live', tags: ['Pub', 'Nightlife'], image: '🍺', points: 0, menu: [
      { category: 'Finger Foods', name: 'Loaded Nachos', price: 600, desc: 'Cheese, jalapeños, olives & sour cream.' },
      { category: 'Finger Foods', name: 'Spicy Buffalo Wings', price: 700, desc: 'Tossed in hot pepper sauce.' },
      { category: 'Finger Foods', name: 'Calamari Rings', price: 800, desc: 'Crispy fried with tartar sauce.' },
      { category: 'Mains', name: 'Classic Beef Burger', price: 750, desc: 'Angus beef, cheddar, brioche.' },
      { category: 'Mains', name: 'Fish & Chips', price: 850, desc: 'Battered cod with mushy peas.' },
      { category: 'Mains', name: 'BBQ Pork Ribs', price: 1200, desc: 'Slow cooked in house BBQ sauce.' },
      { category: 'Beer', name: 'Craft Beer Pitcher', price: 1200, desc: 'Local brewery special.' },
      { category: 'Beer', name: 'Belgian Witbier', price: 500, desc: 'Pint of unfiltered wheat beer.' },
      { category: 'Cocktails', name: 'Old Fashioned', price: 900, desc: 'Bourbon, bitters, orange peel.' },
      { category: 'Cocktails', name: 'Espresso Martini', price: 1000, desc: 'Vodka, coffee liqueur, espresso.' }
    ] },
    { id: 4, name: 'Pizza Piazza', type: 'DineIn', location: 'Kalyani Nagar', distance: '1.5 km', offer: 'Flat ₹200 off', tags: ['Italian', 'Pizza'], image: '🍕', points: 500, menu: [
      { category: 'Pizzas', name: 'Burrata Marinara', price: 800, desc: 'Wood-fired sourdough with fresh burrata.' },
      { category: 'Pizzas', name: 'Truffle Funghi Pizza', price: 950, desc: 'Wild mushrooms, truffle oil, mozzarella.' },
      { category: 'Pizzas', name: 'Diavola Spicy', price: 900, desc: 'Spicy salami, chili flakes, tomato.' },
      { category: 'Pastas', name: 'Fettuccine Alfredo', price: 700, desc: 'Creamy parmesan butter sauce.' },
      { category: 'Pastas', name: 'Spaghetti Carbonara', price: 750, desc: 'Pancetta, egg yolk, pecorino.' },
      { category: 'Pastas', name: 'Pesto Gnocchi', price: 800, desc: 'Basil pesto, potato gnocchi.' },
      { category: 'Desserts', name: 'Classic Tiramisu', price: 500, desc: 'Savoiardi cookies, espresso, mascarpone.' },
      { category: 'Desserts', name: 'Panna Cotta', price: 450, desc: 'Vanilla bean with berry coulis.' },
      { category: 'Beverages', name: 'Fresh Lime Soda', price: 150, desc: 'Sweet and salty.' },
      { category: 'Beverages', name: 'Aperol Spritz', price: 900, desc: 'Prosecco, aperol, soda.' }
    ] },
    { id: 5, name: 'Go Green Salad', type: 'Café', location: 'Koregaon Park', distance: '0.5 km', offer: 'Organic & Healthy', tags: ['Vegan', 'Salads'], image: '🥗', points: 0, menu: [
      { category: 'Salads', name: 'Quinoa Buddha Bowl', price: 550, desc: 'Greens, chickpeas, tahini dressing.' },
      { category: 'Salads', name: 'Kale Caesar Salad', price: 450, desc: 'Crispy chickpeas, vegan dressing.' },
      { category: 'Salads', name: 'Mediterranean Falafel Bowl', price: 600, desc: 'Falafel, hummus, olives, pita.' },
      { category: 'Salads', name: 'Thai Peanut Noodle Bowl', price: 550, desc: 'Rice noodles, veggies, peanut sauce.' },
      { category: 'Smoothies', name: 'Green Monster Smoothie', price: 350, desc: 'Kale, spinach, apple, ginger.' },
      { category: 'Smoothies', name: 'Berry Blast Workout', price: 400, desc: 'Mixed berries, whey protein, oat milk.' },
      { category: 'Smoothies', name: 'Tropical Mango Bliss', price: 380, desc: 'Mango, coconut water, chia seeds.' },
      { category: 'Beverages', name: 'Cold Brew Coffee', price: 300, desc: 'Overnight steeped organic coffee.' },
      { category: 'Beverages', name: 'Kombucha Tea', price: 350, desc: 'Live probiotic fermented tea.' }
    ] }
  ];

  const personalOffers = [
    { title: 'Sushi Monster? 🍣', desc: 'Get ₹200 off on your first order at Lumina', code: 'SUSHI200', expiry: 'Expires in 2 hrs' },
    { title: 'Weekday Coffee ☕', desc: 'Buy 1 Get 1 Free at Breeze Cafe', code: 'COFFEELOVE', expiry: 'Mon-Thu only' }
  ];

  return (
    <div className="mobile-simulator" style={{ background: 'var(--bg-dark)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .btn-add:active {
          transform: scale(0.95);
        }
        .btn-add {
          transition: transform 0.1s ease, background 0.2s ease;
        }
        .tab-btn {
          transition: all 0.2s ease;
        }
        .tab-btn:active {
          transform: translateY(2px);
        }
      `}</style>
      
      {/* iPhone 17 Dynamic Island Style with Haptic Pulse */}
      <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', width: animateIsland ? '160px' : '120px', height: animateIsland ? '40px' : '32px', background: '#000', borderRadius: '20px', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px', transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        {animateIsland ? (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.85rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🧑‍🍳</span> Sizzling VIP Hot!
          </div>
        ) : (
          <>
            <div style={{ width: '8px', height: '8px', background: '#222', borderRadius: '50%' }}></div>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
          </>
        )}
      </div>

      {/* Status Bar Elements */}
      <div style={{ position: 'absolute', top: '22px', left: '32px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', zIndex: 110 }}>
        9:41
      </div>
      <div style={{ position: 'absolute', top: '22px', right: '32px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)', zIndex: 110 }}>
        <i className="fa-solid fa-signal"></i>
        <i className="fa-solid fa-wifi"></i>
        <i className="fa-solid fa-battery-full" style={{ fontSize: '0.9rem' }}></i>
      </div>

      {/* Background Dim for Drawer */}
      {isDrawerOpen && (
        <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(4px)' }}></div>
      )}

      {/* Slide-out Drawer Panel */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(40px)', zIndex: 200, transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', display: 'flex', flexDirection: 'column', padding: '1.25rem', borderLeft: '1px solid var(--glass-border)', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {drawerSubView !== 'main' && (
              <button onClick={() => setDrawerSubView('main')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', cursor: 'pointer' }}><i className="fa-solid fa-arrow-left"></i></button>
            )}
            <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.2rem' }}>{drawerSubView === 'preferences' ? 'Taste Preferences' : drawerSubView === 'orders' ? 'Order History' : drawerSubView === 'profile_edit' ? 'Edit Profile' : drawerSubView === 'habits_edit' ? 'Music & Habits' : 'My Profile'}</h3>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {drawerSubView === 'main' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* User Card */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
              <i className="fa-solid fa-circle-user" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
              <div>
                <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Rahul S.</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+91 9876543210</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <button onClick={() => setDrawerSubView('rewards')} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--glass-border)', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fa-solid fa-gift" style={{ color: 'var(--primary)' }}></i>
                  <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Manage Rewards</span>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
              </button>

              <button onClick={() => setDrawerSubView('orders')} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--glass-border)', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
                  <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Order History</span>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
              </button>

              <button onClick={() => setDrawerSubView('profile_edit')} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--glass-border)', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)' }}></i>
                  <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Edit Profile</span>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
              </button>

              {/* Music & Habits link removed per user request */}

              {/* Point Totals inside links */}
              <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h5 style={{ color: 'var(--text-main)', margin: 0 }}>Points Balances</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lumina Fine Dine</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>4500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Breeze Cafe</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>1200</span>
                </div>
              </div>

              {/* Refer & Earn Banner */}
              <div style={{ marginTop: 'auto', padding: '1rem', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '3rem', opacity: 0.2 }}><i className="fa-solid fa-gift"></i></div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Invite Friends</h4>
                <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.8rem', opacity: 0.9 }}>Get ₹500 Cashback!</p>
                <button style={{ background: '#fff', color: '#059669', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>APPETITE500</button>
              </div>
            </div>
          </div>
        )}

        {drawerSubView === 'rewards' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Manage your platform loyalty and reward balances!</p>
            
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Total Available Points</h4>
              <h2 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>5,700 <span style={{ fontSize: '1rem' }}>pts</span></h2>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Value: approx ₹570. Expiry: 31st Dec 2026.</span>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h5 style={{ color: 'var(--text-main)', margin: 0 }}>Points Expiry Details</h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Lumina Fine Dine (expires in 3 months)</span>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>2000 pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Breeze Cafe (no expiry)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>1200 pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pizza Piazza (expires 2026)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>500 pts</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h5 style={{ color: 'var(--text-main)', margin: 0 }}>Transfer Points to a Friend</h5>
              <input type="tel" placeholder="Friend's Mobile Number" style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1px solid var(--glass-border)', outline: 'none', background: 'var(--bg-darker)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
              <input type="number" placeholder="Number of Points to Transfer" style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1px solid var(--glass-border)', outline: 'none', background: 'var(--bg-darker)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
              <button onClick={() => { setPointsBalance(prev => prev - 1000); setToast('Transferred 1000 pts to Friend! 🎁'); setTimeout(() => setToast(null), 3000); }} style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Transfer Now</button>
            </div>
          </div>
        )}

        {drawerSubView === 'orders' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Your recent dining transactions across the platform.</p>
            
            {/* Search Input for Receipts */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.65rem 1rem', borderRadius: '12px', gap: '0.5rem', background: 'var(--bg-darker)', marginBottom: '1rem' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
              <input type="text" placeholder="Search dish or restaurant..." value={orderSearchQuery} onChange={e => setOrderSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)', fontSize: '0.9rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pastOrders.filter(o => 
                o.rest.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                (o.items && o.items.some(item => item.toLowerCase().includes(orderSearchQuery.toLowerCase())))
              ).map(o => (
                <div key={o.id} className="glass-panel" style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 'bold' }}>{o.rest}</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{o.date}</span>
                    </div>
                    <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{o.total}</span>
                  </div>
                  {o.items && (
                    <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Items:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {o.items.map((item, idx) => (
                          <div key={idx} style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {item}
                            <button onClick={() => { setToast(`Re-ordering ${item} 🔄`); setTimeout(() => setToast(null), 3000); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem' }}><i className="fa-solid fa-rotate"></i></button>
                            <button onClick={() => { setToast(`Favorited ${item} ❤️`); setTimeout(() => setToast(null), 3000); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ec4899', fontSize: '0.75rem' }}><i className="fa-regular fa-heart"></i></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {drawerSubView === 'profile_edit' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Edit your profile details for personalization!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>First Name (Required)</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-darker)', border: firstName ? '1px solid var(--glass-border)' : '1px solid #ef4444', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-darker)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Email Address (Optional)</label>
                <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="name@example.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-darker)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {/* Music & Habits screen removed per user request */}

        <button onClick={() => { setIsDrawerOpen(false); setDrawerSubView('main'); }} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '12px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>Log Out</button>

      </div>

      {isScanning && (
        <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '220px', height: '220px', border: '3px solid #10b981', borderRadius: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'scan 2s linear infinite' }}></div>
          </div>
          <h4 style={{ color: '#fff', marginTop: '2rem' }}>Scanning Menu...</h4>
          <button onClick={() => setIsScanning(false)} style={{ marginTop: '2rem', background: 'transparent', color: '#fff', textDecoration: 'underline', border: 'none' }}>Cancel</button>
          
          <style>{`
            @keyframes scan {
              0% { top: 0%; }
              100% { top: 100%; }
            }
          `}</style>
        </div>
      )}

      {scanSuccess && (
        <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1.5rem' }}></i>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Allocated to Table 7!</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Loading restaurant menu...</p>
        </div>
      )}

      <div className="sim-header" style={{ height: '90px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 1rem 12px', background: 'var(--bg-dark)', borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
          <i className="fa-solid fa-location-dot"></i> <span>Pune</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {!selectedRestaurant && activeTab !== 'menu' && (
            <button onClick={handleScanMenu} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              <i className="fa-solid fa-qrcode"></i> Scan
            </button>
          )}
          
          {(selectedRestaurant || activeTab === 'menu') && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '0.25rem', minWidth: '50px', cursor: 'pointer' }} onClick={() => setShowUserListModal(true)}>
               {(() => {
                 const currentUser = isLoggedIn ? {
                   initials: loginPhone === '9876543210' ? 'RS' : (loginPhone ? `G${loginPhone.slice(-1)}` : 'ME'),
                   name: loginPhone === '9876543210' ? 'Rahul S. (me)' : `Guest ${loginPhone.slice(-4) || ''} (me)`,
                   color: '#3b82f6'
                 } : null;

                 let displayUsers = [...sharedViewers];
                 if (currentUser) {
                   if (!displayUsers.some(u => u.initials === currentUser.initials)) {
                     displayUsers.unshift(currentUser);
                   }
                 }

                 if (displayUsers.length === 0) {
                   displayUsers = [
                     { initials: 'S', name: 'Shantanu', color: '#3b82f6' },
                     { initials: 'A', name: 'Abhishek', color: '#ec4899' }
                   ];
                 }

                 return displayUsers.map((u, i) => (
                   <div key={i} style={{ width: '24px', height: '24px', borderRadius: '12px', background: u.color || '#9ca3af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', border: '2px solid #fff', marginLeft: i > 0 ? '-8px' : '0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={u.name || 'Anonymous'}>
                     {u.initials || '?'}
                   </div>
                 ));
               })()}
            </div>
          )}

          <button onClick={() => setIsDrawerOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <i className="fa-solid fa-circle-user" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}></i>
          </button>
        </div>

      </div>

        {showUserListModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowUserListModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', width: '85%', maxWidth: '320px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#111', fontWeight: 'bold' }}>Users at Table 7</h3>
                <button onClick={() => setShowUserListModal(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '1.2rem', cursor: 'pointer', transition: 'background 0.2s' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(sharedViewers.length > 0 ? sharedViewers : [
                  { initials: 'S', name: 'Shantanu', color: '#3b82f6' },
                  { initials: 'A', name: 'Abhishek', color: '#ec4899' }
                ]).map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: u.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                      {u.initials}
                    </div>
                    <div style={{ color: '#333', fontWeight: '600', fontSize: '0.95rem' }}>{u.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!showCheckout && !showActiveOrders && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-dark)' }}>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.65rem 1rem', borderRadius: '12px', gap: '0.5rem', background: 'var(--bg-darker)' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
              <input type="text" placeholder="Search dish, cuisine..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)', fontSize: '0.9rem' }} />
            </div>
          </div>
        )}

      {activeTab !== 'menu' && (
        <div style={{ display: 'flex', background: 'var(--bg-dark)', borderBottom: '1px solid var(--glass-border)' }}>
          <button className="tab-btn" onClick={() => setActiveTab('explore')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'explore' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'explore' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>Explore</button>
          <button className="tab-btn" onClick={() => setActiveTab('offers')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'offers' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'offers' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>Plans for You</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {activeTab === 'explore' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 🍔 Food Categories */}
            <div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1rem' }}>Craving Something?</h4>
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {['Burgers', 'Pizza', 'Panasian', 'Desserts', 'Healthy', 'Cafes'].map((cat, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      {cat === 'Burgers' ? '🍔' : cat === 'Pizza' ? '🍕' : cat === 'Panasian' ? '🍜' : cat === 'Desserts' ? '🍩' : cat === 'Healthy' ? '🥗' : '☕'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: '600' }}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 👤 personalized Recommendations */}
            {/* Preference-Based Engine */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), #ffffff)' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1rem' }}>Recommended for You</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {userPrefs.includes('Veg Only') ? 'Top Veg picks for you' : 'Based on your love for Spicy food'}
                  </span>
                </div>
                <button onClick={() => setShowQuiz(true)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Take Quiz
                </button>
              </div>
            </div>

            {/* 📍 Venue Cards */}
            <div>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Restaurants Near You 📍</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {mockRestaurants.map(r => (
                  <div key={r.id} className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '160px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>{r.image}</div>
                      {r.offer && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#ef4444', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{r.offer}</div>
                      )}
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{r.name}</h3>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.type} • {r.location}</p>
                        </div>
                        {r.points > 0 && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {r.points} pts avail.
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button onClick={() => { setSelectedRestaurant(r); setVenueSubTab('vibes'); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <i className="fa-solid fa-play"></i> Vibes
                        </button>
                        <button onClick={() => { setSelectedRestaurant(r); setVenueSubTab('menu'); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <i className="fa-solid fa-utensils"></i> Menu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'offers' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 🎯 Personalize Your Vibe Banner */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowQuiz(true)}>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Personalize Your Vibe ✨</h4>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', margin: '0 0 1rem' }}>Take a quick quiz to customize your recommendations and find the perfect pairing!</p>
              <button style={{ background: '#fff', color: '#8b5cf6', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>Start Quiz</button>
            </div>

            {/* Curated Offers */}
            <div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1rem' }}>Curated Plans for You 🎁</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {personalOffers.map((o, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), #ffffff)' }}>
                    <h5 style={{ color: 'var(--text-main)', margin: 0 }}>{o.title}</h5>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem', fontSize: '0.82rem' }}>{o.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ background: '#fff', border: '1px dashed var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>{o.code}</div>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{o.expiry}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'menu' && !showCheckout && !showActiveOrders && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Lumina Menu 🍽️</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active at table: {sharedViewers.map(u => u.name).join(', ')}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table 7</span>
            </div>

            <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call Staff:</span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { id: 'water', label: 'Water 💧' },
                  { id: 'order_direct', label: 'Order 🍽️' },
                  { id: 'checkout', label: 'Checkout 🧾' },
                  { id: 'other', label: 'Other 💬' }
                ].map(option => (
                  <button 
                    key={option.id} 
                    onClick={() => handleStaffCall(option.id)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--primary)', 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      padding: '2px 0'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
              {['Starters', 'Soups & Salads', 'Asian Mains', 'Continental Mains', 'Pizzas', 'Burgers', 'Indian', 'Desserts', 'Drinks & Cocktails'].map(cat => (
                <div key={cat} id={`cat-${cat.replace(/\s+/g, '')}`} style={{ scrollMarginTop: '10px' }}>
                  <h5 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem', fontSize: '0.95rem', fontWeight: 'bold' }}>{cat}</h5>
                  {window.LUMINA_MENU.filter(item => item.category === cat).map(item => {
                    const cartItem = cartItems.find(c => c.id === item.id);
                    const qty = cartItem ? cartItem.qty : 0;
                    return (
                      <div key={item.id} className="product-card glass-panel" style={{ background: '#fff', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', borderRadius: '16px', padding: '1rem', display: 'flex', gap: '1rem', width: '100%', marginBottom: '0.5rem' }}>
                        <div className="product-img" style={{ fontSize: '2.5rem', background: 'var(--bg-glass)', borderRadius: '12px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.image}</div>
                        <div className="product-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div className="product-title" style={{ fontSize: '1rem', marginBottom: '0.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {item.name}
                          </div>
                          <div className="product-desc" style={{ fontSize: '0.8rem', lineHeight: '1.3', marginBottom: '0.5rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</div>
                          <div className="product-meta" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span className="product-price" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>₹{item.price}</span>
                            {qty > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary)', borderRadius: '20px', overflow: 'hidden' }}>
                                <button onClick={() => setCartItems(cartItems.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>-</button>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                <button onClick={() => setCartItems(cartItems.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>+</button>
                              </div>
                            ) : (
                              <button className="btn-add" onClick={() => setCartItems([...cartItems, { ...item, qty: 1 }])} style={{ width: 'auto', padding: '0.4rem 1rem', height: 'auto', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                <i className="fa-solid fa-plus"></i> ADD
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {cartItems.length > 0 ? (
              <div className="floating-cart-bar fade-in" style={{ bottom: '1.5rem', left: '1.5rem', right: '1.5rem', width: 'auto' }}>
                <button className="cart-btn" onClick={() => setShowCheckout(true)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><i className="fa-solid fa-bag-shopping"></i> View Cart</span>
                  <span className="cart-badge" style={{ background: '#fff', color: 'var(--primary)', borderRadius: '50%', padding: '0.2rem 0.6rem', fontWeight: 'bold' }}>{cartItems.reduce((acc, c) => acc + c.qty, 0)}</span>
                </button>
              </div>
            ) : activeOrders.filter(o => o.table === 7 || o.originalTable === 7).length > 0 ? (
              <div className="floating-cart-bar fade-in" style={{ bottom: '1.5rem', left: '1.5rem', right: '1.5rem', width: 'auto' }}>
                <button className="cart-btn" style={{ width: '100%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowActiveOrders(true)}>
                  <span><i className="fa-solid fa-receipt"></i> View My Orders (Table 7)</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'menu' && showCheckout && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setShowCheckout(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-arrow-left"></i></button>
                <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Review Order</h4>
              </div>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Items</button>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981, #1fb2aa)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}>
              <div>
                <h5 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}><i className="fa-solid fa-trophy"></i> Lumina Club</h5>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', margin: '2px 0 0' }}>Redeem points on final bill.</p>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{pointsBalance} <span style={{ fontSize: '0.7rem' }}>pts</span></div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cartItems.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600' }}>{c.qty}x {c.name}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>₹{c.price * c.qty}</span>
                  </div>
                  {!c.notes ? (
                    <button 
                      onClick={() => setCartItems(cartItems.map(item => item.id === c.id ? { ...item, notes: ' ' } : item))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: '4px 0', fontWeight: '600', alignSelf: 'flex-start' }}
                    >
                      + Add instructions
                    </button>
                  ) : (
                    <div style={{ width: '100%' }}>
                      <input 
                        type="text" 
                        placeholder="Add customization notes (e.g., no mushroom)" 
                        value={c.notes === ' ' ? '' : c.notes} 
                        onChange={(e) => setCartItems(cartItems.map(item => item.id === c.id ? { ...item, notes: e.target.value } : item))}
                        style={{ width: '100%', padding: '0.4rem 0', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--glass-border)', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
                        autoFocus
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setCartItems(cartItems.map(item => item.id === c.id ? { ...item, notes: '' } : item));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <hr style={{ border: 'none', borderBottom: '1px solid var(--glass-border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Subtotal</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>₹{applyOffers(cartItems).reduce((acc, c) => acc + (c.price * c.qty), 0)}</span>
              </div>
            </div>





            <div style={{ display: 'flex', marginTop: 'auto' }}>
              <button onClick={() => {
                if (isRedeemingPoints) {
                  setPointsBalance(pointsBalance - 2500); // Simulated reduction
                }
                const total = applyOffers(cartItems).reduce((acc, c) => acc + (c.price * c.qty), 0) - (isRedeemingPoints ? 250 : 0);
                const newTicket = {
                  id: `TKT-${Math.floor(Date.now() / 1000)}`,
                  table: 7,
                  items: cartItems.map(c => ({ id: c.id, name: c.name, qty: c.qty, status: 'new', notes: c.notes || '' })),
                  status: 'new',
                  createdAt: Date.now()
                };
                setActiveOrders([...activeOrders, newTicket]);
                if (setSubmittedTickets) {
                  setSubmittedTickets([...submittedTickets, newTicket.id]);
                }
                // Removed adding to past orders to simulate open tab workflow
                setCartItems([]);
                setShowCheckout(false);
                setActiveTab('menu'); // Stay on menu to allow adding more items
              }} style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
                Place Order
              </button>
            </div>
          </div>
        )}

        {activeTab === 'menu' && showActiveOrders && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setShowActiveOrders(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-arrow-left"></i></button>
              <h4 style={{ color: 'var(--text-main)', margin: 0 }}>My Table Session</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Table 7</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeBills && activeBills.includes(7) ? (
                <>
                  <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: '#fff', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}><i className="fa-solid fa-receipt"></i> Itemized Bill</h4>
                    {(() => {
                      const t7Orders = activeOrders.filter(o => o.table === 7 || o.originalTable === 7);
                      const t7NcOrders = ncOrders ? ncOrders.filter(o => o.table === 7) : [];
                      const items = [
                        ...t7Orders.flatMap(o => o.items),
                        ...t7NcOrders.map(o => ({ ...o, status: 'nc' }))
                      ];
                      
                      // Group items by name and status
                      const groupedItems = items.reduce((acc, item) => {
                        const key = `${item.name}-${item.status || ''}`;
                        if (acc[key]) {
                          acc[key].qty += item.qty;
                        } else {
                          const menuProduct = window.LUMINA_MENU.find(p => p.name === item.name);
                          const price = item.status === 'nc' ? 0 : (menuProduct ? menuProduct.price : 0);
                          acc[key] = { ...item, price, key };
                        }
                        return acc;
                      }, {});
                      
                      const itemsList = Object.values(groupedItems);
                      const subtotal = itemsList.reduce((sum, item) => sum + (item.price * item.qty), 0);
                      const taxes = Math.floor(subtotal * 0.23);
                      const discount = isRedeemingPoints ? 250 : 0;
                      const finalTotal = subtotal + taxes - discount + (tipAmount || 0);
                      
                      return (
                        <>
                          {itemsList.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--text-main)', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                              <span><span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{item.qty}x</span> {item.name} {item.status === 'nc' && <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginLeft: '0.5rem', fontWeight: 'bold' }}>NC</span>}</span>
                              <span style={{ fontWeight: '600', color: item.status === 'nc' ? '#f59e0b' : 'var(--text-main)' }}>{item.status === 'nc' ? 'NC' : `₹${item.price * item.qty}`}</span>
                            </div>
                          ))}
                          
                          <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            <span>Taxes (23%)</span>
                            <span>₹{taxes}</span>
                          </div>
                          
                          {/* Points Redemption in Checkout */}
                          <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: '12px', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}><i className="fa-solid fa-gift"></i> Lumina Points</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redeem ₹250 discount</div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input type="checkbox" checked={isRedeemingPoints} onChange={e => setIsRedeemingPoints(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                              <span style={{ fontSize: '0.85rem' }}>Redeem</span>
                            </label>
                          </div>
                          
                          {isRedeemingPoints && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              <span>Loyalty Discount</span>
                              <span>-₹250</span>
                            </div>
                          )}
                          
                          {/* Premium Tip UI */}
                          {hasDeclinedTip ? (
                            <div className="fade-in" style={{ marginTop: '1rem', textAlign: 'center' }}>
                              <button onClick={() => setHasDeclinedTip(false)} style={{ background: 'transparent', border: '1px dashed var(--glass-border)', padding: '0.5rem 1.5rem', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <i className="fa-solid fa-plus"></i> Add Tip (Optional)
                              </button>
                            </div>
                          ) : (
                            <div className="fade-in" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', padding: '1rem', borderRadius: '16px', marginTop: '1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <h4 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><i className="fa-solid fa-heart" style={{ color: '#ef4444' }}></i> Support the Team</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>100% of your tip goes directly to the staff.</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                {[
                                  { pct: 10, label: 'Great' },
                                  { pct: 15, label: 'Amazing!' },
                                  { pct: 20, label: 'Heroic!' }
                                ].map(({ pct, label }) => {
                                  const amt = Math.floor(subtotal * (pct / 100));
                                  const isSelected = !isCustomTip && tipAmount === amt;
                                  return (
                                    <button key={pct} onClick={() => { setTipAmount(amt); setIsCustomTip(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.25rem', borderRadius: '12px', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: isSelected ? '#fff' : 'rgba(255,255,255,0.6)', color: isSelected ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                      <span style={{ fontSize: '0.65rem', fontWeight: '600', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '2px' }}>{label}</span>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>₹{amt}</span>
                                    </button>
                                  )
                                })}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                <button onClick={() => { setIsCustomTip(true); setTipAmount(0); }} style={{ flex: 1, background: isCustomTip ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.6)', border: isCustomTip ? '1px solid #3b82f6' : '1px solid var(--glass-border)', color: isCustomTip ? '#3b82f6' : 'var(--text-main)', padding: '0.4rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Custom</button>
                                <button onClick={() => { setTipAmount(0); setIsCustomTip(false); setHasDeclinedTip(true); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', padding: '0.4rem', borderRadius: '12px', cursor: 'pointer' }}>No, thanks</button>
                              </div>
                              {isCustomTip && (
                                <div className="fade-in" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>₹</span>
                                  <input type="number" placeholder="Enter amount" value={tipAmount || ''} onChange={e => setTipAmount(parseInt(e.target.value) || 0)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--primary)', background: '#fff', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                                </div>
                              )}
                            </div>
                          )}

                          {tipAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              <span>Staff Tip</span>
                              <span>+₹{tipAmount}</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                            <span>Total</span>
                            <span>₹{finalTotal}</span>
                          </div>
                          
                          <button onClick={() => {
                            setToast('Payment Successful! Thank you for dining with us. 🎉');
                            setTimeout(() => setToast(null), 3000);
                            setActiveOrders(prev => prev.filter(o => o.table !== 7));
                            setShowActiveOrders(false);
                            setSelectedRestaurant(null);
                            setShowCheckout(false);
                          }} className="btn-primary" disabled={itemsList.length === 0} style={{ padding: '1rem', width: '100%', borderRadius: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: itemsList.length > 0 ? 'var(--primary)' : '#ccc', color: '#fff', border: 'none', cursor: itemsList.length > 0 ? 'pointer' : 'not-allowed', boxShadow: itemsList.length > 0 ? '0 10px 15px -3px rgba(16, 185, 129, 0.4)' : 'none', marginTop: '1rem' }}>
                            <i className="fa-solid fa-credit-card"></i> Pay Now
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  {/* Innovative Points Display */}
                  <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981, #1fb2aa)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                    <div>
                      <h5 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}><i className="fa-solid fa-trophy"></i> Lumina Club</h5>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '2px 0 0' }}>You have rich taste! 2500 pts available.</p>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>2500 <span style={{ fontSize: '0.75rem' }}>pts</span></div>
                  </div>

                  {activeOrders.filter(o => o.table === 7 || o.originalTable === 7).map((order, idx) => (
                    <div key={order.id} className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Order #{idx + 1}</span>
                        <span style={{ fontSize: '0.8rem', color: order.status === 'served' ? 'var(--text-muted)' : 'var(--primary)' }}>
                          {order.status === 'served' ? <><i className="fa-solid fa-check-double"></i> Served</> : order.status.toUpperCase()}
                        </span>
                      </div>
                      {order.items.map((item, idxx) => (
                        <div key={idxx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                          <span><span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{item.qty}x</span> {item.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {isWaitingForBill ? (
                    <button disabled className="btn-primary" style={{ padding: '1rem', width: '100%', borderRadius: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#cbd5e1', color: '#fff', border: 'none', cursor: 'not-allowed' }}>
                      <i className="fa-solid fa-hourglass-half"></i> Waiting for Bill...
                    </button>
                  ) : (
                    <button onClick={() => {
                      if (setServiceRequests) {
                        setServiceRequests(prev => [...prev, { table: 7, type: 'bill_request', time: Date.now() }]);
                      }
                      setIsWaitingForBill(true);
                    }} className="btn-primary" style={{ padding: '1rem', width: '100%', borderRadius: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
                      <i className="fa-solid fa-receipt"></i> Request Bill & Pay
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}



        {activeTab === 'profile' && (
          <div className="fade-in">
            {!isLoggedIn ? (
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', textAlign: 'center' }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Login to Your Account</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Secure OTP login without passwords.</p>

                {/* Convert Guest to Member CTA */}
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
                  <h5 style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.9rem' }}>Are you a Guest?</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0.75rem' }}>Convert to Member to save transaction history!</p>
                  <button onClick={() => {
                    setLoginPhone('9876543210');
                    setPastOrders([...pastOrders, { id: Date.now(), rest: 'Guest Dine-In', total: 750, date: 'Earlier Today', items: ['Thali', 'Butter Milk'] }]);
                    setLoginStep('otp');
                  }} style={{ width: '100%', padding: '0.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    Auto-Fill Guest Data
                  </button>
                </div>

                {loginStep === 'phone' && (
                  <>
                    <input type="tel" placeholder="Mobile Number" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1rem', outline: 'none' }} />
                    <button onClick={() => setLoginStep('otp')} className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: 'bold' }}>Send OTP</button>
                  </>
                )}

                {loginStep === 'otp' && (
                  <>
                    <input type="tel" placeholder="Enter 4-digit OTP" value={loginOtp} onChange={(e) => setLoginOtp(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '4px' }} />
                    <button onClick={() => {
                      setIsLoggedIn(true);
                      const name = loginPhone === '9876543210' ? 'Rahul S. (me)' : `Guest ${loginPhone.slice(-4)} (me)`;
                      const initials = loginPhone === '9876543210' ? 'RS' : `G${loginPhone.slice(-1)}`;
                      // Generate a stable color based on phone number or random
                      const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
                      const color = colors[Math.floor(Math.random() * colors.length)];
                      
                      const newUser = { initials, name, color, lastSeen: Date.now() };
                      
                      fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newUser)
                      })
                      .then(res => res.json())
                      .then(data => setSharedViewers(data))
                      .catch(err => console.error("Failed to update user:", err));
                    }} className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: 'bold' }}>Verify & Login</button>
                    <button onClick={() => setLoginStep('phone')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.85rem' }}>Edit Number</button>
                  </>
                )}
              </div>
            ) : (
              <div className="fade-in">
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <i className="fa-solid fa-circle-user" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                  <div>
                    <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Rahul S.</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>+91 9876543210</span>
                  </div>
                </div>

                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Scoped Point Balances</h4>
                <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Lumina - Fine Dine</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>4500 pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Breeze Cafe</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>1200 pts</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px' }}>
                  <h5 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>Your Preferences</h5>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Veg Only</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Desserts</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Spicy</span>
                  </div>
                </div>

                <button onClick={() => { setIsLoggedIn(false); setLoginStep('phone'); }} className="btn-secondary" style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', borderRadius: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>Logout</button>
              </div>
            )}
          </div>
        )}

        {/* FLOATING CUISINE MENU AND FAB FOR SUPER APP ORDERING */}
        {activeTab === 'menu' && !showCheckout && (
          <>
            <button
              onClick={() => setIsCuisineMenuOpen(true)}
              style={{ position: 'absolute', bottom: cartItems.length > 0 ? '6rem' : '2rem', right: '1.5rem', width: '56px', height: '56px', borderRadius: '28px', background: 'var(--primary)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, cursor: 'pointer', transition: 'bottom 0.3s' }}>
              <i className="fa-solid fa-utensils"></i>
            </button>

            {isCuisineMenuOpen && (
              <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ background: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '1.5rem', paddingBottom: '3rem', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}><i className="fa-solid fa-book-open"></i> Cuisines</h3>
                    <button onClick={() => setIsCuisineMenuOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {['All', 'Starters', 'Soups & Salads', 'Asian Mains', 'Continental Mains', 'Pizzas', 'Burgers', 'Indian', 'Desserts', 'Drinks & Cocktails'].map(cat => (
                      <button key={cat} onClick={() => { 
                        const targetId = cat === 'All' ? 'cat-Starters' : `cat-${cat.replace(/\s+/g, '')}`;
                        const el = document.getElementById(targetId);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        setIsCuisineMenuOpen(false); 
                      }} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: '0.9rem', padding: '1rem 0.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', textAlign: 'center' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected Restaurant Menu Root View (Full Screen Cover) */}
        {selectedRestaurant && (
          <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', zIndex: 150, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
            <div onScroll={(e) => {
              if (e.target.scrollTop > 200 && !animateIsland) {
                setAnimateIsland(true);
                setTimeout(() => setAnimateIsland(false), 2000);
              }
            }} style={{ backgroundColor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', paddingTop: '5rem', paddingBottom: '3rem', overflowY: 'auto', zIndex: 160 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}>{selectedRestaurant.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button onClick={() => setVenueSubTab('menu')} style={{ background: venueSubTab === 'menu' ? 'var(--primary)' : 'transparent', color: venueSubTab === 'menu' ? '#fff' : 'var(--text-muted)', border: venueSubTab === 'menu' ? 'none' : '1px solid var(--glass-border)', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Menu</button>
                    <button onClick={() => setVenueSubTab('vibes')} style={{ background: venueSubTab === 'vibes' ? 'var(--primary)' : 'transparent', color: venueSubTab === 'vibes' ? '#fff' : 'var(--text-muted)', border: venueSubTab === 'vibes' ? 'none' : '1px solid var(--glass-border)', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Vibes</button>
                  </div>
                </div>
                <button onClick={() => { setSelectedRestaurant(null); setActiveMenuCategory(''); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
              </div>

              {/* 📅 Book Table Banner Check */}
              <div style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--primary), #059669)', color: '#fff', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Book Table & Earn 15% Rewards</h4>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Fast confirmations for Rahul S.</span>
                </div>
                <button onClick={() => { if(setServiceRequests) setServiceRequests(prev => [...prev, { table: 7, type: 'Table Booking', note: 'Rahul S. booked for 4 guests!' }]); setToast('Booking confirmed! Staff notified. 📅'); setTimeout(() => setToast(null), 3000); }} style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Book</button>
              </div>

              {venueSubTab === 'menu' && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 'bold' }}>🌱 Veg</span>
                        <button onClick={() => { setVegOnly(!vegOnly); if (!vegOnly) setEggityOnly(false); }} style={{ background: vegOnly ? 'var(--primary)' : 'rgba(0,0,0,0.1)', border: 'none', width: '32px', height: '16px', borderRadius: '8px', position: 'relative', cursor: 'pointer', outline: 'none' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '6px', background: '#fff', position: 'absolute', top: '2px', left: vegOnly ? '18px' : '2px', transition: 'all 0.2s' }}></div>
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 'bold' }}>🥚 Egg</span>
                        <button onClick={() => { setEggityOnly(!eggityOnly); if (!eggityOnly) setVegOnly(false); }} style={{ background: eggityOnly ? '#f59e0b' : 'rgba(0,0,0,0.1)', border: 'none', width: '32px', height: '16px', borderRadius: '8px', position: 'relative', cursor: 'pointer', outline: 'none' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '6px', background: '#fff', position: 'absolute', top: '2px', left: eggityOnly ? '18px' : '2px', transition: 'all 0.2s' }}></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unified menu list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {['Table Shared Plates', ...Array.from(new Set(selectedRestaurant.menu.map(item => item.category)))].map(cat => (
                      <div key={cat} id={`cat-${cat.replace(/\s+/g, '')}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0, padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: '0px', zIndex: 10, borderBottom: '2px solid var(--primary)', width: '100%', boxSizing: 'border-box', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>{cat}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1rem' }}>
                          {cat === 'Table Shared Plates' ? (
                            <>
                              <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Loaded Table Nachos 🧀</h4>
                                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹350 / Table</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Giant platter of nachos, cheese sauce, pico de gallo. Cost split automatically.</p>
                              </div>
                            </>
                          ) : selectedRestaurant.menu.filter(item => item.category === cat).map((item, idx) => {
                            const isNonVeg = ['Salmon', 'Striploin', 'Chicken', 'Ham', 'Bacon', 'Pork', 'Lamb', 'Beef', 'Sushi'].some(k => item.name.includes(k));
                            const isEgg = item.name.toLowerCase().includes('egg');
                            const isVIP = ['Wild Mushroom Tagliatelle', 'New York Striploin', 'Truffle Mushroom Risotto'].includes(item.name);
                            
                            let opacity = 1;
                            let blur = 'none';
                            
                            if (vegOnly && (isNonVeg || isEgg)) { opacity = 0.2; blur = 'blur(1px)'; }
                            else if (eggityOnly && isNonVeg) { opacity = 0.2; blur = 'blur(1px)'; }
                            
                            return (
                              <div key={idx} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#fff', opacity: opacity, filter: blur, transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <h4 style={{ color: 'var(--text-main)', margin: 0 }}>{item.name} {isVIP && <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 4px', borderRadius: '4px' }}><i className="fa-solid fa-star"></i> VIP</span>}</h4>
                                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.price}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {venueSubTab === 'vibes' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Event Banners */}
                  <div>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Weekly Events</h4>
                    
                    {(() => {
                      const dayEvents = {
                        'Mon': { label: 'Acoustic Mondays', icon: '🎸', desc: 'Live acoustic sets', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
                        'Tue': { label: 'Taco & Tequila', icon: '🌮', desc: 'Specials on tacos', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
                        'Wed': { label: 'Wine Wednesday', icon: '🍷', desc: 'Half off bottles', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
                        'Thu': { label: 'Jazz & Grill', icon: '🎷', desc: 'Smooth jazz live', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
                        'Fri': { label: 'Friday Retro Night', icon: '🕺', desc: 'Hits from 80s & 90s', bg: 'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)' },
                        'Sat': { label: 'Saturday Bollywood', icon: '🎬', desc: 'Dance to latest hits', bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
                        'Sun': { label: 'Sunday Brunch Live', icon: '🥞', desc: 'Easy listening music', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }
                      };
                      
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      const todayIdx = 2; // Wednesday (Simulated)
                      
                      const events = days.map((day, idx) => {
                        const evData = dayEvents[day];
                        return { day, ...evData, isToday: idx === todayIdx, isTomorrow: idx === todayIdx + 1, isPassed: idx < todayIdx };
                      }).filter(ev => !ev.isPassed);
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <h5 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Happening This Week</h5>
                          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                            {events.map(ev => (
                              <div key={ev.day} className="glass-panel" style={{ 
                                padding: '1.5rem', 
                                borderRadius: '20px', 
                                background: ev.bg, 
                                minWidth: '220px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.75rem',
                                color: '#fff',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                              >
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.15 }}>{ev.icon}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                    {ev.isToday ? 'Today' : (ev.isTomorrow ? 'Tomorrow' : ev.day)}
                                  </span>
                                  <span style={{ fontSize: '1.5rem' }}>{ev.icon}</span>
                                </div>
                                <div style={{ marginTop: 'auto' }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{ev.label}</div>
                                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>{ev.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Collage Grid */}
                  <div>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1rem' }}>Organic Vibes & Reels</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      {[1,2,3,4,5,6].map((i) => (
                        <div key={i} style={{ height: '120px', borderRadius: '12px', background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(https://picsum.photos/200/300?random=${i}) center/cover`, position: 'relative' }}>
                          {i % 2 === 0 && <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.8rem', color: '#fff' }}><i className="fa-solid fa-video"></i></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
        {showQuiz && (
          <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(40px)', zIndex: 300, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Personalize Your Vibe</h3>
              <button onClick={() => { setShowQuiz(false); setQuizStep(1); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', marginBottom: '2rem' }}>
              <div style={{ width: `${(quizStep / 3) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.3s ease' }}></div>
            </div>

            {quizStep === 1 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>What's your music vibe? 🎵</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {['Jazz', 'Pop', 'Hip-Hop', 'Indie', 'Rock'].map(v => {
                    const active = musicPrefs.includes(v);
                    return (
                      <button key={v} onClick={() => setMusicPrefs(active ? musicPrefs.filter(p => p !== v) : [...musicPrefs, v])} style={{ fontSize: '0.9rem', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: active ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', width: 'calc(50% - 0.375rem)' }}>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {quizStep === 2 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Describe your habits 🏃‍♂️</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {['Early Bird', 'Night Owl', 'Foodie', 'Fitness Freak', 'Coffee Addict'].map(v => {
                    const active = habitPrefs.includes(v);
                    return (
                      <button key={v} onClick={() => setHabitPrefs(active ? habitPrefs.filter(p => p !== v) : [...habitPrefs, v])} style={{ fontSize: '0.9rem', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: active ? '#3b82f6' : 'var(--text-main)', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', width: 'calc(50% - 0.375rem)' }}>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Taste Preferences 🌶️</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {['Spicy', 'Sweet Tooth', 'Veg Only', 'Keto', 'Vegan'].map(v => {
                    const active = userPrefs.includes(v);
                    return (
                      <button key={v} onClick={() => setUserPrefs(active ? userPrefs.filter(p => p !== v) : [...userPrefs, v])} style={{ fontSize: '0.9rem', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: active ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', width: 'calc(50% - 0.375rem)' }}>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
              {quizStep > 1 && (
                <button onClick={() => setQuizStep(prev => prev - 1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              )}
              {quizStep < 3 ? (
                <button onClick={() => setQuizStep(prev => prev + 1)} className="btn-primary" style={{ flex: 2 }}>Next</button>
              ) : (
                <button onClick={() => { setShowQuiz(false); setQuizStep(1); setToast('Vibe Personalized! ✨'); setTimeout(() => setToast(null), 3000); }} className="btn-primary" style={{ flex: 2 }}>Finish</button>
              )}
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

window.SuperApp = SuperApp;
window.dispatchEvent(new CustomEvent('superAppReady'));
