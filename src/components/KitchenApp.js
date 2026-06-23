const { useState, useEffect, useMemo, useCallback } = React;

// --- 3. KITCHEN DISPLAY SYSTEM ---
function KitchenApp({ activeOrders, setActiveOrders, unavailableItems, setUnavailableItems, setNcOrders }) {
  const [now, setNow] = useState(Date.now());
  const [kdsTab, setKdsTab] = useState('dine_in'); // 'dine_in' or 'online_orders'
  const [is86ModalOpen, setIs86ModalOpen] = useState(false);
  const [search86, setSearch86] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getDomainStatus = (ticket, isDrinkDomain) => {
    const validItems = ticket.items.filter(item => {
      if (item.status === 'held') return false;
      const product = window.LUMINA_MENU.find(p => p.name === item.name);
      return isDrinkDomain ? (product && product.category === 'Drinks & Cocktails') : (product && product.category !== 'Drinks & Cocktails');
    });
    if (validItems.length === 0) return 'none';
    if (validItems.every(i => i.status === 'served')) return 'served';
    if (validItems.every(i => i.status === 'ready' || i.status === 'served')) return 'ready';
    if (validItems.some(i => i.status === 'cooking' || i.status === 'ready' || i.status === 'served')) return 'cooking';
    return 'new';
  };

  const updateItemStatus = (orderId, targetIds, newStatus) => {
    setActiveOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map(i => targetIds.includes(i.id) ? { ...i, status: newStatus } : i);
      return { ...o, items: updatedItems };
    }));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setActiveOrders(prev => prev.map(o => {
      if (String(o.id) !== String(orderId)) return o;
      const newItems = (o.items || []).map(it => {
        const product = window.LUMINA_MENU.find(p => p.name === it.name);
        const isFood = product && product.category !== 'Drinks & Cocktails';
        return isFood ? { ...it, status: newStatus } : it;
      });
      return { ...o, items: newItems };
    }));
  };

  const getSeverity = (createdAt) => {
    const diffSeconds = (now - createdAt) / 1000;
    if (diffSeconds > 720) return { level: 'critical', color: '#ef4444', text: 'Late (12m+)' };
    if (diffSeconds > 360) return { level: 'warning', color: '#f59e0b', text: 'Waiting' };
    return { level: 'normal', color: 'var(--primary)', text: 'New' };
  };

  const formatTimer = (createdAt) => {
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderColumn = (statusKey, title, icon, emptyText) => {
    const orders = activeOrders.filter(o => getDomainStatus(o, false) === statusKey);
    return (
      <div className="kds-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        const ticketId = e.dataTransfer.getData('ticketId');
        if (ticketId) updateOrderStatus(ticketId, statusKey);
      }}>
        <div className={`kds-col-header ${statusKey === 'cooking' ? 'steam-header' : ''}`}>
          <span><i className={icon}></i> {title}</span>
          <span className="status-badge">{orders.length}</span>
        </div>
        <div className="kds-col-body">
          {orders.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>{emptyText}</div>}
          {orders.map(ticket => {
            const sev = getSeverity(ticket.createdAt);
            const isSeverityActive = statusKey !== 'ready';

            const validItems = ticket.items.filter(item => {
              if (item.status === 'held') return false;
              const product = window.LUMINA_MENU.find(p => p.name === item.name);
              return product && product.category !== 'Drinks & Cocktails';
            });
            if (validItems.length === 0) return null;

            const getEarliestFiredAt = (items) => {
              const firedItems = items.filter(i => i.firedAt);
              if (firedItems.length > 0) return Math.min(...firedItems.map(i => i.firedAt));
              return null;
            };
            const earliestFired = getEarliestFiredAt(validItems);
            const baseTime = earliestFired || ticket.createdAt;

            return (
              <div key={ticket.id} draggable onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket.id)} className={`ticket-card fade-in ${(isSeverityActive && (now - baseTime)/1000 > 720) ? 'pulse-critical' : ''}`} style={{ border: '1px solid var(--glass-border)', borderTop: isSeverityActive ? `4px solid ${getSeverity(baseTime).color}` : '1px solid var(--glass-border)', cursor: 'grab', background: (isSeverityActive && (now - baseTime)/1000 > 720) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.8)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="ticket-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={typeof ticket.table === 'string' ? ticket.table : `Table ${ticket.table}`}>
                    {typeof ticket.table === 'string' ? ticket.table : `Table ${ticket.table}`}
                  </span>
                  {isSeverityActive && <span className="status-badge" style={{ background: `${getSeverity(baseTime).color}1a`, color: getSeverity(baseTime).color, border: `1px solid ${getSeverity(baseTime).color}33`, padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>{getSeverity(baseTime).text}</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace' }}>{ticket.id}</span>
                  {isSeverityActive ? (
                    <span style={{ fontWeight: '700', padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', color: getSeverity(baseTime).color, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {earliestFired ? 'Fired ' : 'Wait '}{formatTimer(baseTime)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}><i className="fa-solid fa-check"></i> Ready</span>
                  )}
                </div>
                <div style={{ flex: 1, marginTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.5rem' }}>
                  {Object.values(validItems.reduce((acc, curr) => {
                    const key = `${curr.name}-${curr.status}-${curr.notes || ''}`;
                    if (!acc[key]) acc[key] = { ...curr, qty: 0, ids: [] };
                    acc[key].qty += 1;
                    acc[key].ids.push(curr.id);
                    return acc;
                  }, {})).map((item, idx) => (
                    <div key={idx} className="ticket-item" style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}><strong>{item.qty}x</strong> {item.name} <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}><i className="fa-solid fa-check"></i> Stock Deducted</span></span>
                        {item.notes && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '2px' }}>Note: {item.notes}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: item.status === 'cooking' ? '#f59e0b' : item.status === 'ready' ? '#10b981' : item.status === 'nc' ? '#6b7280' : 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {item.status === 'cooking' ? 'Cooking' : item.status === 'ready' ? 'Ready' : item.status === 'nc' ? 'NC' : 'New'}
                        </span>
                        {item.status !== 'ready' && item.status !== 'served' && (
                          <button onClick={() => updateItemStatus(ticket.id, [item.ids[0]], 'ready')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            Done
                          </button>
                        )}
                        {item.status === 'ready' && <i className="fa-solid fa-check" style={{ color: '#10b981' }}></i>}
                        {item.status === 'served' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><i className="fa-solid fa-check-double"></i> Served</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-view" style={{ position: 'relative' }}>
      <div className="dash-main glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#d97706', marginBottom: '0.5rem' }}><i className="fa-solid fa-fire"></i> Kitchen KDS</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setKdsTab('dine_in')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: kdsTab === 'dine_in' ? '#d97706' : 'rgba(255,255,255,0.05)', color: kdsTab === 'dine_in' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Dine-In Tickets</button>
              <button onClick={() => setKdsTab('online_orders')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: kdsTab === 'online_orders' ? '#ef4444' : 'rgba(255,255,255,0.05)', color: kdsTab === 'online_orders' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Online Orders</button>
            </div>
          </div>
          <div>
            <button onClick={() => setIs86ModalOpen(true)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: 'auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-store-slash"></i> Availability
            </button>
          </div>
        </div>

        {kdsTab === 'dine_in' ? (
          <div className="kds-board fade-in">
            <div className="discard-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              const ticketId = e.dataTransfer.getData('ticketId');
              if (ticketId) {
                const ticket = activeOrders.find(o => String(o.id) === String(ticketId));
                if (ticket) {
                  ticket.items.forEach(item => {
                    const product = window.LUMINA_MENU.find(p => p.name === item.name);
                    const ncItem = {
                      id: `nc-${Date.now()}-${Math.random()}`,
                      name: item.name,
                      qty: item.qty,
                      table: ticket.table,
                      source: 'Staff',
                      timestamp: Date.now(),
                      costPrice: product ? product.costPrice : 0
                    };
                    setNcOrders(prev => [...prev, ncItem]);
                  });
                  setActiveOrders(prev => prev.filter(o => String(o.id) !== String(ticketId)));
                  alert(`Ticket ${ticketId} moved to NC.`);
                }
              }
            }} style={{ width: '60px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--glass-border)', borderRadius: '12px 0 0 12px' }}>
              <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-trash"></i> DISCARD / NC
              </div>
            </div>
            {renderColumn('new', 'New Orders', 'fa-solid fa-inbox', 'No new incoming orders')}
            {renderColumn('cooking', 'Cooking', 'fa-solid fa-fire-burner', 'Nothing currently cooking')}
            {renderColumn('ready', 'Ready for Pickup', 'fa-solid fa-bell-concierge', 'No food waiting for pickup')}
          </div>
        ) : (
          <div className="kds-board fade-in">
            <div className="kds-col" style={{ borderTop: '4px solid #ef4444' }}>
              <div className="kds-col-header" style={{ color: '#ef4444' }}><span><i className="fa-solid fa-motorcycle"></i> Zomato (New)</span><span className="status-badge" style={{ background: '#ef4444', color: '#fff' }}>0</span></div>
              <div className="kds-col-body"><div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No active Zomato orders</div></div>
            </div>
            <div className="kds-col" style={{ borderTop: '4px solid #f97316' }}>
              <div className="kds-col-header" style={{ color: '#f97316' }}><span><i className="fa-solid fa-motorcycle"></i> Swiggy (New)</span><span className="status-badge" style={{ background: '#f97316', color: '#fff' }}>0</span></div>
              <div className="kds-col-body"><div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No active Swiggy orders</div></div>
            </div>
            <div className="kds-col" style={{ borderTop: '4px solid #10b981' }}>
              <div className="kds-col-header" style={{ color: '#10b981' }}><span><i className="fa-solid fa-box"></i> Packing & Handover</span><span className="status-badge" style={{ background: '#10b981', color: '#fff' }}>0</span></div>
              <div className="kds-col-body"><div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No orders ready for riders</div></div>
            </div>
          </div>
        )}
      </div>

      {is86ModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIs86ModalOpen(false)} style={{ backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '0', width: '90%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}><i className="fa-solid fa-store-slash"></i> Manage Availability</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle item availability globally</p>
              </div>
              <button onClick={() => setIs86ModalOpen(false)} style={{ background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <input type="text" placeholder="Search menu items..." value={search86} onChange={(e) => setSearch86(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {window.LUMINA_MENU.filter(m => m.category !== 'Drinks & Cocktails').filter(m => m.name.toLowerCase().includes(search86.toLowerCase())).map(item => {
                const is86d = unavailableItems.includes(item.name);
                return (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: is86d ? 'var(--bg-dark)' : 'var(--bg-glass)', border: is86d ? '1px dashed var(--glass-border)' : '1px solid var(--glass-border)', opacity: is86d ? 0.7 : 1 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: is86d ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: is86d ? 'line-through' : 'none' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.category}</div>
                    </div>
                    <button className="btn-primary" onClick={() => {
                      if (is86d) {
                        setUnavailableItems(prev => prev.filter(n => n !== item.name));
                      } else {
                        setUnavailableItems(prev => [...prev, item.name]);
                      }
                    }} style={{ width: 'auto', padding: '0.4rem 1rem', background: is86d ? 'var(--bg-glass)' : 'var(--primary)', color: is86d ? 'var(--text-main)' : '#fff', border: is86d ? '1px solid var(--text-muted)' : 'none', borderRadius: '20px', fontSize: '0.85rem' }}>
                      {is86d ? 'Make Available' : 'Mark Unavailable'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

window.KitchenApp = KitchenApp;
