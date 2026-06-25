import React from 'react';

interface Props {
    title: string;
    description: string;
}

export default function ErpModulePlaceholder({ title, description }: Props) {
    return (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">{title}</h2>
            <p className="text-slate-500 font-bold">{description}</p>
        </div>
    );
}
