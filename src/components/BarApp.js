const { useState, useEffect, useMemo, useCallback } = React;

// --- 3.5 BAR DISPLAY SYSTEM ---
function BarApp(props) {
  const { activeOrders, setActiveOrders, unavailableItems, setUnavailableItems } = props;
  const [now, setNow] = useState(Date.now());
  const [barView, setBarView] = useState('kds'); // 'kds' or 'tabs'
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
        const isDrink = product && product.category === 'Drinks & Cocktails';
        return isDrink ? { ...it, status: newStatus } : it;
      });
      return { ...o, items: newItems };
    }));
  };

  const getSeverity = (createdAt) => {
    const diffSeconds = (now - createdAt) / 1000;
    if (diffSeconds > 40) return { level: 'critical', color: '#ef4444', text: 'Late' };
    if (diffSeconds > 20) return { level: 'warning', color: '#f59e0b', text: 'Waiting' };
    return { level: 'normal', color: '#8b5cf6', text: 'New' };
  };

  const formatTimer = (createdAt) => {
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderColumn = (statusKey, title, icon, emptyText) => {
    const orders = activeOrders.filter(o => getDomainStatus(o, true) === statusKey);
    return (
      <div className="kds-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        const ticketId = e.dataTransfer.getData('ticketId');
        if (ticketId) updateOrderStatus(ticketId, statusKey);
      }}>
        <div className="kds-col-header">
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
              return product && product.category === 'Drinks & Cocktails';
            });
            if (validItems.length === 0) return null; // Hide ticket if no drinks

            return (
              <div key={ticket.id} draggable onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket.id)} className={`ticket-card fade-in ${(isSeverityActive && (now - ticket.createdAt)/1000 > 720) ? 'pulse-critical' : ''}`} style={{ borderTop: isSeverityActive ? `4px solid ${sev.color}` : '' }}>
                <div className="ticket-header">
                  <span className="ticket-title" title={typeof ticket.table === 'string' ? ticket.table : `Table ${ticket.table}`}>
                    {typeof ticket.table === 'string' ? ticket.table : `Table ${ticket.table}`}
                  </span>
                  {isSeverityActive && <span className="status-badge" style={{ background: `${sev.color}1a`, color: sev.color, border: `1px solid ${sev.color}33`, padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>{sev.text}</span>}
                </div>
                <div className="ticket-meta">
                  <span className="ticket-id">{ticket.id}</span>
                  {isSeverityActive ? (
                    <span className="ticket-wait-badge" style={{ color: sev.color }}>
                      Wait {formatTimer(ticket.createdAt)}
                    </span>
                  ) : (
                    <span style={{ color: '#8b5cf6', fontWeight: '700' }}><i className="fa-solid fa-check"></i> Ready</span>
                  )}
                </div>
                <div style={{ flex: 1, marginTop: '0.25rem' }}>
                  {Object.values(validItems.reduce((acc, curr) => {
                    const key = `${curr.name}-${curr.status}`;
                    if (!acc[key]) acc[key] = { ...curr, qty: 0, ids: [] };
                    acc[key].qty += 1;
                    acc[key].ids.push(curr.id);
                    return acc;
                  }, {})).map((item, idx) => (
                    <div key={idx} className="ticket-item">
                      <div className="ticket-item-details">
                        <span className="ticket-item-name">
                          <span className="ticket-item-qty">{item.qty}x</span>{item.name}
                        </span>
                      </div>
                      <div className="ticket-actions">
                        <span className="ticket-status-text" style={{ color: item.status === 'cooking' ? '#8b5cf6' : item.status === 'ready' ? '#10b981' : item.status === 'nc' ? '#6b7280' : 'var(--text-muted)' }}>
                          {item.status === 'cooking' ? 'Mixing' : item.status === 'ready' ? 'Ready' : item.status === 'nc' ? 'NC' : 'New'}
                        </span>
                        {item.status === 'new' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-kds-action btn-kds-mix" onClick={() => updateItemStatus(ticket.id, item.ids, 'cooking')}>
                              <i className="fa-solid fa-martini-glass"></i> Mix
                            </button>
                            <button className="btn-kds-action btn-kds-pour" onClick={() => updateItemStatus(ticket.id, item.ids, 'ready')}>
                              <i className="fa-solid fa-check"></i> Pour
                            </button>
                          </div>
                        )}
                        {item.status === 'cooking' && (
                          <button className="btn-kds-action btn-kds-pour" onClick={() => updateItemStatus(ticket.id, item.ids, 'ready')}>
                            <i className="fa-solid fa-check"></i> Pour
                          </button>
                        )}
                        {item.status === 'ready' && <i className="fa-solid fa-check" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>}
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
      {barView === 'tabs' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="fade-in">
          {window.StaffApp && <window.StaffApp isBarMode={true} onBackToKDS={() => setBarView('kds')} {...props} />}
        </div>
      ) : (
        <div className="dash-main glass-panel fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#8b5cf6', marginTop: 0, marginBottom: '0.25rem' }}><i className="fa-solid fa-martini-glass"></i> Bar KDS</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage beverage queue. Food items are automatically routed to the Kitchen KDS.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={() => setIs86ModalOpen(true)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: 'auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-store-slash"></i> Availability
              </button>
              <button onClick={() => setBarView('tabs')} className="btn-primary" style={{ background: '#8b5cf6', border: 'none', fontSize: '0.9rem', width: 'auto', padding: '0.6rem 1rem' }}>
                <i className="fa-solid fa-cash-register"></i> Open Bar POS
              </button>
            </div>
          </div>
          <div className="kds-board">
            {renderColumn('new', 'New Drinks', 'fa-solid fa-martini-glass-empty', 'No new drink orders')}
            {renderColumn('cooking', 'Preparing', 'fa-solid fa-blender', 'Nothing currently mixing')}
            {renderColumn('ready', 'At Service Bar', 'fa-solid fa-bell-concierge', 'No drinks waiting')}
          </div>
        </div>
      )}

      {is86ModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIs86ModalOpen(false)} style={{ backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '0', width: '90%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}><i className="fa-solid fa-store-slash"></i> Manage Availability</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle bar items availability globally</p>
              </div>
              <button onClick={() => setIs86ModalOpen(false)} style={{ background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <input type="text" placeholder="Search beverages..." value={search86} onChange={(e) => setSearch86(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {window.LUMINA_MENU.filter(m => m.category === 'Drinks & Cocktails').filter(m => m.name.toLowerCase().includes(search86.toLowerCase())).map(item => {
                const is86d = unavailableItems.includes(item.name);
                return (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: is86d ? 'var(--bg-dark)' : 'var(--bg-glass)', border: is86d ? '1px dashed var(--glass-border)' : '1px solid var(--glass-border)', opacity: is86d ? 0.7 : 1 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: is86d ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: is86d ? 'line-through' : 'none' }}>{item.name}</div>
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

window.BarApp = BarApp;
