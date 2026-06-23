const { useState, useEffect, useMemo, useCallback } = React;

function StaffApp({ isBarMode = false, onBackToKDS, activeOrders, setActiveOrders, pendingPayments, setPendingPayments, setGlobalSales, setGlobalCustomers, lastTableInteraction, serviceRequests = [], setServiceRequests, activeBills, setActiveBills, customTabs = [], setCustomTabs, creditNotes = [], setCreditNotes, ncOrders = [], setNcOrders, pendingCredits = [], setPendingCredits, currentUserRole = 'manager', setCurrentUserRole, isInventoryModalOpen, setIsInventoryModalOpen, inventoryLedger, setInventoryLedger, dismissedHeaderAlerts = [], setDismissedHeaderAlerts, setToastMessage }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [table7Users, setTable7Users] = useState([]);
  const [selectedItemForActions, setSelectedItemForActions] = useState(null);
  console.log("StaffApp rendering, selectedItemForActions:", selectedItemForActions);

  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setTable7Users(data))
        .catch(err => console.error("Failed to fetch users in StaffApp:", err));
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isNcSourceModalOpen, setIsNcSourceModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [ncAction, setNcAction] = useState(null);
  const [activeEditRow, setActiveEditRow] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [showCreditLedger, setShowCreditLedger] = useState(false);
  const [pendingCreditOrder, setPendingCreditOrder] = useState(null);
  const [pendingNcProduct, setPendingNcProduct] = useState(null);
  const [menuFilter, setMenuFilter] = useState(isBarMode ? 'Drinks & Cocktails' : 'All');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetTable, setTargetTable] = useState('');
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showNcItems, setShowNcItems] = useState(true);
  const [isVerifyingUPI, setIsVerifyingUPI] = useState(false);
  const [upiTickerText, setUpiTickerText] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // 1s tick for checking inactivity
    return () => clearInterval(interval);
  }, []);

  if (!window.LUMINA_MENU) {
    return <div style={{ color: 'var(--text-main)', padding: '2rem', textAlign: 'center' }}>Loading Staff App...</div>;
  }

  const readyOrders = activeOrders.filter(o => (o.items || []).some(i => i.status === 'ready'));
  const cookingOrders = activeOrders.filter(o => o.status === 'cooking' || o.status === 'new');

  const markServed = (id) => setActiveOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'served' } : o));

  // --- STAFF MANUAL ORDERING CRUD ---
  const handleRemoveItem = (orderId, itemId) => {
    setActiveOrders(prev => {
      return prev.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.filter(i => i.id !== itemId);
        return { ...o, items: newItems };
      }).filter(o => o.items.length > 0);
    });
  };

  const handleChangeQty = (orderId, oldItem, delta) => {
    if (oldItem.qty + delta <= 0) {
      handleRemoveItem(orderId, oldItem.ids[0]);
      return;
    }
    setActiveOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (delta > 0) {
        return { ...o, items: [...o.items, { id: `it-${Date.now()}-${Math.random()}`, name: oldItem.name, qty: 1, status: 'new' }] };
      } else {
        return { ...o, items: o.items.filter(i => i.id !== oldItem.ids[0]) };
      }
    }));
  };

  const executeShiftTable = (fromTable, toTable) => {
    setActiveOrders(prev => prev.map(o => {
      if (o.table === fromTable) {
        const newItems = toTable === 'NC Tab' ? o.items.map(i => ({ ...i, status: 'nc', ncSource: 'Shift to NC' })) : o.items;
        return { ...o, table: toTable, originalTable: fromTable, items: newItems };
      }
      return o;
    }));
    setSelectedTable(toTable);
    setIsShiftModalOpen(false);
    setTargetTable('');
    setShowJoinConfirm(false);
  };

  const handleShiftTable = () => {
    const toTableNum = parseInt(targetTable) || targetTable;
    const targetTableOrders = activeOrders.filter(o => o.table === toTableNum);
    if (targetTableOrders.length > 0) {
      setShowJoinConfirm(true);
    } else {
      executeShiftTable(selectedTable, toTableNum);
    }
  };

  const handleAddNewItem = (product, e) => {
    if (e && setAnimatingItem) {
      const rect = e.target.getBoundingClientRect();
      setAnimatingItem({
        name: product.name,
        x: rect.left,
        y: rect.top,
        destX: window.innerWidth - 200,
        destY: window.innerHeight / 2
      });
      setTimeout(() => setAnimatingItem(null), 800);
    }
    if (selectedTable === 'NC') {
      setNcAction({ type: 'add', product });
      setIsNcSourceModalOpen(true);
      setIsAddMenuOpen(false);
      return;
    }

    const existingNewOrder = activeOrders.find(o => o.table === selectedTable && o.status === 'new');
    const newItem = { id: `it-${Date.now()}-${Math.random()}`, name: product.name, qty: 1, status: 'new' };

    if (existingNewOrder) {
      setActiveOrders(prev => prev.map(o => o.id === existingNewOrder.id ? { ...o, items: [...o.items, newItem] } : o));
    } else {
      const newTicketId = `TKT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 9000) + 1000}`;
      setActiveOrders(prev => [...prev, { id: newTicketId, table: selectedTable, items: [newItem], status: 'new', createdAt: Date.now() }]);
    }
    setIsAddMenuOpen(false);
  };

  const handleAddNCItem = (product) => {
    const source = prompt("Enter NC Source (e.g., DJ, PR, Staff):");
    if (!source) return;
    const newItem = { 
      id: `nc-${Date.now()}-${Math.random()}`, 
      name: product.name, 
      qty: 1, 
      table: selectedTable, 
      source, 
      timestamp: Date.now(), 
      costPrice: product.costPrice || 0 
    };
    setNcOrders(prev => [...prev, newItem]);
    setIsAddMenuOpen(false);
    alert(`${product.name} added to NC for Table ${selectedTable}`);
  };

  const handleMarkAsCredit = () => {
    if (currentUserRole !== 'manager') {
      alert("Only Managers can mark as credit!");
      return;
    }
    const guestName = prompt("Enter Guest Name for Credit (e.g., Rahul Regular):");
    if (!guestName) return;
    
    const tableOrders = activeOrders.filter(o => o.table === selectedTable);
    const subtotal = tableOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((ordSum, item) => {
        const product = window.LUMINA_MENU.find(p => p.name === item.name);
        if (item.status === 'nc') return ordSum;
        return ordSum + (product ? product.price * item.qty : 0);
      }, 0);
    }, 0);
    const taxes = Math.floor(subtotal * 0.15); // 5% GST + 10% SC
    
    const newCredit = {
      id: `credit-${Date.now()}`,
      guestName,
      table: selectedTable,
      amount: subtotal + taxes,
      timestamp: Date.now(),
      items: tableOrders
    };
    
    setPendingCredits(prev => [...prev, newCredit]);
    
    setActiveBills(prev => Array.isArray(prev) ? prev.filter(t => t !== selectedTable) : []);
    setActiveOrders(prev => Array.isArray(prev) ? prev.filter(o => o.table !== selectedTable) : []);
    setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p.table !== selectedTable) : []);
    setSelectedTable(null);
    
    alert(`Bill for Table ${selectedTable} marked as credit for ${guestName}.`);
  };

  const moveToNC = (tableId, itemId, source) => {
    if (!source) return;
    
    setActiveOrders(prev => {
      return prev.map(o => {
        if (o.table !== tableId) return o;
        const itemToMove = o.items.find(i => i.id === itemId);
        if (itemToMove) {
          const product = window.LUMINA_MENU.find(p => p.name === itemToMove.name);
          const ncItem = {
            id: `nc-${Date.now()}-${Math.random()}`,
            name: itemToMove.name,
            qty: itemToMove.qty,
            table: tableId,
            source,
            timestamp: Date.now(),
            costPrice: product ? product.costPrice : 0
          };
          setNcOrders(ncPrev => [...ncPrev, ncItem]);
          
          const newItems = o.items.map(i => i.id === itemId ? { ...i, status: 'nc', ncSource: source } : i);
          return { ...o, items: newItems };
        }
        return o;
      }).filter(o => o.items.length > 0);
    });
    alert(`Item moved to NC.`);
  };

  const confirmPayment = (paymentObj) => {
    if (!paymentObj) {
      console.error("confirmPayment called with null/undefined paymentObj");
      return;
    }

    if (paymentObj.method === 'cash') {
      setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p !== paymentObj) : []);
      setGlobalSales(prev => {
        if (!prev) return { totalRevenue: parseFloat(paymentObj.amount) || 0, ordersToday: 1 };
        return { ...prev, totalRevenue: (prev.totalRevenue || 0) + (parseFloat(paymentObj.amount) || 0), ordersToday: (prev.ordersToday || 0) + 1 };
      });
      setGlobalCustomers(prev => {
        if (!prev) return [];
        return prev.map(c => c.phone === paymentObj.customerPhone ? { ...c, points: (c.points || 0) + ((parseFloat(paymentObj.cashbackValue) || 0) * 10), visits: (c.visits || 0) + 1, lastVisit: 'Just now' } : c);
      });
      if (selectedTable === paymentObj.table) setSelectedTable(null);
      return;
    }

    setIsVerifyingUPI(true);
    setUpiTickerText('Verifying Payment...');
    
    setTimeout(() => {
      const amountStr = String(paymentObj.amount);
      const isDeterministicFailure = false; // Disabled deterministic failure
      
      if (isDeterministicFailure) {
        setUpiTickerText('Bank Server Down! NPCI Timeout.');
        setTimeout(() => {
          setIsVerifyingUPI(false);
          alert('UPI Payment Failed: Bank Server Down (NPCI Timeout). Please try again or use cash.');
        }, 1500);
      } else {
        setUpiTickerText('Payment Verified!');
        setTimeout(() => {
          setIsVerifyingUPI(false);
          setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p !== paymentObj) : []);
          setGlobalSales(prev => {
            if (!prev) return { totalRevenue: parseFloat(paymentObj.amount) || 0, ordersToday: 1 };
            return { ...prev, totalRevenue: (prev.totalRevenue || 0) + (parseFloat(paymentObj.amount) || 0), ordersToday: (prev.ordersToday || 0) + 1 };
          });
          setGlobalCustomers(prev => {
            if (!prev) return [];
            return prev.map(c => c.phone === paymentObj.customerPhone ? { ...c, points: (c.points || 0) + ((parseFloat(paymentObj.cashbackValue) || 0) * 10), visits: (c.visits || 0) + 1, lastVisit: 'Just now' } : c);
          });
          if (selectedTable === paymentObj.table) setSelectedTable(null);
        }, 1500);
      }
    }, 2000); // 2-second UPI delay
  };

  const renderTableDetailsPanel = () => {
    if (!selectedTable) return null;
    const tableOrders = activeOrders.filter(o => o.table === selectedTable);
    const tablePayment = pendingPayments.find(p => p.table === selectedTable);

    const isNC = selectedTable === 'NC';
    const subtotal = isNC ? 0 : tableOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((ordSum, item) => {
        const product = window.LUMINA_MENU.find(p => p.name === item.name);
        if (item.status === 'nc') return ordSum;
        return ordSum + (product ? product.price * item.qty : 0);
      }, 0);
    }, 0);
    const taxes = isNC ? 0 : Math.floor(subtotal * 0.15); // 5% GST + 10% SC

    return (
      <div className="fade-in" style={{ position: 'fixed', top: 'var(--header-h)', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '400px', background: 'var(--bg-dark)', height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2>{typeof selectedTable === 'string' ? `Tab: ${selectedTable}` : `Table ${selectedTable}`}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {tableOrders.length > 0 && (
                <button onClick={() => setIsShiftModalOpen(true)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}><i className="fa-solid fa-arrows-turn-to-dots"></i> Shift</button>
              )}
              {typeof selectedTable === 'string' && tableOrders.length === 0 && (
                <button onClick={() => { setCustomTabs(prev => prev.filter(t => t !== selectedTable)); setSelectedTable(null); }} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}><i className="fa-solid fa-trash"></i> Delete</button>
              )}
              <button onClick={() => setSelectedTable(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Running Tab</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Checkboxes removed as per directive */}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tableOrders.filter(order => {
              if (!isBarMode) return true;
              return order.items.some(i => window.LUMINA_MENU.find(p => p.name === i.name)?.category === 'Drinks & Cocktails');
            }).length === 0 ? <p>No {isBarMode ? 'drink ' : 'active '}tickets.</p> : tableOrders.filter(order => {
              if (!isBarMode) return true;
              return order.items.some(i => window.LUMINA_MENU.find(p => p.name === i.name)?.category === 'Drinks & Cocktails');
            }).map(order => {
              const validItems = isBarMode ? order.items.filter(i => window.LUMINA_MENU.find(p => p.name === i.name)?.category === 'Drinks & Cocktails') : order.items;
              return (
                <div key={order.id} style={{ marginBottom: '1rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {order.id}
                    </div>
                    {order.status === 'served' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}><i className="fa-solid fa-check-double"></i> SERVED</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'normal' }}>{order.status.toUpperCase()}</span>
                    )}
                  </div>
                  {Object.values(validItems.reduce((acc, curr) => {
                    const key = `${curr.name}-${curr.status}-${curr.notes || ''}`;
                    if (!acc[key]) acc[key] = { ...curr, qty: 0, ids: [] };
                    acc[key].qty += 1;
                    acc[key].ids.push(curr.id);
                    return acc;
                  }, {})).map((item, idx) => {
                    const product = window.LUMINA_MENU.find(p => p.name === item.name);
                    const pPrice = product ? product.price : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {item.status === 'new' ? (
                              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--bg-glass)' }}>
                                <button onClick={() => handleChangeQty(order.id, item, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '2px 8px', cursor: 'pointer' }}>-</button>
                                <span style={{ padding: '0 4px', fontSize: '0.9rem', minWidth: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                                <button onClick={() => handleChangeQty(order.id, item, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '2px 8px', cursor: 'pointer' }}>+</button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 'bold' }}>{item.qty}x</span>
                            )}
                            <span>{item.name}</span>
                          </div>
                          {item.notes && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px', marginLeft: item.status === 'new' ? '3.5rem' : '0' }}>Note: {item.notes}</span>}
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', marginLeft: item.status === 'new' ? '3.5rem' : '0' }}>₹{pPrice * item.qty}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => setSelectedItemForActions({ order, item })}
                            style={{ background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i> Actions
                          </button>
                          {item.status === 'cooking' && <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}><i className="fa-solid fa-fire fa-fade"></i> Prep</span>}
                          {item.status === 'served' && <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}><i className="fa-solid fa-check-double"></i> Done</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            
            {showNcItems && ncOrders.filter(o => o.table === selectedTable).length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1rem' }}>NC Items</h4>
                {ncOrders.filter(o => o.table === selectedTable).map((ncItem, idx) => (
                  <div key={ncItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{ncItem.qty}x</span> {ncItem.name}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({ncItem.source})</span>
                    </div>
                    <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>NC</div>
                  </div>
                ))}
              </div>
            )}
          </div>

            {serviceRequests.filter(r => r.table === selectedTable && r.type !== 'bill_request').map((req, idx) => {
              const isVIP = req.type === 'vip_alert';
              const bgColor = isVIP ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.1)';
              const borderColor = isVIP ? '#f59e0b' : '#3b82f6';
              const textColor = isVIP ? '#f59e0b' : '#3b82f6';
              const icon = isVIP ? 'fa-solid fa-crown' : 'fa-solid fa-bell';
              
              return (
                <div key={`req-${idx}`} style={{ background: bgColor, border: `1px solid ${borderColor}`, padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: textColor, fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}><i className={icon}></i> {isVIP ? 'VIP Alert' : 'Service Request'}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{isVIP ? req.message : (req.details ? `${req.type}: ${req.details}` : req.type)}</div>
                  </div>
                  <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', background: borderColor, color: isVIP ? '#000' : '#fff', fontSize: '0.8rem' }} onClick={() => setServiceRequests(prev => prev.filter(r => !(r.table === req.table && r.type === req.type)))}>
                    {isVIP ? 'Dismiss' : 'Resolve'}
                  </button>
                </div>
              );
            })}

          <div style={{ borderTop: '2px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            {serviceRequests.some(r => r.table === selectedTable && r.type === 'bill_request') && !activeBills.includes(selectedTable) ? (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1rem' }}><i className="fa-solid fa-receipt"></i> Bill Generation Requested</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Guest wants to check out. Approve to unlock checkout and lock their menu.</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setServiceRequests(prev => prev.filter(r => !(r.table === selectedTable && r.type === 'bill_request')))} style={{ flex: 1, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>NO (Reject)</button>
                  <button onClick={() => { setActiveBills(prev => [...prev, selectedTable]); setServiceRequests(prev => prev.filter(r => !(r.table === selectedTable && r.type === 'bill_request'))); }} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>YES (Approve)</button>
                </div>
              </div>
            ) : (
              !activeBills.includes(selectedTable) && tableOrders.length > 0 && typeof selectedTable !== 'string' && (
                <button className="btn-primary" style={{ marginBottom: '1rem', background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={() => { setActiveBills(prev => [...prev, selectedTable]); setServiceRequests(prev => prev.filter(r => !(r.table === selectedTable && r.type === 'bill_request'))); }}>
                  Generate & Send Bill to Guest
                </button>
              )
            )}

            {activeBills.includes(selectedTable) && typeof selectedTable !== 'string' && !tablePayment && (
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#8b5cf6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Customer is viewing the Checkout</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Force-close the table if they pay via offline methods:</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-primary" style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem', fontSize: '0.9rem' }} onClick={() => {
                    const validSubtotal = typeof subtotal === 'number' ? subtotal : 0;
                    const validTaxes = typeof taxes === 'number' ? taxes : 0;
                    setGlobalSales(prev => {
                      if (!prev) return { totalRevenue: validSubtotal + validTaxes, ordersToday: 1 };
                      return { ...prev, totalRevenue: (prev.totalRevenue || 0) + validSubtotal + validTaxes, ordersToday: (prev.ordersToday || 0) + 1 };
                    });
                    setActiveBills(prev => Array.isArray(prev) ? prev.filter(t => t !== selectedTable) : []);
                    setActiveOrders(prev => Array.isArray(prev) ? prev.filter(o => o.table !== selectedTable) : []);
                    setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p.table !== selectedTable) : []);
                    setSelectedTable(null);
                  }}>
                    <i className="fa-solid fa-money-bill-wave"></i> Paid (Cash)
                  </button>
                  <button className="btn-primary" style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem', fontSize: '0.9rem' }} onClick={() => {
                    const validSubtotal = typeof subtotal === 'number' ? subtotal : 0;
                    const validTaxes = typeof taxes === 'number' ? taxes : 0;
                    setGlobalSales(prev => {
                      if (!prev) return { totalRevenue: validSubtotal + validTaxes, ordersToday: 1 };
                      return { ...prev, totalRevenue: (prev.totalRevenue || 0) + validSubtotal + validTaxes, ordersToday: (prev.ordersToday || 0) + 1 };
                    });
                    setActiveBills(prev => Array.isArray(prev) ? prev.filter(t => t !== selectedTable) : []);
                    setActiveOrders(prev => Array.isArray(prev) ? prev.filter(o => o.table !== selectedTable) : []);
                    setPendingPayments(prev => Array.isArray(prev) ? prev.filter(p => p.table !== selectedTable) : []);
                    setSelectedTable(null);
                  }}>
                    <i className="fa-solid fa-qrcode"></i> Paid (UPI/Card)
                  </button>
                </div>
                
                {currentUserRole === 'manager' && (
                  <button className="btn-primary" style={{ marginTop: '1rem', background: '#8b5cf6', color: '#fff', border: 'none' }} onClick={handleMarkAsCredit}>
                    <i className="fa-solid fa-credit-card"></i> Mark as Credit
                  </button>
                )}
              </div>
            )}

            {/* Item Actions Modal */}
            {selectedItemForActions && (
              <div className="modal-overlay fade-in" onClick={() => setSelectedItemForActions(null)} style={{ backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedItemForActions.item.name}</h3>
                    <button onClick={() => setSelectedItemForActions(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Status: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{selectedItemForActions.item.status.toUpperCase()}</span>
                    </div>
                    
                    {selectedItemForActions.item.status === 'held' && (
                      <button onClick={() => {
                        setActiveOrders(prev => prev.map(o => o.id === selectedItemForActions.order.id ? { ...o, items: o.items.map(i => selectedItemForActions.item.ids.includes(i.id) ? { ...i, status: 'new', firedAt: Date.now() } : i) } : o));
                        setSelectedItemForActions(null);
                      }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-fire"></i> Fire to Kitchen
                      </button>
                    )}
                    
                    {selectedItemForActions.item.status === 'ready' && (
                      <button onClick={() => {
                        setActiveOrders(prev => prev.map(o => {
                          if (o.id !== selectedItemForActions.order.id) return o;
                          const newItems = o.items.map(i => selectedItemForActions.item.ids.includes(i.id) ? { ...i, status: 'served' } : i);
                          const newStatus = newItems.every(i => i.status === 'served') ? 'served' : o.status;
                          return { ...o, items: newItems, status: newStatus };
                        }));
                        setSelectedItemForActions(null);
                      }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-check"></i> Mark as Served
                      </button>
                    )}
                    
                    {selectedItemForActions.item.status !== 'nc' ? (
                      <button onClick={() => {
                        moveToNC(selectedTable, selectedItemForActions.item.ids[0], 'Staff Action');
                        setToastMessage(`Item marked as NC 🎁`);
                        setTimeout(() => setToastMessage(''), 3000);
                        setSelectedItemForActions(null);
                      }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-gift"></i> Mark as NC (Free)
                      </button>
                    ) : (
                      <button onClick={() => {
                        setActiveOrders(prev => prev.map(o => {
                          if (o.id !== selectedItemForActions.order.id) return o;
                          const newItems = o.items.map(i => i.id === selectedItemForActions.item.ids[0] ? { ...i, status: 'new' } : i);
                          return { ...o, items: newItems };
                        }));
                        setNcOrders(prev => prev.filter(o => !(o.table === selectedTable && o.name === selectedItemForActions.item.name)));
                        setSelectedItemForActions(null);
                      }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-undo"></i> Undo NC
                      </button>
                    )}
                    
                    <button onClick={() => { 
                      setActiveEditRow(selectedItemForActions.item.ids[0]); 
                      setSelectedItemForActions(null);
                    }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-edit"></i> Edit / Transfer
                    </button>
                    
                    <button onClick={() => { 
                      selectedItemForActions.item.ids.forEach(id => handleRemoveItem(selectedItemForActions.order.id, id)); 
                      setSelectedItemForActions(null);
                    }} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-trash"></i> Remove Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}><span>GST (5%)</span><span>₹{Math.floor(subtotal * 0.05)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}><span>Service Charge (10%)</span><span>₹{Math.floor(subtotal * 0.10)}</span></div>

            {tablePayment ? (
              <div style={{ background: '#111827', color: '#fff', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#f59e0b', marginBottom: '0.5rem' }}>PAYMENT {tablePayment.method === 'app' ? 'RECEIVED VIA APP' : 'REQUESTED IN CASH'}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>₹{tablePayment.amount}</div>
                {tablePayment.pointsRedeemed > 0 && <div style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>Points Redeemed: ₹{tablePayment.pointsRedeemed}</div>}
                {tablePayment.tip > 0 && <div style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem' }}>Includes ₹{tablePayment.tip} Tip ❤️</div>}
                <button className="btn-primary" style={{ background: '#10b981', color: '#fff' }} onClick={() => confirmPayment(tablePayment)}>
                  {tablePayment.method === 'app' ? 'Mark Settled' : 'Confirm Cash Received'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Current Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>₹{subtotal + taxes}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setIsAddMenuOpen(true)} className="btn-primary" style={{ padding: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <i className="fa-solid fa-plus"></i> Add Item
                  </button>

                </div>
                {selectedTable === 'NC' && tableOrders.length > 0 && (
                  <button onClick={() => {
                    setActiveOrders(prev => prev.filter(o => o.table !== 'NC'));
                    setSelectedTable(null);
                    alert(`NC Tab cleared.`);
                  }} className="btn-primary" style={{ padding: '1rem', fontSize: '1rem', background: '#ef4444', color: '#fff', border: 'none', marginTop: '0.5rem' }}>
                    <i className="fa-solid fa-trash-can"></i> Clear NC Tab
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Heartbeat calculation: if Table 7 is occupied (has unserved orders) and inactive for 30s
  const t7Orders = activeOrders.filter(o => o.table === 7);
  const t7IsActive = t7Orders.length > 0 && t7Orders.some(o => o.status !== 'served');
  const t7InactiveSeconds = Math.floor((now - lastTableInteraction) / 1000);
  const showHeartbeatPulse = t7IsActive && t7InactiveSeconds >= 30;

  return (
    <div className={isBarMode ? "" : "dashboard-view"} style={{ position: 'relative', height: isBarMode ? '100%' : 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
      {isVerifyingUPI && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }} className="fade-in">
          <div style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '2rem' }}></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{upiTickerText}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please wait, do not close this screen</div>
        </div>
      )}

      {isBarMode ? null : (
        <div className="dash-sidebar">
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary)' }}>Staff Hub</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Terminal 02</p>
          </div>
          <nav>
            <div className="nav-item active"><i className="fa-solid fa-chair"></i> Floor Map</div>
          </nav>
        </div>
      )}
      <div className="dash-main glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: isBarMode ? '#8b5cf6' : 'var(--primary)', marginBottom: '0.25rem', marginTop: 0 }}>
              {isBarMode ? <><i className="fa-solid fa-martini-glass"></i> Bar Tabs & Walk-ins</> : <><i className="fa-solid fa-users-viewfinder"></i> Staff Hub</>}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {isBarMode ? "Manage beverage tabs and punch in walk-in drink orders." : "Manage tables, process payments, and dispatch completed tickets."}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isBarMode && (
              <button className="jump-hover" onClick={onBackToKDS} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-arrow-left"></i> Back to KDS</button>
            )}
            <button onClick={() => {
              const newTabName = prompt("Enter Custom Tab Name (e.g., 'Shantanu'):");
              if (newTabName && newTabName.trim() !== '') {
                setCustomTabs(prev => [...prev, newTabName.trim()]);
              }
            }} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              <i className="fa-solid fa-plus"></i> Open Custom Tab
            </button>
          </div>
        </div>
        {/* Global Notification Header */}
        {serviceRequests.length > 0 && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', overflowX: 'auto' }}>
            <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-bell" style={{ color: 'var(--primary)' }}></i> Notifications:
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
              {serviceRequests.map((req, idx) => {
                const isVIP = req.type === 'vip_alert' || req.type === 'VIP Arrival ✨';
                const isBill = req.type === 'bill_request';
                const isStock = req.type === 'Inventory Alert';
                
                let bgColor = 'rgba(59, 130, 246, 0.1)';
                let borderColor = '#3b82f6';
                let textColor = '#fff';
                let icon = 'fa-solid fa-bell';
                
                if (isVIP) {
                  bgColor = 'rgba(245, 158, 11, 0.15)';
                  borderColor = '#f59e0b';
                  icon = 'fa-solid fa-crown';
                  textColor = '#f59e0b';
                } else if (isBill) {
                  bgColor = 'rgba(239, 68, 68, 0.15)';
                  borderColor = '#ef4444';
                  icon = 'fa-solid fa-receipt';
                  textColor = '#ef4444';
                } else if (isStock) {
                  bgColor = 'rgba(239, 68, 68, 0.15)';
                  borderColor = '#ef4444';
                  icon = 'fa-solid fa-boxes-stacked';
                  textColor = '#ef4444';
                }
                
                return (
                  <div key={idx} style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '20px', whiteSpace: 'nowrap', backdropFilter: 'blur(5px)' }}>
                    <span style={{ fontSize: '0.85rem', color: textColor, fontWeight: 'bold' }}><i className={icon} style={{ marginRight: '0.25rem' }}></i>T{req.table}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.details || req.message || req.note || req.type}</span>
                    <button 
                      onClick={() => setServiceRequests(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.25rem' }}
                    >
                      <i className="fa-solid fa-circle-check" style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manager Credit Ledger */}
        {currentUserRole === 'manager' && pendingCredits.length > 0 && (
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid #8b5cf6', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '0.5rem', fontSize: '1rem' }}><i className="fa-solid fa-credit-card"></i> Persistent Credit Ledger</h3>
            {pendingCredits.map((credit, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{credit.guest}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount: ₹{credit.amount} | Table {credit.table}</div>
                </div>
                <button className="btn-primary" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#10b981' }} onClick={() => setPendingCredits(prev => prev.filter((_, i) => i !== idx))}>Mark Settled</button>
              </div>
            ))}
          </div>
        )}
        



        {/* ACTION REQUIRED BANNERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

          {pendingPayments.map((p, idx) => (
            <div key={`pay-${idx}`} className="glass-panel" style={{ background: '#111827', color: '#fff', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedTable(p.table)}>
              <div>
                <div style={{ color: '#f59e0b', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}><i className="fa-solid fa-money-bill-wave"></i> Payment Requested</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.5rem 0' }}>Table {p.table}</div>
                <div style={{ color: '#9ca3af', fontSize: '1rem' }}>Amount: <strong>₹{p.amount}</strong> via <strong>{(p.method || '').toUpperCase()}</strong></div>
              </div>
              <button className="btn-primary" style={{ width: 'auto', padding: '1rem 2rem', background: '#10b981', color: '#fff' }} onClick={(e) => { e.stopPropagation(); confirmPayment(p); }}>
                Confirm Payment
              </button>
            </div>
          ))}




        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[...customTabs, ...Array.from({ length: 10 }, (_, i) => i + 1)].map((tNum, i) => {
            const tOrders = activeOrders.filter(o => o.table === tNum);
            const isOccupied = tOrders.length > 0;
            const tReadyItems = readyOrders.filter(o => o.table === tNum).flatMap(o => (o.items || []).filter(i => i.status === 'ready'));
            const hasReadyDrinks = tReadyItems.some(i => window.LUMINA_MENU.find(m => m.name === i.name)?.category === 'Drinks & Cocktails');
            const hasReadyFood = tReadyItems.some(i => window.LUMINA_MENU.find(m => m.name === i.name)?.category !== 'Drinks & Cocktails');
            const isPaying = pendingPayments.some(p => p.table === tNum);

            // The new "Customer is Viewing Bill" state (Purple insight)
            const isBillingRequest = serviceRequests.some(r => r.table === tNum && r.type === 'bill_request');
            const isBilling = activeBills.includes(tNum) && !isPaying;
            const isHeartbeatTarget = tNum === 7 && showHeartbeatPulse && !isPaying && !(hasReadyFood || hasReadyDrinks) && !isBilling && !isBillingRequest;
            const isVIPAlert = serviceRequests.some(r => r.table === tNum && r.type === 'vip_alert');
            const hasServiceRequest = serviceRequests.some(r => r.table === tNum && r.type !== 'bill_request' && r.type !== 'vip_alert');

            let bgColor = 'var(--bg-glass)';
            let color = 'var(--text-muted)';
            let icon = null;
            let pulseClass = '';
            let readyBadgeText = '';
            let badgeColor = '#ef4444';

            if (isPaying) { bgColor = '#f87171'; icon = <i className="fa-solid fa-money-bill"></i>; color = "#fff"; } // Red
            else if (isVIPAlert) { bgColor = '#f59e0b'; icon = <i className="fa-solid fa-crown"></i>; color = "#000"; pulseClass = "pulse-anim"; } // Gold for VIP
            else if (isBillingRequest) { bgColor = '#ef4444'; icon = <i className="fa-solid fa-receipt"></i>; color = "#fff"; pulseClass = "pulse-anim"; readyBadgeText = "🧾 BILL REQUESTED"; badgeColor = '#b91c1c'; }
            else if (isBilling) { bgColor = '#8b5cf6'; icon = <i className="fa-solid fa-mobile-screen"></i>; color = "#fff"; pulseClass = "pulse-anim"; } // Deep Purple (Viewing Bill)
            else if (isHeartbeatTarget) { bgColor = '#facc15'; icon = <i className="fa-solid fa-bell"></i>; color = "#000"; pulseClass = "pulse-anim"; } // Yellow (Call Waiter)
            else if (hasReadyFood && hasReadyDrinks) { bgColor = 'linear-gradient(135deg, #f59e0b, #0ea5e9)'; icon = <i className="fa-solid fa-bell-concierge"></i>; color = "#fff"; pulseClass = "pulse-anim"; readyBadgeText = "🔔 ALL READY"; }
            else if (hasReadyFood) { bgColor = '#f59e0b'; icon = <i className="fa-solid fa-fire-burner"></i>; color = "#fff"; pulseClass = "pulse-anim"; readyBadgeText = "🔔 FOOD READY"; }
            else if (hasReadyDrinks) { bgColor = '#0ea5e9'; icon = <i className="fa-solid fa-martini-glass"></i>; color = "#fff"; pulseClass = "pulse-anim"; readyBadgeText = "🔔 DRINK READY"; badgeColor = '#0284c7'; }
            // Removed service request notification from table card as per directive
            else if (isOccupied) { bgColor = '#4ade80'; icon = <i className="fa-solid fa-utensils"></i>; color = "#000"; } // Green
            else { bgColor = 'var(--bg-glass)'; color = 'var(--text-muted)'; }

            const tableIsActionable = isPaying || isBilling || isHeartbeatTarget || hasReadyDrinks || hasReadyFood || isBillingRequest || isVIPAlert || hasServiceRequest;

            return (
              <div key={i} className={`stat-card glass-panel ${pulseClass}`} style={{ position: 'relative', alignItems: 'center', textAlign: 'center', background: bgColor, color: color, border: bgColor === 'var(--bg-glass)' ? '1px dashed var(--glass-border)' : 'none', cursor: isOccupied || typeof tNum === 'string' || tableIsActionable ? 'pointer' : 'default', transition: 'all 0.2s', transform: tableIsActionable ? 'scale(1.02)' : 'scale(1)', boxShadow: tableIsActionable ? `0 10px 15px -3px ${(hasReadyFood || hasReadyDrinks) ? (hasReadyFood ? 'rgba(245,158,11,0.4)' : 'rgba(14,165,233,0.4)') : 'rgba(0,0,0,0.1)'}` : 'none' }} onClick={() => { if (isOccupied || typeof tNum === 'string' || tableIsActionable) setSelectedTable(tNum); }}>
                {readyBadgeText && <div className="pulse-anim" style={{ position: 'absolute', top: '-6px', right: '-6px', background: badgeColor, color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: '800', boxShadow: `0 2px 4px ${badgeColor}80`, zIndex: 10 }}>{readyBadgeText}</div>}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', color: color }}>{typeof tNum === 'string' ? tNum : `T${tNum}`}</h3>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '0.25rem', opacity: 0.9 }}>
                  {icon} {isPaying ? 'Checkout' : isVIPAlert ? 'VIP' : isHeartbeatTarget ? 'Service' : (hasReadyFood || hasReadyDrinks) ? 'Pickup' : isOccupied ? 'Active' : 'Empty'}
                </div>
                {tNum === 7 && table7Users.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '0.25rem' }}>
                    {table7Users.slice(0, 3).map((u, idx) => (
                      <div key={idx} style={{ width: '16px', height: '16px', borderRadius: '50%', background: u.color || 'var(--primary)', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {u.initials}
                      </div>
                    ))}
                    {table7Users.length > 3 && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{table7Users.length - 3}</div>}
                  </div>
                )}
                {isHeartbeatTarget && <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>Wait: {(t7InactiveSeconds / 60) > 30 ? '> 30m' : Math.floor(t7InactiveSeconds / 60) + 'm'}</div>}
              </div>
            )
          })}
        </div>
      </div>
      {renderTableDetailsPanel()}

      {/* STAFF MENU ORDER ENTRY MODAL */}
      {isAddMenuOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsAddMenuOpen(false)} style={{ backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '0', width: '90%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Add Item</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{typeof selectedTable === 'string' ? `Tab: ${selectedTable}` : `Table ${selectedTable}`}</p>
              </div>
              <button onClick={() => setIsAddMenuOpen(false)} style={{ background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--glass-border)' }} className="hide-scroll">
              {(isBarMode ? ['Drinks & Cocktails'] : ['All', ...new Set(window.LUMINA_MENU.map(m => m.category))]).map(cat => (
                <div key={cat} onClick={() => setMenuFilter(cat)} style={{ padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap', background: menuFilter === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: menuFilter === cat ? '#fff' : 'var(--text-muted)', fontWeight: menuFilter === cat ? 'bold' : 'normal', transition: 'all 0.2s' }}>
                  {cat}
                </div>
              ))}
            </div>

            {/* Items Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', alignContent: 'start' }}>
              {window.LUMINA_MENU.filter(m => (menuFilter === 'All' || m.category === menuFilter) && (!isBarMode || m.category === 'Drinks & Cocktails')).map(item => (
                <div key={item.id} onClick={(e) => handleAddNewItem(item, e)} className="glass-panel" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s', background: 'var(--bg-glass)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>₹{item.price}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>

                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-solid fa-plus"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isNcSourceModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => { setIsNcSourceModalOpen(false); setNcAction(null); }} style={{ backdropFilter: 'blur(5px)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.9)', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>Select NC Source</h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{ncAction?.type === 'add' ? ncAction.product?.name : 'Moving items to NC'}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {['DJ', 'PR', 'Staff', 'Guest'].map(source => (
                <button key={source} onClick={() => {
                  if (ncAction && ncAction.type === 'add') {
                    const newItem = { 
                      id: `nc-${Date.now()}-${Math.random()}`, 
                      name: ncAction.product.name, 
                      qty: 1, 
                      table: 'NC', 
                      source, 
                      timestamp: Date.now(), 
                      costPrice: ncAction.product.costPrice || 0 
                    };
                    setNcOrders(prev => [...prev, newItem]);
                  } else if (ncAction && ncAction.type === 'move') {
                    ncAction.itemIds.forEach(id => moveToNC(selectedTable, id, source));
                  }
                  setIsNcSourceModalOpen(false);
                  setNcAction(null);
                }} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {source}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" id="custom-nc-source" placeholder="Other source..." style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px' }} />
              <button onClick={() => {
                const customSource = document.getElementById('custom-nc-source').value;
                if (!customSource) return;
                if (ncAction && ncAction.type === 'add') {
                  const newItem = { 
                    id: `nc-${Date.now()}-${Math.random()}`, 
                    name: ncAction.product.name, 
                    qty: 1, 
                    table: 'NC', 
                    source: customSource, 
                    timestamp: Date.now(), 
                    costPrice: ncAction.product.costPrice || 0 
                  };
                  setNcOrders(prev => [...prev, newItem]);
                  alert(`${ncAction.product.name} added to NC for ${customSource}`);
                } else if (ncAction && ncAction.type === 'move') {
                  ncAction.itemIds.forEach(id => moveToNC(selectedTable, id, customSource));
                }
                setIsNcSourceModalOpen(false);
                setNcAction(null);
              }} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1rem' }}>Confirm</button>
            </div>
            
            <button onClick={() => setIsNcSourceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>Cancel</button>
          </div>
        </div>
      )}
      {isCreditModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => { setIsCreditModalOpen(false); setPendingCreditOrder(null); }} style={{ backdropFilter: 'blur(5px)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Create Credit Note</h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>For Order: {pendingCreditOrder?.id}</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="text" id="creditGuestName" placeholder="Guest Name" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1f2937', color: '#ffffff', fontSize: '0.9rem' }} />
              <input type="text" id="creditManagerNote" placeholder="Manager Note" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1f2937', color: '#ffffff', fontSize: '0.9rem' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setIsCreditModalOpen(false); setPendingCreditOrder(null); }} style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                const guestName = document.getElementById('creditGuestName').value;
                const managerNote = document.getElementById('creditManagerNote').value;
                if (!guestName) { alert("Guest Name is required"); return; }
                
                const orderSubtotal = pendingCreditOrder.items.reduce((sum, item) => {
                  const product = window.LUMINA_MENU.find(p => p.name === item.name);
                  return sum + (product ? product.price : 0);
                }, 0);
                const creditAmount = orderSubtotal + Math.floor(orderSubtotal * 0.15);
                
                const newCredit = {
                  id: `cr-${Date.now()}-${Math.random()}`,
                  guest: guestName,
                  amount: creditAmount,
                  timestamp: Date.now(),
                  note: managerNote,
                  table: selectedTable,
                  orderId: pendingCreditOrder.id
                };
                
                setPendingCredits(prev => [...prev, newCredit]);
                
                // Change table status to Vacant immediately by clearing orders
                setActiveOrders(prev => prev.filter(o => o.table !== selectedTable));
                
                setIsCreditModalOpen(false);
                setPendingCreditOrder(null);
                alert(`Credit Note created for ${guestName} (₹${creditAmount})`);
              }} style={{ flex: 1, padding: '0.75rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Credit</button>
            </div>
          </div>
        </div>
      )}

      {isShiftModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => { setIsShiftModalOpen(false); setTargetTable(''); }} style={{ backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Move Item / Table</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select a target to move items from {selectedTable}.</p>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {/* Table Grid */}
                {[...customTabs, ...Array.from({ length: 10 }, (_, i) => i + 1)].map((tNum) => {
                  const isOccupied = activeOrders.some(o => o.table === tNum);
                  return (
                    <div 
                      key={tNum}
                      onClick={() => { executeShiftTable(selectedTable, tNum); setIsShiftModalOpen(false); }}
                      style={{ 
                        background: isOccupied ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))' : 'rgba(255, 255, 255, 0.02)',
                        border: isOccupied ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                        padding: '1.25rem 0.5rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: isOccupied ? '#10b981' : 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '1rem', color: '#fff' }}>T{tNum}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{isOccupied ? 'Active' : 'Empty'}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => { setIsShiftModalOpen(false); setTargetTable(''); }} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY COUNT MODAL */}
      {isInventoryModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsInventoryModalOpen(false)} style={{ backdropFilter: 'blur(18px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Manual Inventory Count</h3>
              <button onClick={() => setIsInventoryModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.keys(inventoryLedger || {}).map(item => {
                const theoretical = inventoryLedger[item];
                const stock = theoretical ? theoretical.stock : 0;
                return (
                  <div key={item} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr 1fr', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{item}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Theo: {stock}</div>
                    <input type="number" placeholder="Phys" data-item={item} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-glass)', color: 'var(--text-main)' }} 
                      onChange={(e) => {
                        const phys = parseFloat(e.target.value);
                        if (!isNaN(phys)) {
                          const v = ((phys - stock) / stock) * 100;
                          document.getElementById(`variance-${item}`).innerText = `${v.toFixed(1)}%`;
                        }
                      }}
                    />
                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}>
                      <option>Unit Count</option>
                      <option>Weight Scale</option>
                      <option>Visual Estimate</option>
                    </select>
                    <div id={`variance-${item}`} style={{ fontWeight: 'bold', color: 'var(--primary)' }}>-%</div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setIsInventoryModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => {
                const inputs = document.querySelectorAll('input[placeholder="Phys"]');
                const newLedger = { ...inventoryLedger };
                inputs.forEach(input => {
                  const item = input.getAttribute('data-item');
                  const phys = parseFloat(input.value);
                  if (!isNaN(phys) && newLedger[item]) {
                    newLedger[item].stock = phys;
                  }
                });
                setInventoryLedger(newLedger);
                alert('Counts synced to Ground Truth');
                setIsInventoryModalOpen(false);
              }} className="btn-primary" style={{ flex: 1 }}>Sync to Ledger</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

window.StaffApp = StaffApp;
