
/**
 * Compresses an image file using HTML5 Canvas.
 * 
 * @param file - The source File object.
 * @param quality - The quality of the output image (0 to 1). Defaults to 0.8.
 * @param maxWidth - The maximum width of the output image. Defaults to 1600px.
 * @returns Promise<File> - The compressed File object.
 */
export const compressImage = async (file: File, quality = 0.8, maxWidth = 1600): Promise<File> => {
  // Skip compression for small files (e.g., < 500KB) to avoid overhead
  if (file.size < 1024 * 500) {
      return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Canvas context is null'));
            return;
        }
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output type
        // Prefer original type if supported, otherwise fallback to JPEG
        let outputType = file.type;
        if (outputType !== 'image/png' && outputType !== 'image/jpeg' && outputType !== 'image/webp') {
            outputType = 'image/jpeg';
        }

        // 'toBlob' quality parameter applies to image/jpeg and image/webp
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
