// Import the 'qrcode' package to generate QR codes
const QRCode = require('qrcode');

// URL to encode in the QR code (your deployed app)
const url = 'https://planit-calendar.onrender.com';

// Output path for the QR image file
const outputPath = 'planit-qr.png';

// Configuration options for styling the QR code
const options = {
  color: {
    dark: '#000000',   
    light: '#ffffff',  
  },
  margin: 2,          
  width: 300,          
};

// Generate the QR code and save it to a file
QRCode.toFile(outputPath, url, options)
  .then(() => {
    console.log(`✅ QR code generated successfully at: ${outputPath}`);
  })
  .catch((error) => {
    console.error('❌ Failed to generate QR code:', error);
  });
