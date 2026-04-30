import { useState } from "react";

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
}

function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="bg-gray-100 rounded overflow-hidden">
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-200 transition-colors focus:outline-none"
            >
                <span className="text-sm font-semibold text-gray-700">{title}</span>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {!collapsed && (
                <div className="p-2 pt-0 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleSection;