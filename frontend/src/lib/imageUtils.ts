/** Compress an image to JPEG ≤ maxBytes using canvas. */
export function compressImage(file: File, maxBytes = 1.5 * 1024 * 1024): Promise<File> {
    return new Promise((resolve) => {
        if (file.size <= maxBytes) { resolve(file); return; }
        const img = new Image();
        img.onload = () => {
            const MAX_DIM = 2048;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                const scale = MAX_DIM / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
                    } else {
                        resolve(file);
                    }
                },
                'image/jpeg',
                0.8,
            );
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}

/** Create a small base64 JPEG thumbnail and store in sessionStorage for the results page. */
export function storeThumbnail(file: File): void {
    const img = new Image();
    img.onload = () => {
        const MAX = 400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
            const scale = MAX / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            sessionStorage.setItem('lumiqe-analysis-photo', dataUrl);
        } catch { /* ignore quota errors */ }
    };
    img.onerror = () => { /* ignore */ };
    img.src = URL.createObjectURL(file);
}
