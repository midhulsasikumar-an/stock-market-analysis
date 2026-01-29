import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Price_Section from "../components/Price_Section";
import Price_Chart from "../components/Price_Chart";
import Market_Snapshot from "../components/Market_Snapshot";
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
                    // Fetch 60 days of data at "D" resolution for Technical Analysis
                    fetchCandles(symbol, 'D', 60)
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

    if (loading) {
        return <div className="page p-lg text-white">Loading...</div>; // Minimal loading state
    }

    return (
        <div className="page p-md h-100 overflow-hidden">
            <Link to="/dashboard" className="btn btn-glass btn-sm mb-3 text-decoration-none text-white d-inline-flex align-items-center gap-2">
                <span>←</span> Back to Dashboard
            </Link>

            {/* Main Layout Grid: Left (Charts) - Right (Details Panel) */}
            <div className="row g-4 h-100">

                {/* LEFT COLUMN: Charts & Technicals (Scrollable independently if needed, or page scroll) */}
                <div className="col-lg-8 d-flex flex-column gap-3 pb-5">
                    <div className="bg-glass rounded-lg p-md">
                        {/* Market Snapshot - Compact info bar */}
                        <Market_Snapshot quote={quote} profile={profile} />

                        {/* Note: Price_Section might be redundant if the Right Panel has the main price info, 
                            BUT per instructions: "Main price chart on the left remains unchanged" 
                            and typically Price_Section is small. I'll keep it for now but it might duplicate header info. 
                            Actually, the user said "Redesign the stock detail page to include a single... right-side card... 
                            without changing the existing UI theme, layout...". 
                            So I will keep the left side mostly as is. 
                        */}
                        <Price_Section symbol={symbol} quote={quote} />

                        {/* Main Price Chart with Indicator Toggles */}
                        <Price_Chart symbol={symbol} candles={candles} />

                        {/* Secondary Indicator Charts (RSI, MACD) */}
                        <div className="mt-4 pt-4 border-top border-light-5">
                            <Indicator_Charts candles={candles} />
                        </div>

                        {/* Market Summary - Trend/Momentum/Volatility badges */}
                        <Market_Summary quote={quote} candles={candles} />
                    </div>

                    <div className="bg-glass rounded-lg p-md">
                        {/* Pass shared candles data to Technical Analysis */}
                        <Technical_Analysis symbol={symbol} quote={quote} candles={candles} />
                    </div>
                </div>

                {/* RIGHT COLUMN: New Consolidated Details Panel */}
                <div className="col-lg-4" style={{ height: 'calc(100vh - 100px)' }}> // Fixed height to allow scrolling inside panel
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

// ----------------------------------------------------------------------
// TEMPORARY DEBUGGING UTILITY
// ----------------------------------------------------------------------

