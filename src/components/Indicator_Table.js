import React from 'react'

export default function Indicator_Table() {
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
                        <td>RSI</td>
                        <td>62</td>
                        <td className="text-warning">Neutral</td>
                    </tr>
                    <tr>
                        <td>MACD</td>
                        <td>+1.2</td>
                        <td className="text-success">Bullish</td>
                    </tr>
                    <tr>
                        <td>MA (50)</td>
                        <td>—</td>
                        <td className="text-success">Buy</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
