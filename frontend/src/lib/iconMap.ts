/**
 * Obsidian Luxe Icon Map
 *
 * Maps semantic icon names to Lucide React components.
 * Use this instead of importing icons by name across the codebase so that
 * icon changes are centralised.
 *
 * Material Symbols Outlined (rendered via <span className="material-symbols-outlined">)
 * is available for decorative/editorial use. Prefer Lucide for interactive UI elements.
 */

export {
    // Navigation
    LayoutDashboard as IconDashboard,
    ScanLine       as IconAnalyze,
    Shirt          as IconWardrobe,
    ShoppingBag    as IconFeed,
    Camera         as IconScanner,
    Users          as IconCommunity,
    Bell           as IconPriceAlerts,
    User           as IconAccount,
    // Actions
    Upload         as IconUpload,
    Share2         as IconShare,
    Heart          as IconWishlist,
    Search         as IconSearch,
    Settings       as IconSettings,
    LogOut         as IconLogOut,
    ChevronRight   as IconChevronRight,
    ChevronLeft    as IconChevronLeft,
    X              as IconClose,
    Check          as IconCheck,
    Plus           as IconPlus,
    Trash2         as IconTrash,
    Edit2          as IconEdit,
    // Content
    Sparkles       as IconAI,
    Palette        as IconPalette,
    Star           as IconStar,
    ShoppingCart   as IconCart,
    Tag            as IconTag,
    Filter         as IconFilter,
    ArrowLeft      as IconBack,
    ArrowRight     as IconForward,
    ExternalLink   as IconExternal,
    Copy           as IconCopy,
    // Status
    AlertCircle    as IconAlert,
    CheckCircle2   as IconSuccess,
    Info           as IconInfo,
    Loader2        as IconSpinner,
    // Media
    Image          as IconImage,
    ImagePlus      as IconAddImage,
    Zap            as IconZap,
    // Auth
    Mail           as IconMail,
    Lock           as IconLock,
    Eye            as IconEye,
    EyeOff         as IconEyeOff,
    // Layout
    Menu           as IconMenu,
    Grid3x3        as IconGrid,
    List           as IconList,
} from 'lucide-react';

/**
 * Helper to render a Material Symbol icon inline.
 * Usage: <MaterialIcon name="auto_awesome" className="text-primary" />
 */
export function materialIconClass(name: string): string {
    return `material-symbols-outlined ${name}`;
}
