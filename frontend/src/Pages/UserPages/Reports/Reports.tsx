import React from "react";

const Reports = () => {
    const pdfUrl = "/Lab02.pdf"; 

    return (
        <div className="w-full px-4 pt-2 pb-4">   
            <div className="bg-[#D1D5DB] shadow-xl p-4 rounded-xl border border-gray-200 w-full h-[85vh] flex flex-col gap-3">

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold m-0 text-[#2D2A8C]">
                        Customer Summary Report
                    </h2>

                    <a
                        href={pdfUrl}
                        download="Customer-Summary-Report.pdf"
                        className="px-4 py-2 bg-[#2D2A8C] text-white rounded-lg hover:bg-[#1F1C6A] transition"
                    >
                        Download 
                    </a>
                </div>

                <iframe
                    src={pdfUrl + "#toolbar=0"}
                    className="w-full h-full border rounded-lg"
                    allow="fullscreen"
                    title="PDF Viewer"
                ></iframe>
            </div>
        </div>
    );
};

export default Reports;
