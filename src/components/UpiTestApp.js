const { useState } = React;

function UpiTestApp() {
  const [testState, setTestState] = useState('idle');
  const [vpa, setVpa] = useState('BHARATPE.8K0P1W2Z8F54661@fbpe');
  const [amount, setAmount] = useState('10.00');
  const [name, setName] = useState('hardik agrahari');



  return (
    <div className="hub-container fade-in" style={{ background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 1.5rem', textAlign: 'center', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>

        <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <i className="fa-solid fa-mobile-screen" style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
        </div>

        <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Pay ₹{amount}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Test the native UPI integration. Enter your details below.
        </p>

        {testState === 'idle' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>UPI ID (VPA)</label>
              <input type="text" value={vpa} onChange={(e) => setVpa(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }} placeholder="example@upi" />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Amount (INR)</label>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }} placeholder="10.00" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Payee Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }} placeholder="Name" />
            </div>

            <a
              href={window.upiHelper.getUpiLink('gpay', vpa, amount, 'UPI Test Transaction', name)}
              className="btn-primary"
              style={{ display: 'flex', width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', background: '#fff', color: '#333', border: '1px solid #ddd', textDecoration: 'none', fontWeight: 'bold', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setTimeout(() => setTestState('success'), 2000)}
            >
              <i className="fa-brands fa-google" style={{ color: '#4285F4' }}></i> Pay via GPay
            </a>

            <a
              href={window.upiHelper.getUpiLink('phonepe', vpa, amount, 'UPI Test Transaction', name)}
              className="btn-primary"
              style={{ display: 'flex', width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', background: '#5f259f', textDecoration: 'none', fontWeight: 'bold', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setTimeout(() => setTestState('success'), 2000)}
            >
              Pay via PhonePe
            </a>

            <a
              href={window.upiHelper.getUpiLink('paytm', vpa, amount, 'UPI Test Transaction', name)}
              className="btn-primary"
              style={{ display: 'flex', width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', background: '#00baf2', textDecoration: 'none', fontWeight: 'bold', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setTimeout(() => setTestState('success'), 2000)}
            >
              Pay via Paytm
            </a>

            <a
              href={window.upiHelper.getUpiLink('upi', vpa, amount, 'UPI Test Transaction', name)}
              className="btn-primary"
              style={{ display: 'flex', width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', background: '#111', textDecoration: 'none', fontWeight: 'bold', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setTimeout(() => setTestState('success'), 2000)}
            >
              <i className="fa-solid fa-qrcode"></i> Choose Other App
            </a>
          </div>
        ) : (
          <div className="fade-in">
            <i className="fa-solid fa-circle-check" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}></i>
            <h3 style={{ color: '#10b981', margin: 0 }}>Intent Dispatched!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Your native app should have opened.</p>
            <button className="btn-secondary" onClick={() => setTestState('idle')} style={{ marginTop: '1.5rem', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontWeight: 'bold' }}>Run Test Again</button>
          </div>
        )}

      </div>
    </div>
  );
}

window.UpiTestApp = UpiTestApp;
