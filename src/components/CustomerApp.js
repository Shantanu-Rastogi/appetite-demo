const { useState, useEffect, useMemo, useCallback } = React;

function CustomerApp({
  globalCustomers, setGlobalCustomers, setGlobalOrders, globalOrders, setPendingPayments, pendingPayments,
  currentScreen, setCurrentScreen, phoneInput, setPhoneInput, nameInput, setNameInput,
  cart, setCart, submittedTickets, setSubmittedTickets, selectedPayment, setSelectedPayment,
  custTipAmount, setCustTipAmount, isCustomTip, setIsCustomTip, setLastTableInteraction, setServiceRequests,
  activeBills, setActiveBills, setGlobalSales, unavailableItems, setAnimatingItem, setToastMessage, toastMessage,
  inventoryLedger, setInventoryLedger, inventoryMode, recipes
}) {
  const WelcomeScreen = window.WelcomeScreen;
  const [hasDeclinedTip, setHasDeclinedTip] = useState(false);
  const [guestFeedback, setGuestFeedback] = useState(0);
  const [receiptSent, setReceiptSent] = useState(false);
  const [receiptContact, setReceiptContact] = useState('');
  const cartTotal = (cart || []).reduce((sum, item) => sum + item.price, 0);
  const [selectedSplitItems, setSelectedSplitItems] = useState({});
  const [dietaryFilter, setDietaryFilter] = useState('all'); // all, veg, non-veg, egg
  const [showNudge, setShowNudge] = useState(false);
  const [merchantVpa, setMerchantVpa] = useState('BHARATPE.8K0P1W2Z8F54661@fbpe');



  const handleStaffCallCust = (reason) => {
    if (setServiceRequests) {
      const reasonLabels = {
        water: 'Water',
        order_direct: 'Place order directly',
        other: 'Any other request'
      };
      setServiceRequests(prev => [...prev, { table: 7, type: 'Staff Call', note: reasonLabels[reason] || reason }]);
      setToastMessage(`Staff notified for: ${reasonLabels[reason] || reason}`);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const [sharedViewers, setSharedViewers] = useState([
    { initials: 'P1', name: 'Placeholder 1', color: '#10b981' },
    { initials: 'P2', name: 'Placeholder 2', color: '#f59e0b' }
  ]);

  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          const now = Date.now();
          const activeUsers = data.filter(u => now - u.lastSeen < 10000); // 10 seconds timeout
          setSharedViewers(activeUsers);
        })
        .catch(err => console.error("Failed to fetch users:", err));
        
      if (nameInput && currentScreen !== 'welcome') {
        const initials = nameInput.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
        // Consistent color based on name hash
        const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
        let hash = 0;
        for (let i = 0; i < nameInput.length; i++) {
          hash = nameInput.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];
        
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initials, name: nameInput, color, lastSeen: Date.now() })
        })
        .catch(err => console.error("Failed to send heartbeat:", err));
      }
    };
    
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    
    return () => clearInterval(interval);
  }, [nameInput, currentScreen]);

  const [showUserListModal, setShowUserListModal] = useState(false);

  const myOrders = globalOrders.filter(o => submittedTickets.includes(o.id));
  const tableSubtotal = myOrders.reduce((sum, order) => {
    return sum + (order.items || []).reduce((ordSum, item) => {
      const product = window.LUMINA_MENU.find(p => p.name === item.name);
      if (item.status === 'nc') return ordSum;
      return ordSum + (product ? product.price * item.qty : 0);
    }, 0);
  }, 0);

  const taxes = Math.floor(tableSubtotal * 0.15); // 5% GST + 10% SC
  const totalBeforeTip = tableSubtotal + taxes;
  const tipAmount = custTipAmount || 0;
  const tableTotal = totalBeforeTip + tipAmount; // FINAL Grand Total with Tips
  const projectedCashback = Math.floor(totalBeforeTip * 0.10); // Cashback based on pre-tip

  const splitSubtotal = Object.entries(selectedSplitItems).reduce((sum, [name, qty]) => {
    const product = window.LUMINA_MENU.find(p => p.name === name);
    return sum + (product ? product.price * qty : 0);
  }, 0);
  const splitTaxes = Math.floor(splitSubtotal * 0.15);
  const splitTip = Math.floor(tipAmount * (splitSubtotal / (tableSubtotal || 1)));
  const splitTotal = splitSubtotal + splitTaxes + splitTip;

  const isWaitingForWaiter = pendingPayments.some(p => p.table === 7 && p.customerPhone === phoneInput && p.method === 'cash');

  useEffect(() => {
    if (currentScreen === 'waiting_waiter' && !isWaitingForWaiter) setCurrentScreen('success');
  }, [pendingPayments, currentScreen, isWaitingForWaiter, setCurrentScreen]);

  useEffect(() => {
    if (currentScreen === 'waiting_bill' && activeBills.includes(7)) {
      setCurrentScreen('checkout');
    }
  }, [activeBills, currentScreen, setCurrentScreen]);

  const handleRequestBill = () => {
    setServiceRequests(prev => {
      if (prev.some(r => r.table === 7 && r.type === 'bill_request')) return prev;
      return [...prev, { table: 7, type: 'bill_request', time: Date.now() }];
    });
    pingHeartbeat();
    setCurrentScreen('waiting_bill');
  };

  const menuCategories = useMemo(() => {
    const cats = {};
    window.LUMINA_MENU.forEach(item => {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    });
    return cats;
  }, []);

  const [isCuisineMenuOpen, setIsCuisineMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [suggestionStep, setSuggestionStep] = useState(0);
  const [suggestionType, setSuggestionType] = useState('');
  const [suggestionPref, setSuggestionPref] = useState('');
  const [suggestionSpice, setSuggestionSpice] = useState('');
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [isConfirmingBill, setIsConfirmingBill] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState(0);

  const myUser = globalCustomers?.find(c => c.phone === phoneInput);
  const pointsAvailable = myUser && myUser.pointsByRestaurant ? (myUser.pointsByRestaurant['Lumina - Fine Dine'] || 0) : 0;
  const pointsValue = Math.floor(pointsAvailable / 10);
  const maxRedemption = Math.min(pointsValue, tableTotal);
  const finalTotal = tableTotal - (redeemPoints ? maxRedemption : 0);

  const handlePay = () => {
    pingHeartbeat();

    if (selectedPayment === 'waiter') {
      if (typeof setServiceRequests === 'function') {
        setServiceRequests(prev => [...prev, { table: 7, type: 'Payment Request', details: 'Wants to pay to waiter (Cash/Card)', time: Date.now() }]);
      }
      setPendingPayments(prev => [...prev, { table: 7, method: 'cash', amount: finalTotal, tip: tipAmount, customerPhone: phoneInput, cashbackValue: projectedCashback }]);
      setToastMessage("Waiter notified for payment!");
      setTimeout(() => setToastMessage(''), 3000);
      setCurrentScreen('waiting_waiter');
      return;
    }

    if (selectedPayment === 'app') {
      setGlobalSales(prev => ({ ...prev, totalRevenue: prev.totalRevenue + finalTotal, ordersToday: prev.ordersToday + 1 }));
      if (myUser) {
        const earnedPoints = Math.floor(finalTotal * 0.10);
        setGlobalCustomers(prev => prev.map(c => {
          if (c.phone === phoneInput) {
            const currentPoints = c.pointsByRestaurant ? (c.pointsByRestaurant['Lumina - Fine Dine'] || 0) : 0;
            const updatedPoints = currentPoints - (redeemPoints ? maxRedemption * 10 : 0) + earnedPoints;
            return {
              ...c,
              pointsByRestaurant: {
                ...c.pointsByRestaurant,
                'Lumina - Fine Dine': updatedPoints
              }
            };
          }
          return c;
        }));
      }
      setActiveBills(prev => prev.filter(tb => tb !== 7));
      setPendingPayments(prev => prev.filter(p => p.table !== 7));
      setCurrentScreen('success');
    } else if (selectedPayment === 'split') {
      const uAmount = finalTotal - splitCashAmount;
      setGlobalSales(prev => ({ ...prev, totalRevenue: prev.totalRevenue + uAmount, ordersToday: prev.ordersToday + 1 }));

      setPendingPayments([...pendingPayments, { table: 7, amount: splitCashAmount, method: 'cash', customerPhone: phoneInput, tip: custTipAmount, pointsRedeemed: redeemPoints ? maxRedemption * 10 : 0, cashbackValue: finalTotal * 0.10 }]);

      setActiveBills(prev => prev.filter(tb => tb !== 7));
      setCurrentScreen('waiting_waiter');
    } else {
      setPendingPayments([...pendingPayments, { table: 7, amount: finalTotal, method: selectedPayment, customerPhone: phoneInput, tip: custTipAmount, pointsRedeemed: redeemPoints ? maxRedemption * 10 : 0, cashbackValue: finalTotal * 0.10 }]);

      setActiveBills(prev => prev.filter(tb => tb !== 7));
      setCurrentScreen('waiting_waiter');
    }
  };

  const isItemUnavailable = (itemName) => {
    return { unavailable: unavailableItems.includes(itemName), color: 'var(--text-muted)', reason: 'Sold Out' };
  };

  const pingHeartbeat = () => setLastTableInteraction(Date.now());

  const handleScanLogin = () => {
    if (!phoneInput || !nameInput) return alert("Please enter Name and Phone to proceed.");
    setGlobalCustomers(prev => {
      const existing = prev.find(c => c.phone === phoneInput);
      return existing ? prev : [{ phone: phoneInput, name: nameInput, pointsByRestaurant: { 'Lumina - Fine Dine': 0 }, points: 0, visits: 1, lastVisit: 'Just now', tags: ['Table Ordering'] }, ...prev];
    });

    const name = nameInput;
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
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
    .catch(err => console.error("Failed to update user:", err));

    pingHeartbeat();
    setCurrentScreen('menu');
  };

  const addToCart = (product, e) => {
    if (e && setAnimatingItem) {
      const rect = e.target.getBoundingClientRect();
      setAnimatingItem({
        name: product.name,
        x: rect.left,
        y: rect.top,
        destX: window.innerWidth - 50,
        destY: window.innerHeight - 50
      });
      setTimeout(() => setAnimatingItem(null), 800);
    }
    setCart([...cart, { ...product, addedBy: nameInput.split(' ')[0] }]);
    pingHeartbeat();
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    pingHeartbeat();
    if (newCart.length === 0 && currentScreen === 'cart_review') setCurrentScreen('menu');
  };

  const removeFromCartByProduct = (product) => {
    const idx = cart.findIndex(c => c.id === product.id);
    if (idx > -1) {
      const newCart = [...cart];
      newCart.splice(idx, 1);
      setCart(newCart);
      pingHeartbeat();
      if (newCart.length === 0 && currentScreen === 'cart_review') setCurrentScreen('menu');
    }
  };

  const sendOrderToKitchen = () => {
    const newItems = cart.map((curr, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      name: curr.name,
      qty: 1,
      status: 'new',
      notes: curr.notes || ''
    }));

    const newTicketId = `TKT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 9000) + 1000}`;
    const newTicket = { id: newTicketId, table: 7, items: newItems, status: 'new', createdAt: Date.now() };

    if (inventoryMode === 'automated') {
      const updatedStock = window.InventoryEngine.deductIngredients(newTicket, inventoryLedger, recipes);
      setInventoryLedger(updatedStock);
    }

    setGlobalOrders(prev => [...prev, newTicket]);
    setSubmittedTickets(prev => [...prev, newTicketId]);
    setCart([]);
    pingHeartbeat();
    setCurrentScreen('table_dashboard');
  };

  const resetFlow = useCallback(() => {
    if (setGlobalOrders) setGlobalOrders(prev => prev.filter(o => o.table !== 7));
    if (setActiveBills) setActiveBills(prev => prev.filter(t => t !== 7));
    if (setPendingPayments) setPendingPayments(prev => prev.filter(p => p.table !== 7));

    setCart([]);
    setSubmittedTickets([]);
    setCurrentScreen('welcome');
    setPhoneInput('');
    setNameInput('');
    setSelectedPayment('');
    setCustTipAmount(0); setIsCustomTip(false);
    setGuestFeedback(0); setReceiptSent(false); setReceiptContact('');
  }, [setGlobalOrders, setActiveBills, setPendingPayments, setCart, setSubmittedTickets, setCurrentScreen, setPhoneInput, setNameInput, setSelectedPayment, setCustTipAmount, setIsCustomTip, setGuestFeedback, setReceiptSent, setReceiptContact]);

  const t7TotalOrders = globalOrders.some(o => o.table === 7);
  const t7UnservedItems = globalOrders.some(o => o.table === 7 && o.status !== 'served');

  useEffect(() => {
    let timer;

    if (currentScreen === 'waiting_waiter' && !pendingPayments.some(p => p.table === 7)) {
      setCurrentScreen('success');
    }

    if (currentScreen === 'success') {
      timer = setTimeout(() => {
        if (t7UnservedItems) {
          setCurrentScreen('table_dashboard');
        } else {
          resetFlow();
        }
      }, 4000);
    }

    if (!t7TotalOrders && !activeBills.includes(7) && (currentScreen === 'table_dashboard' || currentScreen === 'checkout' || currentScreen === 'waiting_bill')) {
      resetFlow();
    }

    return () => clearTimeout(timer);
  }, [currentScreen, pendingPayments, t7TotalOrders, t7UnservedItems, activeBills, resetFlow]);

  const renderProductCard = (product) => {
    const status = isItemUnavailable(product.name);
    const soldOut = status.unavailable;
    const qtyInCart = cart.filter(c => c.id === product.id).length;
    
    const isGhosted = dietaryFilter !== 'all' && product.dietary !== dietaryFilter;

    return (
      <div key={product.id * Math.random()} className={`product-card glass-panel ${soldOut ? 'sold-out' : ''}`} style={{ ...(soldOut ? { opacity: 0.75, background: 'var(--bg-glass)', position: 'relative', overflow: 'hidden' } : {}), ...(isGhosted ? { opacity: 0.3, filter: 'grayscale(100%)' } : {}), border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', borderRadius: '16px', padding: '1rem' }}>
        {soldOut && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(1.5px)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 8px 20px -5px rgba(0,0,0,0.1)' }}>
               Unavailable Today
            </div>
          </div>
        )}
        <div className="product-img" style={{ fontSize: '2.5rem', background: 'var(--bg-glass)', borderRadius: '12px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{product.image}</div>
        <div className="product-info" style={{ paddingLeft: '1rem' }}>
          <div className="product-title" style={{ fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
            <span style={{ lineHeight: '1.2', textDecoration: soldOut ? 'line-through' : 'none', color: soldOut ? 'var(--text-muted)' : 'var(--text-main)' }}>{product.name}</span>
            {product.tags && product.tags.map(t => <span key={t} className="status-badge" style={{ color: 'var(--primary)', border: '1px solid var(--primary)', background: 'transparent', fontSize: '0.65rem', padding: '0.1rem 0.4rem', whiteSpace: 'nowrap' }}>{t}</span>)}
          </div>
          <div className="product-desc" style={{ fontSize: '0.8rem', lineHeight: '1.3', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.desc}</div>
          <div className="product-meta" style={{ marginTop: 'auto', paddingTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span className="product-price" style={{ fontSize: '1rem' }}>₹{product.price}</span>
            {qtyInCart > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary)', borderRadius: '20px', overflow: 'hidden' }}>
                <button onClick={() => removeFromCartByProduct(product)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>-</button>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', minWidth: '20px', textAlign: 'center', userSelect: 'none' }}>{qtyInCart}</span>
                <button onClick={(e) => addToCart(product, e)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>+</button>
              </div>
            ) : (
              <button className="btn-add" onClick={(e) => !soldOut && addToCart(product, e)} disabled={soldOut} style={{ width: 'auto', padding: '0.4rem 1rem', height: 'auto', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {soldOut ? <>Sold Out</> : <><i className="fa-solid fa-plus"></i> ADD</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-simulator">
      <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '32px', background: '#000', borderRadius: '20px', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px' }}>
        <div style={{ width: '8px', height: '8px', background: '#222', borderRadius: '50%' }}></div>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
      </div>

      <div className="sim-header" style={{ paddingTop: '45px', height: '100px', position: 'relative' }}>
        {currentScreen !== 'welcome' && (
          <div style={{ position: 'absolute', top: '25px', right: '1.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowUserListModal(true)}>
            {[...(sharedViewers || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((u, i) => (
              <div key={i} style={{ width: '24px', height: '24px', borderRadius: '12px', background: u.color || '#9ca3af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', border: '2px solid #fff', marginLeft: i > 0 ? '-8px' : '0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={u.name || 'Anonymous'}>
                {u.initials || '?'}
              </div>
            ))}
          </div>
        )}
        {currentScreen === 'welcome' && <h2>Welcome to Lumina</h2>}
        {currentScreen === 'menu' && (
          <>
            <h2>Lumina (Table 7)</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', paddingRight: '70px' }}>Hi, {nameInput ? nameInput.split(' ')[0].charAt(0).toUpperCase() + nameInput.split(' ')[0].slice(1) : ''}</div>
          </>
        )}
        {currentScreen === 'cart_review' && (
          <>
            <button className="back-btn" onClick={() => { setCurrentScreen('menu'); pingHeartbeat(); }}><i className="fa-solid fa-chevron-left"></i></button>
            <h2>Current Cart</h2>
            <div style={{ width: '24px' }}></div>
          </>
        )}
        {currentScreen === 'table_dashboard' && <h2>My Table Session</h2>}
        {currentScreen === 'checkout' && (
          <>
            <button className="back-btn" onClick={() => { setCurrentScreen('table_dashboard'); pingHeartbeat(); }}><i className="fa-solid fa-chevron-left"></i></button>
            <h2>Request Bill</h2>
            <div style={{ width: '24px' }}></div>
          </>
        )}
        {(currentScreen === 'waiting_waiter' || currentScreen === 'success') && <h2>Checkout</h2>}
      </div>

        {showUserListModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowUserListModal(false)}>
            <div className="glass-panel" style={{ width: '80%', maxWidth: '300px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Users at Table 7</h3>
                <button onClick={() => setShowUserListModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...(sharedViewers || [])].sort((a, b) => a.name.localeCompare(b.name)).map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: u.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {u.initials}
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{u.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      <div className="sim-content page-transition">

        {/* --- WELCOME --- */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            nameInput={nameInput}
            setNameInput={setNameInput}
            phoneInput={phoneInput}
            setPhoneInput={setPhoneInput}
            handleScanLogin={handleScanLogin}
          />
        )}

        {/* --- MENU --- */}
        {currentScreen === 'menu' && (
          <div className="screen-menu fade-in">
            
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Call Staff</div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { id: 'water', label: 'Water', icon: 'fa-glass-water' },
                  { id: 'order_direct', label: 'Order', icon: 'fa-utensils' },
                  { id: 'other', label: 'Other', icon: 'fa-bell' }
                ].map(option => (
                  <button 
                    key={option.id} 
                    onClick={() => handleStaffCallCust(option.id)}
                    style={{ 
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.8)', 
                      border: '1px solid var(--glass-border)', 
                      color: 'var(--text-main)', 
                      fontSize: '0.85rem', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className={`fa-solid ${option.icon}`} style={{ color: 'var(--primary)' }}></i> {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <button onClick={() => setActiveTab('menu')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'menu' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1rem' }}>Menu</button>
              <button onClick={() => setActiveTab('discover')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'discover' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'discover' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1rem' }}><i className="fa-solid fa-sparkles"></i> Discover</button>
            </div>

            {activeTab === 'discover' && (
              <div className="fade-in" style={{ padding: `0 1.5rem ${cart.length > 0 || submittedTickets.length > 0 ? '7rem' : '2rem'}` }}>
                {suggestionStep === 0 && (
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '16px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>What are you in the mood for?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button className="btn-secondary" onClick={() => { setSuggestionType('light'); setSuggestionStep(1); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🥢</span> <span style={{ fontWeight: '600' }}>Light Bites & Appetizers</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionType('hearty'); setSuggestionStep(1); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🥘</span> <span style={{ fontWeight: '600' }}>A Hearty Meal</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionType('drinks'); setSuggestionStep(3); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🍹</span> <span style={{ fontWeight: '600' }}>Just Drinks</span></button>
                    </div>
                  </div>
                )}
                {suggestionStep === 1 && (
                  <div className="glass-panel fade-in" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '16px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Any preferences?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button className="btn-secondary" onClick={() => { setSuggestionPref('veg'); setSuggestionStep(2); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🥬</span> <span style={{ fontWeight: '600' }}>Vegetarian</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionPref('chicken'); setSuggestionStep(2); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🍗</span> <span style={{ fontWeight: '600' }}>Chicken</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionPref('seafood'); setSuggestionStep(2); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🍤</span> <span style={{ fontWeight: '600' }}>Seafood / Mutton</span></button>
                    </div>
                  </div>
                )}
                {suggestionStep === 2 && (
                  <div className="glass-panel fade-in" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '16px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Spice Tolerance?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button className="btn-secondary" onClick={() => { setSuggestionSpice('mild'); setSuggestionStep(3); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🍃</span> <span style={{ fontWeight: '600' }}>Mild / None</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionSpice('medium'); setSuggestionStep(3); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🌶️</span> <span style={{ fontWeight: '600' }}>Medium Spice</span></button>
                      <button className="btn-secondary" onClick={() => { setSuggestionSpice('spicy'); setSuggestionStep(3); }} style={{ textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🔥</span> <span style={{ fontWeight: '600' }}>Extra Spicy</span></button>
                    </div>
                  </div>
                )}
                {suggestionStep === 3 && (
                  <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ color: 'var(--text-main)' }}>AI Suggestions</h3>
                      <button onClick={() => { setSuggestionStep(0); setSuggestionSpice(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}><i className="fa-solid fa-rotate-left"></i> Reset</button>
                    </div>
                    <div className="product-grid">
                      {window.LUMINA_MENU.filter(item => {
                        if (suggestionType === 'drinks') return item.category === 'Drinks & Cocktails';

                        const isSpicy = item.id % 2 !== 0;
                        const isMild = item.id % 2 === 0;

                        if (suggestionSpice === 'mild' && !isMild) return false;
                        if (suggestionSpice === 'spicy' && !isSpicy) return false;

                        if (suggestionType === 'light') {
                          if (suggestionPref === 'veg') return [3, 4, 7, 13].includes(item.id);
                          if (suggestionPref === 'chicken') return [5, 25].includes(item.id);
                          return [1, 2, 6, 8].includes(item.id);
                        }
                        if (suggestionType === 'hearty') {
                          if (suggestionPref === 'veg') return [13, 17, 26, 28, 29, 30, 20, 22].includes(item.id);
                          if (suggestionPref === 'chicken') return [12, 16, 27, 23].includes(item.id);
                          return [18, 19, 15, 21, 24].includes(item.id);
                        }
                        return false;
                      }).map(renderProductCard)}
                      {window.LUMINA_MENU.filter(item => {
                        if (suggestionType === 'drinks') return item.category === 'Drinks & Cocktails';
                        const isSpicy = item.id % 2 !== 0;
                        const isMild = item.id % 2 === 0;
                        if (suggestionSpice === 'mild' && !isMild) return false;
                        if (suggestionSpice === 'spicy' && !isSpicy) return false;
                        if (suggestionType === 'light') {
                          if (suggestionPref === 'veg') return [3, 4, 7, 13].includes(item.id);
                          if (suggestionPref === 'chicken') return [5, 25].includes(item.id);
                          return [1, 2, 6, 8].includes(item.id);
                        }
                        if (suggestionType === 'hearty') {
                          if (suggestionPref === 'veg') return [13, 17, 26, 28, 29, 30, 20, 22].includes(item.id);
                          if (suggestionPref === 'chicken') return [12, 16, 27, 23].includes(item.id);
                          return [18, 19, 15, 21, 24].includes(item.id);
                        }
                        return false;
                      }).length === 0 && (
                          <div style={{ color: 'var(--text-muted)' }}>No exact matches found. Please re-adjust your spice level!</div>
                        )}
                    </div>
                  </div>
                )}

                <div style={{ padding: '1.5rem 0 1rem' }}>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.75rem', opacity: 0.9 }}><i className="fa-solid fa-clock-rotate-left"></i> Based on your last visits</h3>
                  <div className="product-grid" style={{ marginBottom: '2rem' }}>
                    {[window.LUMINA_MENU.find(i => i.id === 1), window.LUMINA_MENU.find(i => i.id === 36)].filter(Boolean).map(renderProductCard)}
                  </div>
                </div>

              </div>
            )}

            <div style={{ display: activeTab === 'menu' ? 'block' : 'none' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem', overflowX: 'auto', justifyContent: 'center' }} className="hide-scroll">
                {['all', 'veg', 'non-veg', 'egg'].map(f => (
                  <span
                    key={f}
                    onClick={() => setDietaryFilter(f)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: dietaryFilter === f ? '700' : '500',
                      color: dietaryFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                      position: 'relative',
                      padding: '0.25rem 0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'non-veg' ? 'Non-Veg' : f === 'veg' ? 'Veg' : 'Egg'}
                    {dietaryFilter === f && (
                      <div style={{ position: 'absolute', bottom: '-0.5rem', left: 0, right: 0, height: '3px', background: 'var(--primary)' }}></div>
                    )}
                  </span>
                ))}
              </div>
              {['Starters', 'Soups & Salads', 'Asian Mains', 'Continental Mains', 'Pizzas', 'Burgers', 'Indian', 'Desserts', 'Drinks & Cocktails'].map(categoryName => {
                if (!menuCategories[categoryName]) return null;
                return (
                  <div key={categoryName} id={`cat-${categoryName.replace(/\s+/g, '')}`} style={{ marginBottom: '2rem' }}>
                    <h3 className="menu-category">{categoryName}</h3>
                    <div className="product-grid">
                      {menuCategories[categoryName].map(renderProductCard)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ height: '100px' }}></div>

            {cart.length > 0 ? (
              <div className="floating-cart-bar fade-in">
                <button className="cart-btn" onClick={() => { setCurrentScreen('cart_review'); pingHeartbeat(); }}>
                  <span><i className="fa-solid fa-bag-shopping"></i> View Cart</span>
                  <span className="cart-badge">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
                </button>
              </div>
            ) : submittedTickets.length > 0 ? (
              <div className="floating-cart-bar fade-in">
                <button className="cart-btn" style={{ background: '#111827' }} onClick={() => { setCurrentScreen('table_dashboard'); pingHeartbeat(); }}>
                  <span><i className="fa-solid fa-receipt"></i> Back to My Table</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* --- CART REVIEW --- */}
        {currentScreen === 'cart_review' && (
          <div className="screen-cart flex-col-full fade-in">
            <div className="cart-items" style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}><i className="fa-solid fa-users"></i> Table Cart</h3>
                <button onClick={() => { setCurrentScreen('menu'); pingHeartbeat(); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}><i className="fa-solid fa-chevron-left"></i> Menu</button>
              </div>
              {cart.map((item, idx) => (
                <div key={idx} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="cart-item-info">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {item.addedBy || 'Someone'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={() => removeFromCart(idx)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px', cursor: 'pointer', border: 'none' }}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                  {!item.notes ? (
                    <button 
                      onClick={() => {
                        const newCart = [...cart];
                        newCart[idx] = { ...newCart[idx], notes: ' ' };
                        setCart(newCart);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: '4px 0', fontWeight: '600' }}
                    >
                      + Add instructions
                    </button>
                  ) : (
                    <div style={{ width: '100%' }}>
                      <input 
                        type="text" 
                        placeholder="Add customization notes (e.g., no mushroom)" 
                        value={item.notes === ' ' ? '' : item.notes} 
                        onChange={(e) => {
                          const newCart = [...cart];
                          newCart[idx] = { ...newCart[idx], notes: e.target.value };
                          setCart(newCart);
                        }}
                        style={{ width: '100%', padding: '0.4rem 0', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--glass-border)', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
                        autoFocus
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            const newCart = [...cart];
                            newCart[idx] = { ...newCart[idx], notes: '' };
                            setCart(newCart);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="cart-summary sticky-bottom">
              <button className="btn-primary" onClick={() => setIsConfirmingOrder(true)} disabled={cart.length === 0}>
                Place Open Order <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* Order Confirmation Modal */}
            {isConfirmingOrder && (
              <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg-main, #ffffff)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Confirm your order?</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Please confirm the {cart.length} items. Once sent to the kitchen, it cannot be undone.</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setIsConfirmingOrder(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-muted)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                    <button className="btn-primary" onClick={() => { setIsConfirmingOrder(false); sendOrderToKitchen(); }} style={{ flex: 1, padding: '0.75rem' }}>Confirm</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TABLE DASHBOARD --- */}
        {currentScreen === 'table_dashboard' && (
          <div className="screen-cart flex-col-full fade-in">
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Live Tickets</h3>
                <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none' }} onClick={() => { setCurrentScreen('menu'); pingHeartbeat(); }}>
                  + Add Items
                </button>
              </div>

              {myOrders.length === 0 ? <p>No active orders.</p> : myOrders.map((order, idx) => (
                <div key={order.id} className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Order #{idx + 1}</span>
                    {order.status === 'new' && <span className="status-badge" style={{ color: '#6b7280' }}>Ordered</span>}
                    {order.status === 'cooking' && <span className="status-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>Cooking <i className="fa-solid fa-fire fa-fade"></i></span>}
                    {order.status === 'ready' && <span className="status-badge" style={{ color: 'var(--primary)', background: 'rgba(16,185,129,0.1)' }}>Ready <i className="fa-solid fa-bell-concierge"></i></span>}
                    {order.status === 'served' && <span className="status-badge" style={{ color: 'var(--text-main)', background: 'rgba(0,0,0,0.05)' }}><i className="fa-solid fa-check-double"></i> Served</span>}
                  </div>
                  {Object.values(order.items.reduce((acc, curr) => {
                    const key = `${curr.name}-${curr.status}`;
                    if (!acc[key]) acc[key] = { ...curr, qty: 0 };
                    acc[key].qty += 1;
                    return acc;
                  }, {})).map((item, idxx) => (
                    <div key={idxx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '6px', color: 'var(--text-main)', fontWeight: '500' }}>
                      <span><span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{item.qty}x</span> {item.name} {item.status === 'nc' && <span style={{ color: '#10b981' }}>(Free)</span>}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="cart-summary sticky-bottom">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {[
                    { id: 'water', label: 'Water 💧' },
                    { id: 'bill', label: 'Bill 🧾' },
                    { id: 'help', label: 'Help 💬' }
                  ].map(option => (
                    <button 
                      key={option.id} 
                      onClick={() => {
                        pingHeartbeat();
                        setServiceRequests(prev => [...prev, { table: 7, type: 'Service Request', details: option.label, time: Date.now() }]);
                        setToastMessage(`Request sent for: ${option.label}`);
                        setTimeout(() => setToastMessage(''), 3000);
                      }}
                      style={{ flex: 1, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              <button className="btn-primary" onClick={() => setIsConfirmingBill(true)} disabled={myOrders.length === 0}>
                Request Checkout <i className="fa-solid fa-receipt"></i>
              </button>
            </div>
          </div>
        )}

        {/* Customer Bill Confirmation Modal */}
        {isConfirmingBill && (
          <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-main, #ffffff)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Request Checkout?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Are you sure you want to generate the bill? Once the waiter approves, you will be locked out of the menu.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setIsConfirmingBill(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-muted)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer' }}>No, cancel</button>
                <button className="btn-primary" onClick={() => { setIsConfirmingBill(false); handleRequestBill(); }} style={{ flex: 1, padding: '0.75rem' }}>Yes, generate</button>
              </div>
            </div>
          </div>
        )}

        {/* --- CHECKOUT (WITH TIP) --- */}
        {currentScreen === 'checkout' && (
          <div className="screen-cart flex-col-full fade-in">
            <div className="checkout-section fade-in" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>

              {/* Itemized Receipt */}
              <div style={{ marginBottom: '2rem', background: 'var(--bg-glass)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}><i className="fa-solid fa-receipt"></i> Itemized Bill</h4>
                {Object.values(myOrders.flatMap(o => o.items || []).reduce((acc, curr) => {
                  const product = window.LUMINA_MENU.find(p => p.name === curr.name);
                  const price = product ? product.price : 0;
                  if (!acc[curr.name]) acc[curr.name] = { name: curr.name, qty: 0, price };
                  acc[curr.name].qty += 1;
                  return acc;
                  return acc;
                }, {})).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    <span><span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>{item.qty}x</span> {item.name}</span>
                    <span style={{ fontWeight: '600' }}>₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem' }}>
                  <span>Subtotal</span>
                  <span>₹{tableSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  <span>Taxes (5%)</span>
                  <span>₹{taxes}</span>
                </div>
              </div>

              {hasDeclinedTip ? (
                <div className="fade-in" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                  <button onClick={() => setHasDeclinedTip(false)} style={{ background: 'transparent', border: '1px dashed var(--glass-border)', padding: '0.75rem 2rem', borderRadius: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <i className="fa-solid fa-plus"></i> Add Tip (Optional)
                  </button>
                </div>
              ) : (
                <div className="fade-in" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-heart" style={{ color: '#ef4444' }}></i> Support the Team</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>100% of your tip goes directly to the staff preparing and serving your meal today.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[
                      { pct: 10, label: '10%' },
                      { pct: 20, label: '20%' }
                    ].map(({ pct, label }) => {
                      const amt = Math.floor(totalBeforeTip * (pct / 100));
                      const isSelected = !isCustomTip && custTipAmount === amt;
                      return (
                        <button key={pct} onClick={() => { setCustTipAmount(amt); setIsCustomTip(false); }} className="jump-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0.25rem', borderRadius: '12px', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: isSelected ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', color: isSelected ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '4px' }}>{label}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₹{amt}</span>
                        </button>
                      )
                    })}
                    <button onClick={() => { setIsCustomTip(true); setCustTipAmount(0); }} className="jump-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0.25rem', borderRadius: '12px', border: isCustomTip ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: isCustomTip ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', color: isCustomTip ? 'var(--primary)' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isCustomTip ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '4px' }}>Custom</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Tip</span>
                    </button>
                  </div>
                  {isCustomTip && (
                    <div className="fade-in" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹</span>
                      <input type="number" placeholder="Enter amount" value={custTipAmount || ''} onChange={e => setCustTipAmount(parseInt(e.target.value) || 0)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--primary)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '1rem' }} autoFocus />
                    </div>
                  )}
                </div>
              )}

              <h4 style={{ marginBottom: '1rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1.5rem' }}>How would you like to pay?</h4>

              {pointsValue > 0 && (
                <div style={{ background: 'var(--bg-glass)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}><i className="fa-solid fa-gift"></i> Appetite Credit</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You have ₹{pointsValue} available to redeem</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={redeemPoints} onChange={e => setRedeemPoints(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    <span>Redeem</span>
                  </label>
                </div>
              )}

              <div className="payment-options">
                <label className={`payment-card ${selectedPayment === 'app' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="app" onChange={() => setSelectedPayment('app')} />
                  <i className="fa-solid fa-qrcode"></i> Pay via UPI (PhonePe / GPay)
                </label>
                <label className={`payment-card ${selectedPayment === 'split' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="split" onChange={() => setSelectedPayment('split')} />
                  <i className="fa-solid fa-money-bill-transfer"></i> Split Payment (Cash + UPI)
                </label>
                <label className={`payment-card ${selectedPayment === 'waiter' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="waiter" onChange={() => setSelectedPayment('waiter')} />
                  <i className="fa-solid fa-bell-concierge"></i> Pay to Waiter (Cash/Card)
                </label>
              </div>

              {selectedPayment === 'split' && (
                <div className="fade-in" style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                  <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>How much Cash will you leave on the table?</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹</span>
                    <input type="number" placeholder="Cash Amount" value={splitCashAmount || ''} onChange={e => {
                      const v = parseInt(e.target.value) || 0;
                      setSplitCashAmount(Math.min(v, finalTotal));
                    }} style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }} />
                  </div>
                  {splitCashAmount > 0 && splitCashAmount <= finalTotal && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The remaining <strong style={{ color: 'var(--primary)' }}>₹{finalTotal - splitCashAmount}</strong> will be securely paid via UPI dynamically.</p>
                  )}
                </div>
              )}

              <div className="loyalty-banner" style={{ marginTop: '2rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-gift pulse-anim"></i> Instant Cashback
                </div>
                <p style={{ fontSize: '0.9rem' }}>Complete payment to earn <strong>₹{projectedCashback}</strong> towards your next visit!</p>
              </div>
            </div>

            <div className="cart-summary sticky-bottom">
              <div className="summary-row" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}><span>Bill Total</span><span>₹{totalBeforeTip}</span></div>
              {tipAmount > 0 && <div className="summary-row" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}><span>Staff Tip</span><span>+ ₹{tipAmount}</span></div>}
              {redeemPoints && <div className="summary-row" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}><span>Points Redeemed</span><span>- ₹{maxRedemption}</span></div>}
              <div className="summary-row total"><span>Grand Total</span><span>₹{finalTotal}</span></div>

              {!selectedPayment && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid #f59e0b', color: '#f59e0b', textAlign: 'center', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-circle-info"></i> Please select a payment method above to proceed.
                </div>
              )}

              {selectedPayment === 'app' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose your UPI App:</div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Merchant UPI ID (for testing)</label>
                    <input type="text" value={merchantVpa} onChange={(e) => setMerchantVpa(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} placeholder="example@upi" />
                  </div>

                  <a href={window.upiHelper.getUpiLink('gpay', merchantVpa, `${finalTotal}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', color: '#333', border: '1px solid #ddd', textDecoration: 'none', width: '100%' }}>
                    <i className="fa-brands fa-google" style={{ color: '#4285F4' }}></i> Pay via GPay
                  </a>
                  <a href={window.upiHelper.getUpiLink('phonepe', merchantVpa, `${finalTotal}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#5f259f', textDecoration: 'none', width: '100%' }}>
                    Pay via PhonePe
                  </a>
                  <a href={window.upiHelper.getUpiLink('paytm', merchantVpa, `${finalTotal}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#00baf2', textDecoration: 'none', width: '100%' }}>
                    Pay via Paytm
                  </a>
                  <a href={window.upiHelper.getUpiLink('upi', merchantVpa, `${finalTotal}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#111', textDecoration: 'none', width: '100%' }}>
                    <i className="fa-solid fa-qrcode"></i> Choose Other App
                  </a>
                </div>
              ) : selectedPayment === 'split' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', opacity: (splitCashAmount > 0 && splitCashAmount < finalTotal) ? 1 : 0.5, pointerEvents: (splitCashAmount > 0 && splitCashAmount < finalTotal) ? 'auto' : 'none' }}>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Merchant UPI ID (for testing)</label>
                    <input type="text" value={merchantVpa} onChange={(e) => setMerchantVpa(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} placeholder="example@upi" />
                  </div>

                  <a href={window.upiHelper.getUpiLink('gpay', merchantVpa, `${finalTotal - splitCashAmount}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', color: '#333', border: '1px solid #ddd', textDecoration: 'none', width: '100%' }}>
                    <i className="fa-brands fa-google" style={{ color: '#4285F4' }}></i> Pay Balance via GPay
                  </a>
                  <a href={window.upiHelper.getUpiLink('upi', merchantVpa, `${finalTotal - splitCashAmount}.00`)} className="btn-primary" onClick={() => setTimeout(handlePay, 500)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#111', textDecoration: 'none', width: '100%' }}>
                    <i className="fa-solid fa-qrcode"></i> Pay Balance via Other App
                  </a>
                </div>

              ) : (
                <button className="btn-primary" onClick={handlePay} disabled={!selectedPayment}>
                  {selectedPayment === 'waiter' ? `Alert Waiter for Cash/Card` : `Pay ₹${finalTotal} Securely`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- WAITING FOR BILL --- */}
        {currentScreen === 'waiting_bill' && (
          <div className="tracker-screen fade-in" style={{ justifyContent: 'center' }}>
            <div className="tracker-animation spin" style={{ fontSize: '4rem', marginBottom: '2rem' }}><i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i></div>
            <h2 style={{ color: 'var(--text-main)' }}>Bill Requested!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>Your waiter has been notified and will open your checkout screen shortly. Thank you!</p>
          </div>
        )}

        {/* --- WAITING --- */}
        {currentScreen === 'waiting_waiter' && (
          <div className="tracker-screen fade-in" style={{ justifyContent: 'center' }}>
            <div className="tracker-animation spin" style={{ fontSize: '4rem', marginBottom: '2rem' }}><i className="fa-solid fa-hourglass-half" style={{ color: 'var(--primary)' }}></i></div>
            <h2 style={{ color: 'var(--text-main)' }}>Request Sent!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>The waiter has been notified. They will be with you shortly to collect ₹{tableTotal} via {(selectedPayment || '').toUpperCase()}.</p>
            <p style={{ color: 'var(--primary)', marginTop: '2rem', fontSize: '0.9rem', fontWeight: 'bold' }}>*Waiting for Staff Terminal confirmation...*</p>
          </div>
        )}

        {/* --- SUCCESS --- */}
        {currentScreen === 'success' && (
          <div className="success-screen fade-in">
            <i className="fa-solid fa-circle-check success-icon" style={{ marginBottom: '0.5rem' }}></i>
            <h2 style={{ marginBottom: '0' }}>Payment Confirmed!</h2>

            {!guestFeedback ? (
              <div style={{ margin: '1.5rem 0', background: 'var(--bg-glass)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }} className="fade-in">
                <p style={{ marginTop: 0, marginBottom: '0.75rem', fontWeight: 'bold' }}>How was your experience today?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <i key={star} className="fa-solid fa-star" style={{ color: 'var(--glass-border)', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.2)' }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'var(--glass-border)'; e.currentTarget.style.transform = 'scale(1)' }}
                      onClick={() => {
                        setGuestFeedback(star);
                        if (star <= 3) {
                          setServiceRequests(prev => [...prev, { table: 7, type: `Service Recovery Required (${star} Stars)`, time: Date.now() }]);
                        }
                      }}
                    ></i>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ margin: '1.5rem 0', color: guestFeedback >= 4 ? 'var(--primary)' : '#ef4444', fontWeight: 'bold' }} className="fade-in">
                <i className={guestFeedback >= 4 ? "fa-solid fa-heart" : "fa-solid fa-bell-concierge"}></i> {guestFeedback >= 4 ? "We're so glad you enjoyed!" : "I'm sorry to hear that. The floor manager is on their way."}
              </div>
            )}

            {!receiptSent ? (
              <div style={{ margin: '0 0 1.5rem', background: 'var(--bg-glass)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <p style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get your digital receipt:</p>
                <div style={{ display: 'flex' }}>
                  <input type="text" placeholder="WhatsApp No. or Email" value={receiptContact} onChange={e => setReceiptContact(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff', borderRadius: '8px 0 0 8px' }} />
                  <button className="btn-primary" style={{ width: 'auto', borderRadius: '0 8px 8px 0', background: '#3b82f6', color: '#fff', border: 'none', padding: '0 1.5rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { if (receiptContact) setReceiptSent(true); }}>Send</button>
                </div>
              </div>
            ) : (
              <div style={{ margin: '0 0 1.5rem', color: '#3b82f6', fontSize: '0.9rem', fontWeight: 'bold' }} className="fade-in">
                <i className="fa-solid fa-paper-plane"></i> Digital Receipt Sent!
              </div>
            )}

            {custTipAmount > 0 && <p style={{ color: 'var(--text-main)', marginTop: '1rem', fontWeight: 'bold' }}>Thank you for tipping our staff! ❤️</p>}

            <div className="points-reveal">
              <div className="points-text">You just earned</div>
              <div className="points-number">₹{projectedCashback}</div>
              <div className="points-text">in Appetite Credit!</div>
            </div>

            <p style={{ fontSize: '0.95rem', marginBottom: '2rem', padding: '0 1rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
              Download the <strong>Appetite App</strong> to claim your ₹{projectedCashback} cashback for next time!
            </p>

            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <i className="fa-brands fa-apple"></i> Get App
            </button>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }} onClick={resetFlow}>
              Leave Table (End Session)
            </button>
          </div>
        )}
      </div>

      {currentScreen === 'menu' && (
        <>
          <button
            onClick={() => setIsCuisineMenuOpen(true)}
            style={{ position: 'absolute', bottom: '7.5rem', right: '1.5rem', width: '56px', height: '56px', borderRadius: '28px', background: 'var(--primary)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, cursor: 'pointer' }}>
            <i className="fa-solid fa-utensils"></i>
          </button>

          {isCuisineMenuOpen && (
            <div className="fade-in" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ background: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '1.5rem', paddingBottom: '3rem', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}><i className="fa-solid fa-book-open"></i> Cuisines</h3>
                  <button onClick={() => setIsCuisineMenuOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {['Starters', 'Soups & Salads', 'Asian Mains', 'Continental Mains', 'Pizzas', 'Burgers', 'Indian', 'Desserts', 'Drinks & Cocktails'].map(cat => menuCategories[cat] ? (
                    <button key={cat} onClick={() => { setIsCuisineMenuOpen(false); document.getElementById(`cat-${cat.replace(/\s+/g, '')}`).scrollIntoView({ behavior: 'smooth' }); }} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: '0.9rem', padding: '1rem 0.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', textAlign: 'center' }}>
                      {cat}
                    </button>
                  ) : null)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {toastMessage && (
        <div className="fade-in" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '20px', zIndex: 1000, fontSize: '0.9rem' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

window.CustomerApp = CustomerApp;
