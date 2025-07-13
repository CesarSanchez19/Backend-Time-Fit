// libs/resizeImage.js
import sharp from 'sharp';
export async function resizeBase64Image(base64Image, options = {}) {
  const { width = 300, height = null, quality = 80 } = options;

  try {
    // Separar metadata de imagen
    const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) throw new Error('Formato base64 no válido');
    const [, mimeType, data] = matches;

    const buffer = Buffer.from(data, 'base64');

    // Redimensionar con sharp
    const resizedBuffer = await sharp(buffer)
      .resize({ width, height }) // height opcional
      .jpeg({ quality }) // convertir a JPEG para compresión
      .toBuffer();

    const resizedBase64 = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${resizedBase64}`;
  } catch (err) {
    console.error('Error al redimensionar imagen:', err.message);
    throw err;
  }
}
