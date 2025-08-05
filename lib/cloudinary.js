// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary se configura automáticamente usando CLOUDINARY_URL si está presente
// De lo contrario, puedes proporcionar un valor predeterminado o lanzar un error
cloudinary.config(process.env.CLOUDINARY_URL ?? " "); // Lo mismo que tenías en tu ejemplo

export default cloudinary;