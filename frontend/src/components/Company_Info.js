import React from 'react'


export default function Company_Info({ profile }) {
    if (!profile) {
        return (
            <div className="h-full flex-center text-muted text-sm">
                Loading company profile...
            </div>
        );
    }

    // Helper to format large numbers (Market Cap)
    const formatMarketCap = (mCap) => {
        if (!mCap) return "---";
        // Finnhub returns market cap in Millions usually
        const billions = mCap / 1000;
        return billions.toFixed(2) + "B";
    };

    const InfoRow = ({ label, value, isLink = false }) => (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-10">
            <span className="text-secondary text-xs text-uppercase letter-spacing-wide">{label}</span>
            {isLink && value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm text-decoration-none hover-underline text-end"
                >
                    Visit Website
                </a>
            ) : (
                <span className="text-white text-sm fw-medium text-end">{value || "---"}</span>
            )}
        </div>
    );

    return (
        <div className="d-flex flex-column h-100">
            <div className="d-flex align-items-center gap-3 mb-4">
                {profile.logo && (
                    <img
                        src={profile.logo}
                        alt={`${profile.name} logo`}
                        style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                )}
                <div>
                    <h3 className="section-title mb-0">{profile.name}</h3>
                    <span className="text-muted text-xs">{profile.ticker}</span>
                </div>
            </div>

            <div className="d-flex flex-column gap-1 flex-grow-1">
                <InfoRow label="Sector" value={profile.finnhubIndustry} />
                <InfoRow label="Country" value={profile.country} />
                <InfoRow label="Exchange" value={profile.exchange} />
                <InfoRow label="IPO Date" value={profile.ipo} />
                <InfoRow label="Market Cap" value={formatMarketCap(profile.marketCapitalization)} />
                <InfoRow label="Website" value={profile.weburl} isLink={true} />
            </div>
        </div>
    )
}
