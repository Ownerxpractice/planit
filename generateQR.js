// generateQR.js

const QRCode = require('qrcode');

// Replace this with your Render app URL or a specific calendar link
const url = 'https://planit-calendar.onrender.com';

QRCode.toFile('planit-qr.png', url, {
  color: {
    dark: '#000', 
    light: '#FFF'  
  }
}, function (err) {
  if (err) throw err;
  console.log('✅ QR code saved as planit-qr.png');
});
