'use client';

import { WIZARD_CONFIG, FieldDef, SubCategory } from '@/app/dashboard/client/projects/new/wizard-config';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Ruler, FileText, Layers, Tag } from 'lucide-react';

interface SpecsViewerProps {
    specs: any;
    className?: string;
}

export function SpecsViewer({ specs, className }: SpecsViewerProps) {
    console.log("SpecsViewer rendering:", specs);

    if (!specs || Object.keys(specs).length === 0) {
        return <div className="text-slate-400 italic text-sm">Aucune spécification technique.</div>;
    }

    // 1. Resolve Category & SubCategory from Config
    let matchedSub: SubCategory | undefined;

    // Try explicit match first
    let matchedCat = WIZARD_CONFIG.find(c => c.label === specs.category || c.id === specs.category);

    if (matchedCat) {
        matchedSub = matchedCat.subcategories.find(s => s.label === specs.subcategory || s.id === specs.subcategory);
    } else {
        // Fallback search by subcategory label/id across all cats
        for (const cat of WIZARD_CONFIG) {
            const found = cat.subcategories.find(s => s.label === specs.subcategory || s.id === specs.subcategory);
            if (found) {
                matchedSub = found;
                matchedCat = cat;
                break;
            }
        }
    }

    // 2. Identify fields to display
    const displayFields = matchedSub?.fields || [];
    const usedKeys = new Set(['category', 'subcategory']); // Keys to exclude from generic list if handled

    return (
        <Card className={`border-slate-100 shadow-sm ${className}`}>
            <CardHeader className="pb-3 bg-slate-50/50">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Spécifications Techniques
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">

                {/* Header Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {specs.category && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            {specs.category}
                        </Badge>
                    )}
                    {specs.subcategory && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {specs.subcategory}
                        </Badge>
                    )}
                </div>

                <Separator />

                {/* Dynamic Fields from Config */}
                {displayFields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        {displayFields.map(field => {
                            const value = specs[field.name];
                            if (value === undefined || value === null || value === '') return null;
                            usedKeys.add(field.name);

                            return (
                                <div key={field.name} className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-medium uppercase mb-1">
                                        {field.label}
                                    </span>
                                    <span className="text-slate-700 font-medium text-sm flex items-center gap-1">
                                        {field.type === 'number' && <Ruler className="w-3 h-3 text-slate-400" />}
                                        {String(value)} {field.suffix && <span className="text-slate-400 text-xs ml-0.5">{field.suffix}</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                {/* Remaining / Extra Fields (Custom or Legacy) */}
                <div className="space-y-3 mt-4">
                    {Object.entries(specs).map(([key, value]) => {
                        if (usedKeys.has(key)) return null;

                        let displayValue = String(value);
                        if (typeof value === 'object' && value !== null) {
                            displayValue = JSON.stringify(value);
                        }

                        return (
                            <div key={key} className="flex flex-col border-t border-slate-50 pt-2">
                                <span className="text-xs text-slate-400 font-medium uppercase mb-1">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-slate-700 font-medium text-sm break-words">
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>



                {/* Raw Data Toggle (For Debug / Admin Safety) */}
                <div className="pt-4 mt-2 border-t border-slate-100">
                    <details className="text-xs text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-600 font-medium">Données Brutes (JSON)</summary>
                        <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto max-h-40 text-[10px] text-slate-700 font-mono">
                            {JSON.stringify(specs, null, 2)}
                        </pre>
                    </details>
                </div>

            </CardContent>
        </Card >
    );
}
