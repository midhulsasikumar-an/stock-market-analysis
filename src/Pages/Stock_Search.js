import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Stock_Header from "../components/Stock_Header";
import Price_Section from "../components/Price_Section";
import Price_Chart from "../components/Price_Chart";
import Technical_Analysis from "../components/Technical_Analysis";
import Company_Info from "../components/Company_Info";
import Stock_Insights from "../components/Stock_Insights";
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
        <div className="page p-lg">
            <Link to="/dashboard" className="btn btn-glass btn-sm mb-md text-decoration-none text-white d-inline-flex align-items-center gap-2">
                <span>←</span> Back to Dashboard
            </Link>
            <Stock_Header symbol={symbol} profile={profile} />

            <div className="grid grid-2-1 gap-lg">
                <main className="flex-col gap-md">
                    <div className="bg-glass rounded-lg p-md">
                        <Price_Section symbol={symbol} quote={quote} />
                        <Price_Chart symbol={symbol} candles={candles} />
                    </div>

                    <div className="bg-glass rounded-lg p-md">
                        {/* Pass shared candles data to Technical Analysis */}
                        <Technical_Analysis symbol={symbol} quote={quote} candles={candles} />
                    </div>
                </main>

                <aside>
                    <div className="bg-glass rounded-lg p-md h-full">
                        <Company_Info profile={profile} />
                    </div>
                </aside>
            </div>

            {/* Market & User Insights Section */}
            <Stock_Insights symbol={symbol} />

            <Footer />
        </div>
    );
}

// ----------------------------------------------------------------------
// TEMPORARY DEBUGGING UTILITY
// ----------------------------------------------------------------------

