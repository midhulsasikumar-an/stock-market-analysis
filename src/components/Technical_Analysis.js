import TrendRow from "./Trend_Row";
import IndicatorsTable from "./Indicator_Table";
import Verdict from "./Verdict";
import React from "react";

export default function TechnicalAnalysis() {
    return (
        <section className="d-flex flex-column gap-md mt-lg">
            <h3 className="section-border-left text-muted text-xs text-uppercase letter-spacing-wide font-medium mb-sm">Technical Analysis</h3>

            <TrendRow />
            <IndicatorsTable />
            <Verdict />
        </section>
    );
}
