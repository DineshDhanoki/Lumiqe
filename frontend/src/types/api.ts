/**
 * Lumiqe — Shared API Response Types.
 *
 * Canonical TypeScript interfaces for all backend API responses.
 * Import these instead of defining inline types in components.
 */

// ─── User & Auth ────────────────────────────────────────────

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    is_premium: boolean;
    is_admin: boolean;
    email_verified: boolean;
    free_scans_left: number;
    credits: number;
    trial_ends_at: string | null;
    season: string | null;
    palette: string[] | null;
    age: number | null;
    sex: string | null;
    body_shape: string | null;
    style_personality: string | null;
    quiz_completed_at: string | null;
    referral_code: string | null;
    referral_count: number;
    created_at: string;
}

export interface AuthResponse {
    user: UserProfile;
    access_token: string;
    refresh_token: string;
}

// ─── Analysis ───────────────────────────────────────────────

export interface AnalysisResult {
    id: number;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    palette: string[];
    avoid_colors: string[];
    contrast_level: string;
    style_archetype: string;
    signature_color_name: string;
    metal: string;
    celebrity_match?: CelebrityMatch;
    description?: string;
    created_at: string;
}

export interface CelebrityMatch {
    name: string;
    season: string;
    image_url: string;
    similarity_score: number;
}

// ─── Products ───────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    brand: string;
    price: string;
    price_cents?: number;
    currency?: string;
    image_url: string;
    purchase_link: string;
    match_score: number;
    category: string;
    season: string;
    color_hex?: string;
    is_locked?: boolean;
    is_placeholder?: boolean;
    is_sponsored?: boolean;
    sponsor_label?: string;
}

export interface ProductCatalogResponse {
    products: Product[];
    is_placeholder: boolean;
    total: number;
}

// ─── Daily Outfit ───────────────────────────────────────────

export interface DailyOutfitItem {
    slot: string;
    name: string;
    brand: string;
    image_url: string;
    color_hex: string;
    purchase_link: string;
}

export interface DailyOutfitResponse {
    items: DailyOutfitItem[];
    generated_at: string;
    season: string;
}

// ─── Chat ───────────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    reply: string;
    season: string;
}

// ─── Wishlist ───────────────────────────────────────────────

export interface WishlistItem {
    id: number;
    product_id: string;
    product_name: string;
    product_brand: string;
    product_price: string;
    product_image: string;
    product_url: string;
    match_score: number;
    created_at: string;
}

// ─── API Error ──────────────────────────────────────────────

export interface ApiError {
    error: string;
    detail: string;
    code: number;
}

// ─── Share ──────────────────────────────────────────────────

export interface ShareData {
    season: string;
    hex_color: string;
    undertone: string;
    palette: string[];
    confidence: number;
    description: string;
    created_at: string;
}
