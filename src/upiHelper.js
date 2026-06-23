window.upiHelper = {
  // 2026 Mandate: tr must be exactly 35 chars, alphanumeric only.
  generateTr: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tr = '';
    for (let i = 0; i < 35; i++) {
      tr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tr;
  },

  getUpiLink: (scheme, merchantVpa, amountStr) => {
    // 1. IDENTITY ALIGNMENT: Must be ALL CAPS to match the bank record
    const payeeName = 'BHARATPE MERCHANT'; 
    const note = 'PAY TO BHARATPE MERCHANT';
    
    const tr = window.upiHelper.generateTr();
    const referralUrl = encodeURIComponent('https://cyb-434188587-dot-cybage-qa.uc.r.appspot.com/');
    
    // 2. 2026 METADATA: 
    // - orgid=180001 is BharatPe's standard ID for verified web intents.
    // - mc=0000 is default, but adding 'mode=02' is mandatory for static web triggers.
    // - purpose=00 is for standard merchant payments.
    let baseUrl = `pay?pa=${merchantVpa}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(note)}&mc=0000&tr=${tr}&mode=02&purpose=00&orgid=180001&url=${referralUrl}`;
    
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      const packages = {
        gpay: 'com.google.android.apps.nbu.paisa.user',
        phonepe: 'com.phonepe.app',
        paytm: 'net.one97.paytm'
      };
      
      if (packages[scheme]) {
        // Android forced intent - adding 'S.browser_fallback_url' is a 2026 safety requirement
        return `intent://${baseUrl}#Intent;scheme=upi;package=${packages[scheme]};S.browser_fallback_url=${referralUrl};end`;
      }
    } else if (isIOS) {
      const schemes = { gpay: 'gpay://upi/', phonepe: 'phonepe://', paytm: 'paytmmp://' };
      return `${schemes[scheme]}${baseUrl}`;
    }
    
    return `upi://${baseUrl}`;
  }
};