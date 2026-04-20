import React, { ReactNode } from "react";

interface TableProps {
    columns: string[];
    children: ReactNode;
}

export function Table({ columns, children }: TableProps) {
    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
}

export function TableRow({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${className}`}>
            {children}
        </tr>
    );
}

export function TableCell({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <td className={`px-6 py-4 ${className}`}>
            {children}
        </td>
    );
}
