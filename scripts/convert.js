const fs = require('fs');
const { promisify } = require('util');
const heicConvert = require('heic-convert');
const path = require('path');

const inputPath = 'C:\\Users\\Akash\\OneDrive\\IAMAKASH\\753231857_18063056312754012_1768840762731265703_n.heic';
const outputPath = path.join(__dirname, '..', 'public', 'akash.jpg');

async function convert() {
  try {
    const inputBuffer = fs.readFileSync(inputPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'JPEG',      // output format
      quality: 0.9           // the jpeg compression quality, between 0 and 1
    });

    fs.writeFileSync(outputPath, outputBuffer);
    console.log('Conversion successful!');
  } catch (err) {
    console.error('Error converting HEIC:', err);
  }
}

convert();
