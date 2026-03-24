import React from 'react';

/* ─────────────────────── BUTTON ─────────────────────── */
export const Button = ({ children, className = '', variant = 'default', size = 'default', ...props }) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--ring))] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
        default: 'bg-gradient-to-r from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] text-white shadow-lg shadow-[hsl(243,75%,59%)/0.25] hover:shadow-xl hover:shadow-[hsl(243,75%,59%)/0.35] hover:scale-[1.02] active:scale-[0.98]',
        outline: 'border-2 border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]',
        ghost: 'bg-transparent hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]',
        destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:scale-[1.02] active:scale-[0.98]',
        success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98]',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5',
        default: 'text-sm px-5 py-2.5',
        lg: 'text-base px-7 py-3',
    };

    return (
        <button className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`} {...props}>
            {children}
        </button>
    );
};

/* ─────────────────────── INPUT ─────────────────────── */
export const Input = ({ className = '', ...props }) => (
    <input
        className={`w-full px-4 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
    />
);

/* ─────────────────────── TEXTAREA ─────────────────────── */
export const Textarea = ({ className = '', ...props }) => (
    <textarea
        className={`w-full px-4 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-all duration-200 min-h-[100px] resize-y ${className}`}
        {...props}
    />
);

/* ─────────────────────── CARD ─────────────────────── */
export const Card = ({ children, className = '', glass = false, ...props }) => {
    const glassStyle = glass
        ? 'bg-white/70 dark:bg-[hsl(224,71%,7%)]/70 backdrop-blur-xl border border-white/20 dark:border-white/10'
        : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))]';

    return (
        <div className={`rounded-xl shadow-lg ${glassStyle} ${className}`} {...props}>
            {children}
        </div>
    );
};

/* ─────────────────────── LABEL ─────────────────────── */
export const Label = ({ children, className = '', ...props }) => (
    <label className={`block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5 ${className}`} {...props}>
        {children}
    </label>
);

/* ─────────────────────── SELECT ─────────────────────── */
export const Select = ({ className = '', children, ...props }) => (
    <select
        className={`w-full px-4 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-all duration-200 cursor-pointer ${className}`}
        {...props}
    >
        {children}
    </select>
);

/* ─────────────────────── TABLE ─────────────────────── */
export const Table = ({ children, className = '', ...props }) => (
    <div className="overflow-x-auto w-full rounded-lg">
        <table className={`min-w-full text-sm ${className}`} {...props}>
            {children}
        </table>
    </div>
);

/* ─────────────────────── ALERT ─────────────────────── */
export const Alert = ({ children, className = '', variant = 'info', ...props }) => {
    const variants = {
        info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        error: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };

    return (
        <div className={`px-4 py-3 rounded-lg border text-sm font-medium ${variants[variant] || variants.info} ${className}`} {...props}>
            {children}
        </div>
    );
};

/* ─────────────────────── BADGE ─────────────────────── */
export const Badge = ({ children, className = '', variant = 'default', ...props }) => {
    const variants = {
        default: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
        primary: 'bg-[hsl(243,75%,59%)/0.15] text-[hsl(243,75%,59%)]',
        success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        destructive: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.default} ${className}`} {...props}>
            {children}
        </span>
    );
};

/* ─────────────────────── STAT CARD ─────────────────────── */
export const StatCard = ({ label, value, icon, color = 'primary' }) => {
    const gradients = {
        primary: 'linear-gradient(to right, hsl(243,75%,59%), hsl(262,83%,58%))',
        success: 'linear-gradient(to right, #10b981, #16a34a)',
        warning: 'linear-gradient(to right, #f59e0b, #f97316)',
        info: 'linear-gradient(to right, #06b6d4, #3b82f6)',
    };

    const iconBg = {
        primary: 'from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)]',
        success: 'from-emerald-500 to-green-600',
        warning: 'from-amber-500 to-orange-500',
        info: 'from-cyan-500 to-blue-500',
    };

    return (
        <Card className="p-5 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</p>
                    <p className="text-3xl font-bold mt-1"
                        style={{ backgroundImage: gradients[color] || gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {value}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
};

/* ─────────────────────── SPINNER ─────────────────────── */
export const Spinner = ({ className = '' }) => (
    <div className={`w-5 h-5 border-2 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))] rounded-full animate-spin ${className}`} />
);

/* ─────────────────────── MODAL ─────────────────────── */
export const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] p-6 w-full max-w-lg mx-4 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1 rounded-lg hover:bg-[hsl(var(--secondary))]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

/* ─────────────────────── SPRINT DATE UTILITY ─────────────────────── */
/**
 * Parse "Sprint YY-WW" → approximate Date (Jan 1 of year + WW*14 days).
 * Returns null for unrecognised formats.
 */
export const sprintToDate = (sprintId) => {
    if (!sprintId) return null;
    const match = String(sprintId).match(/(\d{2})-(\d{2})/);
    if (!match) return null;
    const year = 2000 + parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + (week - 1) * 14);
    return d;
};

/* ─────────────────────── TIME RANGE TOGGLE ─────────────────────── */
/**
 * Segmented button strip.
 * Props: value ('sprint'|'3mo'|'1yr'), onChange(value)
 */
export const TimeRangeToggle = ({ value, onChange }) => {
    const options = [
        { key: 'sprint', label: 'Last Sprint' },
        { key: '3mo',    label: 'Last 3 Months' },
        { key: '1yr',    label: 'Last 1 Year' },
    ];
    return (
        <div className="inline-flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            {options.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                        value === key
                            ? 'bg-gradient-to-r from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)] text-white'
                            : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

/* ─────────────────────── STORY DETAIL MODAL ─────────────────────── */
/**
 * Read-only detail panel for a story.
 * Props: story (object | null), onClose ()
 * Dismissed by: X, backdrop click, or Escape key.
 */
export const StoryDetailModal = ({ story, onClose }) => {
    React.useEffect(() => {
        if (!story) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [story, onClose]);

    if (!story) return null;

    const Field = ({ label, value, mono = false, wide = false }) => (
        <div className={wide ? 'col-span-2' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
            {value
                ? <p className={`text-sm break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
                : <p className="text-sm text-[hsl(var(--muted-foreground))]">—</p>}
        </div>
    );

    const stateColorClass = (state) => {
        switch (state) {
            case 'Active':   return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
            case 'Resolved': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
            case 'Closed':   return 'bg-[hsl(243,75%,59%)/0.15] text-[hsl(243,75%,59%)]';
            case 'Removed':  return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
            default:         return 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-[hsl(var(--border))] flex-shrink-0">
                    <div>
                        <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] mb-1">Work Item #{story.story_id}</p>
                        <h3 className="text-lg font-bold leading-tight pr-4">{story.title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                                {story.work_item_type}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${stateColorClass(story.state)}`}>
                                {story.state ?? '—'}
                            </span>
                            {story.team_name && (
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">• {story.team_name}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1.5 rounded-lg hover:bg-[hsl(var(--secondary))] flex-shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
                {/* Scrollable body */}
                <div className="overflow-y-auto p-6 flex-1">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        <Field label="Sprint"        value={story.sprint_id} />
                        <Field label="Assigned To"   value={story.assigned_to} />
                        <Field label="Tags"          value={story.tags} />
                        <Field label="Team"          value={story.team_name} />
                        <Field label="Test Plan URL" value={story.test_plan_url} mono wide />
                        <Field label="Test Run URL"  value={story.test_run_url}  mono wide />
                        <Field label="Status / Remarks" value={story.status_remarks} wide />
                        <Field label="Created"      value={story.created_at ? new Date(story.created_at).toLocaleString() : null} />
                        <Field label="Last Updated" value={story.updated_at ? new Date(story.updated_at).toLocaleString() : null} />
                    </div>
                </div>
            </div>
        </div>
    );
};
