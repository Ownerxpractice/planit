
const QRCode = require('qrcode');

const url = 'https://planit-calendar.onrender.com';
const outputPath = 'planit-qr.png';

const options = {
  color: {
    dark: '#000000', 
    light: '#ffffff'  
  },
  margin: 2,
  width: 300,
};

QRCode.toFile(outputPath, url, options)
  .then(() => {
    console.log(`✅ QR code generated successfully at: ${outputPath}`);
  })
  .catch((error) => {
    console.error('Failed to generate QR code:', error);
  });
