import React from 'react'

export default function Indicator_Table({ data }) {
    if (!data) return null; // Or render loading state

    const getSignal = (val, ref, isBullishIfGreater = true) => {
        if (val === null || val === undefined) return "---";
        const isBullish = isBullishIfGreater ? val > ref : val < ref;
        return (
            <span className={isBullish ? "text-success" : "text-danger"}>
                {isBullish ? "Bullish" : "Bearish"}
            </span>
        );
    };

    const getRSISignal = (rsi) => {
        if (!rsi) return "---";
        if (rsi > 70) return <span className="text-danger">Overbought</span>;
        if (rsi < 30) return <span className="text-success">Oversold</span>;
        return <span className="text-secondary">Neutral</span>;
    };

    return (
        <div>
            <table className="table-glass mt-md">
                <thead>
                    <tr className="text-muted text-sm">
                        <th>Indicator</th>
                        <th>Value</th>
                        <th>Signal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>SMA (5)</td>
                        <td>{data.sma5?.toFixed(2)}</td>
                        <td>{getSignal(data.current, data.sma5)}</td>
                    </tr>
                    <tr>
                        <td>SMA (20)</td>
                        <td>{data.sma20?.toFixed(2)}</td>
                        <td>{getSignal(data.current, data.sma20)}</td>
                    </tr>
                    <tr>
                        <td>RSI (14)</td>
                        <td>{data.rsi?.toFixed(2)}</td>
                        <td>{getRSISignal(data.rsi)}</td>
                    </tr>
                    <tr>
                        <td>7D High</td>
                        <td>{data.max7?.toFixed(2)}</td>
                        <td className="text-secondary">Level</td>
                    </tr>
                    <tr>
                        <td>7D Low</td>
                        <td>{data.min7?.toFixed(2)}</td>
                        <td className="text-secondary">Level</td>
                    </tr>
                    <tr>
                        <td>7D Change</td>
                        <td>{data.change7?.toFixed(2)}%</td>
                        <td className={data.change7 >= 0 ? "text-success" : "text-danger"}>
                            {data.change7 >= 0 ? "Bullish" : "Bearish"}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
