const { useState, useEffect } = React;

function WelcomeScreen({ nameInput, setNameInput, phoneInput, setPhoneInput, handleScanLogin }) {
  return (
    <div className="screen-welcome fade-in flex-col-full" style={{ padding: '2rem 1.5rem', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <i className="fa-solid fa-qrcode" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Table 7 Scanned</h3>
        <p style={{ color: 'var(--text-muted)' }}>Please enter your details to view the menu and start ordering.</p>
      </div>
      <div className="input-group" style={{ marginBottom: '1rem' }}>
        <label>Full Name</label>
        <input type="text" placeholder="e.g. Rahul Sharma" value={nameInput} onChange={e => setNameInput(e.target.value)} />
      </div>
      <div className="input-group" style={{ marginBottom: '2rem' }}>
        <label>Phone Number</label>
        <input type="tel" placeholder="10-digit mobile" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
      </div>
      <button className="btn-primary" onClick={handleScanLogin}>View Menu & Order</button>
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;
