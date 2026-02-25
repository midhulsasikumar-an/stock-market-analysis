import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Price_Chart from "../components/Price_Chart";
import Market_Summary from "../components/Market_Summary";
import Indicator_Charts from "../components/Indicator_Charts";
import Technical_Analysis from "../components/Technical_Analysis";
import StockDetailsPanel from "../components/StockDetailsPanel";
import Footer from "../components/Footer";
import { fetchCompanyProfile, fetchQuote, fetchCandles } from "../services/finnhub";

export default function StockPage() {
    const { symbol } = useParams();
    const [profile, setProfile] = useState(null);
    const [quote, setQuote] = useState(null);
    const [candles, setCandles] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!symbol) return;
            setLoading(true);
            try {
                const [p, q, c] = await Promise.all([
                    fetchCompanyProfile(symbol),
                    fetchQuote(symbol),
                    // Fetch 90 days daily for chart + technical analysis
                    fetchCandles(symbol, 'D', 90)
                ]);
                setProfile(p);
                setQuote(q);
                setCandles(c);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [symbol]);

    return (
        <div className="page p-md min-vh-100">
            {/* Back link */}
            <Link
                to="/dashboard"
                className="btn btn-glass btn-sm mb-3 text-decoration-none text-white d-inline-flex align-items-center gap-2"
            >
                <span>←</span> Back to Dashboard
            </Link>

            {/* Two-column layout */}
            <div className="row g-4">

                {/* LEFT: TradingView-style Candlestick Chart + Technicals */}
                <div className="col-lg-8 d-flex flex-column gap-3 pb-5">
                    <div className="bg-glass rounded-lg p-md">
                        {/* Compact company header */}
                        {quote && (
                            <div className="stock-page-info-bar mb-3">
                                <div className="spib-left">
                                    {profile?.logo && (
                                        <img
                                            src={profile.logo}
                                            alt={symbol}
                                            className="spib-logo"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div>
                                        <span className="spib-symbol">{symbol}</span>
                                        {profile?.name && (
                                            <span className="spib-name"> · {profile.name}</span>
                                        )}
                                        {profile?.exchange && (
                                            <span className="spib-exchange"> · {profile.exchange}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="spib-right">
                                    <span className="spib-price">${(quote.c ?? 0).toFixed(2)}</span>
                                    <span className={`spib-change ${(quote.dp ?? 0) >= 0 ? 'up' : 'down'}`}>
                                        {(quote.dp ?? 0) >= 0 ? '+' : ''}{(quote.d ?? 0).toFixed(2)}
                                        {' '}({(quote.dp ?? 0) >= 0 ? '+' : ''}{(quote.dp ?? 0).toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ★ TradingView-style Candlestick Chart */}
                        <Price_Chart
                            symbol={symbol}
                            candles={candles}
                            title="Price Chart"
                        />

                        {/* RSI + MACD secondary charts */}
                        <div className="mt-4 pt-4 border-top border-light-5">
                            <Indicator_Charts candles={candles} />
                        </div>

                        {/* Market Summary badges */}
                        <Market_Summary quote={quote} candles={candles} />
                    </div>

                    <div className="bg-glass rounded-lg p-md">
                        <Technical_Analysis symbol={symbol} quote={quote} candles={candles} />
                    </div>
                </div>

                {/* RIGHT: Details Panel */}
                <div className="col-lg-4 d-flex flex-column">
                    <StockDetailsPanel
                        symbol={symbol}
                        profile={profile}
                        quote={quote}
                        candles={candles}
                    />
                </div>
            </div>
        </div>
    );
}
