import Stock_Header from "../components/Stock_Header";
import Price_Section from "../components/Price_Section";
import Price_Chart from "../components/Price_Chart";
import Technical_Analysis from "../components/Technical_Analysis";
import Company_Info from "../components/Company_Info";

export default function StockPage() {
    return (
        <div className="page p-lg">
            <Stock_Header />

            <div className="grid grid-2-1 gap-lg">
                <main className="flex-col gap-md">
                    <div className="bg-glass rounded-lg p-md">
                        <Price_Section />
                        <Price_Chart />
                    </div>

                    <div className="bg-glass rounded-lg p-md">
                        <Technical_Analysis />
                    </div>
                </main>

                <aside>
                    <div className="bg-glass rounded-lg p-md h-full">
                        <Company_Info />
                    </div>
                </aside>
            </div>
        </div>
    );
}
