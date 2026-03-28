import React from 'react';

export function formatMoney(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
    });
}

export function formatCompact(value) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(Number(value || 0));
}

export function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

export function AdminPageHeader({ eyebrow, title, description, actions }) {
    return (
        <div className="admin-page-header">
            <div>
                {eyebrow ? <div className="admin-eyebrow">{eyebrow}</div> : null}
                <h1>{title}</h1>
                {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="admin-page-actions">{actions}</div> : null}
        </div>
    );
}

export function AdminPanel({ title, subtitle, actions, children, className = '' }) {
    return (
        <section className={`admin-panel ${className}`.trim()}>
            {(title || subtitle || actions) && (
                <div className="admin-panel-header">
                    <div>
                        {title ? <h2>{title}</h2> : null}
                        {subtitle ? <p>{subtitle}</p> : null}
                    </div>
                    {actions ? <div className="admin-panel-actions">{actions}</div> : null}
                </div>
            )}
            {children}
        </section>
    );
}

export function AdminStatCard({ label, value, tone = 'default', helper }) {
    return (
        <div className={`admin-stat-card admin-stat-${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
            {helper ? <small>{helper}</small> : null}
        </div>
    );
}

export function AdminStatusPill({ value, tone }) {
    const normalized = String(value || '').toLowerCase();
    const kind = tone || (normalized.includes('active') || normalized.includes('connected') || normalized.includes('online') || normalized.includes('enabled')
        ? 'success'
        : normalized.includes('suspend') || normalized.includes('failed') || normalized.includes('critical') || normalized.includes('disabled')
            ? 'danger'
            : normalized.includes('warning') || normalized.includes('connecting')
                ? 'warning'
                : 'neutral');

    return <span className={`admin-pill admin-pill-${kind}`}>{value}</span>;
}

export function AdminEmptyState({ title, description }) {
    return (
        <div className="admin-empty-state">
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
        </div>
    );
}