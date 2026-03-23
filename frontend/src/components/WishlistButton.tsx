'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
    productId: string;
    productName: string;
    productBrand: string;
    productPrice: string;
    productImage: string;
    productUrl: string;
    matchScore?: number;
}

function WishlistButtonInner({
    productId,
    productName,
    productBrand,
    productPrice,
    productImage,
    productUrl,
    matchScore,
}: WishlistButtonProps) {
    const [wishlisted, setWishlisted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function checkWishlistStatus() {
            try {
                const response = await fetch(
                    `/api/proxy/wishlist/check/${productId}`
                );
                if (!response.ok) return;
                const data = await response.json();
                if (!cancelled) {
                    setWishlisted(Boolean(data.wishlisted));
                }
            } catch {
                // Silently fail — default to not wishlisted
            }
        }

        checkWishlistStatus();

        return () => {
            cancelled = true;
        };
    }, [productId]);

    const toggleWishlist = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        const previousState = wishlisted;
        // Optimistic update
        setWishlisted(!previousState);

        try {
            if (previousState) {
                const response = await fetch(
                    `/api/proxy/wishlist/${productId}`,
                    { method: 'DELETE' }
                );
                if (!response.ok) {
                    setWishlisted(previousState);
                }
            } else {
                const response = await fetch('/api/proxy/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId,
                        productName,
                        productBrand,
                        productPrice,
                        productImage,
                        productUrl,
                        matchScore,
                    }),
                });
                if (!response.ok) {
                    setWishlisted(previousState);
                }
            }
        } catch {
            // Revert on network error
            setWishlisted(previousState);
        } finally {
            setLoading(false);
        }
    }, [
        loading,
        wishlisted,
        productId,
        productName,
        productBrand,
        productPrice,
        productImage,
        productUrl,
        matchScore,
    ]);

    return (
        <button
            type="button"
            onClick={toggleWishlist}
            disabled={loading}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110 hover:bg-white disabled:opacity-50"
        >
            <Heart
                className={`h-4 w-4 transition-colors ${
                    wishlisted
                        ? 'fill-red-500 text-red-500'
                        : 'fill-none text-gray-600'
                }`}
            />
        </button>
    );
}

const WishlistButton = React.memo(WishlistButtonInner);
export default WishlistButton;
