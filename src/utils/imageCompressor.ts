/**
 * Utility to compress and resize images client-side before uploading or saving to Firestore/localStorage.
 * Prevents Firestore document size errors (1MB limit) by scaling down high-resolution images.
 */
export function compressImage(
  file: File,
  maxWidth: number = 320,
  maxHeight: number = 320,
  quality: number = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        resolve("");
        return;
      }
      compressBase64Image(src, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(src));
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a Base64 data URL string or raw Base64 string to JPEG with target dimensions and quality
 */
export function compressBase64Image(
  base64Src: string,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.45
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Src || typeof base64Src !== "string") {
      resolve("");
      return;
    }

    // If it's a standard web URL (http/https), don't compress
    if (base64Src.startsWith("http://") || base64Src.startsWith("https://")) {
      resolve(base64Src);
      return;
    }

    // If string is already tiny (< 15KB), return as is
    if (base64Src.length < 15000) {
      resolve(base64Src);
      return;
    }

    let formattedSrc = base64Src;
    if (!base64Src.startsWith("data:")) {
      formattedSrc = `data:image/jpeg;base64,${base64Src}`;
    }

    let isSettled = false;
    const done = (res: string) => {
      if (!isSettled) {
        isSettled = true;
        resolve(res);
      }
    };

    // 2 second safety timeout
    const timeoutId = setTimeout(() => {
      done(base64Src);
    }, 2000);

    try {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement("canvas");
          let width = img.width || maxWidth;
          let height = img.height || maxHeight;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            done(base64Src);
            return;
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", quality);
          // Only use compressed if it actually reduced the size
          if (compressed && compressed.length < base64Src.length) {
            done(compressed);
          } else {
            done(base64Src);
          }
        } catch (e) {
          done(base64Src);
        }
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        done(base64Src);
      };
      img.src = formattedSrc;
    } catch (e) {
      clearTimeout(timeoutId);
      done(base64Src);
    }
  });
}

