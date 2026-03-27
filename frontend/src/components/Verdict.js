import React from 'react'

export default function Verdict({ analysis }) {
    const decision = analysis?.decision || "ANALYZING...";
    const confidence = analysis?.confidence || "---";
    const color = analysis?.signalColor || "text-muted";

    return (
        <div className="mt-lg">
            <p className="section-title">Overall Analysis</p>
            <h1 className={`${color} text-3xl font-bold`}>{decision}</h1>
            <p className="text-muted text-sm">
                Confidence: {confidence}
            </p>
        </div>
    )
}
