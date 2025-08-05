// app/api/upload/route.js
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// Función para subir un archivo individual a Cloudinary
const uploadFileToCloudinary = async (file) => {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determinar el tipo de recurso (imagen/video)
    const resourceType = file.type.startsWith('image/') ? 'image' : 'video';

    const result = await cloudinary.uploader.upload(`data:${file.type};base64,${buffer.toString('base64')}`, {
      folder: 'disenador-ia-uploads', // Usamos la carpeta de nuestro proyecto
      resource_type: resourceType
    });

    return {
      mediaUrl: result.secure_url,
      mediaType: resourceType
    };
  } catch (error) {
    console.error('Error al subir archivo a Cloudinary:', error);
    return null;
  }
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    // La imagen del usuario se espera en el campo 'file'
    const file = formData.get('file');
     console.log('Recibido en el backend. Valor de "file":', file)

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se encontró ningún archivo para subir.' }, { status: 400 });
    }

    const uploadResult = await uploadFileToCloudinary(file);

    if (!uploadResult || !uploadResult.mediaUrl) {
      return NextResponse.json({ success: false, error: 'Fallo al subir el archivo a Cloudinary.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mediaUrl: uploadResult.mediaUrl,
      mediaType: uploadResult.mediaType,
      message: 'Archivo subido exitosamente.'
    }, { status: 200 });

  } catch (error) {
    console.error('Error general en la API de subida:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar la subida del archivo', details: error.message },
      { status: 500 }
    );
  }
}