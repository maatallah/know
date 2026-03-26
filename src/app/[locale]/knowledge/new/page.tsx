'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TagSelect, type Tag } from '@/components/tag-select';

interface Department {
    id: string;
    name: string;
}

interface Machine {
    id: string;
    name: string;
    departmentId: string;
}

const KNOWLEDGE_TYPES = [
    'MACHINE_PROCEDURE',
    'WORK_INSTRUCTION',
    'MAINTENANCE_GUIDE',
    'TROUBLESHOOTING',
    'SAFETY_INSTRUCTION',
    'TRAINING_GUIDE',
] as const;

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
const CRITICALITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export default function NewKnowledgePage() {
    const t = useTranslations('knowledge');
    const tc = useTranslations('common');
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);

    const [form, setForm] = useState({
        title: '',
        shortDescription: '',
        type: 'MACHINE_PROCEDURE' as string,
        riskLevel: 'LOW' as string,
        criticalityLevel: 'LOW' as string,
        estimatedTimeMin: '',
        requiredTools: '',
        preconditions: '',
        expectedOutcome: '',
        departmentId: '',
        machineId: '',
        content: '',
        tags: [] as Tag[],
    });

    useEffect(() => {
        // Fetch departments and machines for dropdowns
        fetch('/api/departments')
            .then((r) => r.json())
            .then((data) => setDepartments(data || []))
            .catch(() => { });
        fetch('/api/machines')
            .then((r) => r.json())
            .then((data) => setMachines(data || []))
            .catch(() => { });
    }, []);

    function update(field: string, value: string) {
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };
            
            // Trigger machine reset if department changes
            if (field === 'departmentId') {
                const currentMachine = machines.find(m => m.id === prev.machineId);
                if (currentMachine && currentMachine.departmentId !== value) {
                    newForm.machineId = '';
                }
            }
            
            return newForm;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const res = await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                tagIds: form.tags.map((t) => t.id),
                estimatedTimeMin: form.estimatedTimeMin ? parseInt(form.estimatedTimeMin) : null,
            }),
        });

        if (res.ok) {
            const item = await res.json();
            router.push(`/knowledge/${item.id}`);
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to create');
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('createNew')}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <FormField label={t('title')} required>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        required
                        className="input-field"
                    />
                </FormField>

                {/* Short Description */}
                <FormField label={t('shortDescription')}>
                    <textarea
                        value={form.shortDescription}
                        onChange={(e) => update('shortDescription', e.target.value)}
                        rows={2}
                        className="input-field min-h-[60px]"
                    />
                </FormField>

                {/* Type + Risk + Criticality */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label={t('type')} required>
                        <select
                            value={form.type}
                            onChange={(e) => update('type', e.target.value)}
                            className="input-field"
                        >
                            {KNOWLEDGE_TYPES.map((type) => (
                                <option key={type} value={type}>{t(`types.${type}`)}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label={t('riskLevel')} required>
                        <select
                            value={form.riskLevel}
                            onChange={(e) => update('riskLevel', e.target.value)}
                            className="input-field"
                        >
                            {RISK_LEVELS.map((r) => (
                                <option key={r} value={r}>{t(`riskLevels.${r}`)}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label={t('criticality')} required>
                        <select
                            value={form.criticalityLevel}
                            onChange={(e) => update('criticalityLevel', e.target.value)}
                            className="input-field"
                        >
                            {CRITICALITY_LEVELS.map((c) => (
                                <option key={c} value={c}>{t(`criticalityLevels.${c}`)}</option>
                            ))}
                        </select>
                    </FormField>
                </div>

                {/* Department + Machine */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t('department')} required>
                        <select
                            value={form.departmentId}
                            onChange={(e) => update('departmentId', e.target.value)}
                            required
                            className="input-field"
                        >
                            <option value="">{tc('select')}</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label={t('machine')}>
                        <select
                            value={form.machineId}
                            onChange={(e) => update('machineId', e.target.value)}
                            className="input-field"
                        >
                            <option value="">{tc('none')}</option>
                            {machines
                                .filter((m) => !form.departmentId || m.departmentId === form.departmentId)
                                .map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                        </select>
                    </FormField>
                </div>

                {/* Estimated Time */}
                <FormField label={t('estimatedTime')}>
                    <input
                        type="number"
                        value={form.estimatedTimeMin}
                        onChange={(e) => update('estimatedTimeMin', e.target.value)}
                        className="input-field"
                        min={0}
                    />
                </FormField>

                {/* Tools, Preconditions, Outcome */}
                <FormField label={t('requiredTools')}>
                    <input
                        type="text"
                        value={form.requiredTools}
                        onChange={(e) => update('requiredTools', e.target.value)}
                        className="input-field"
                    />
                </FormField>

                <FormField label={t('preconditions')}>
                    <textarea
                        value={form.preconditions}
                        onChange={(e) => update('preconditions', e.target.value)}
                        rows={2}
                        className="input-field min-h-[60px]"
                    />
                </FormField>

                <FormField label={t('expectedOutcome')}>
                    <textarea
                        value={form.expectedOutcome}
                        onChange={(e) => update('expectedOutcome', e.target.value)}
                        rows={2}
                        className="input-field min-h-[60px]"
                    />
                </FormField>

                {/* Tags */}
                <FormField label={t('tags')}>
                    <TagSelect
                        selectedTags={form.tags}
                        onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                    />
                </FormField>

                {/* Content (Markdown) */}
                <FormField label={t('content')} required>
                    <textarea
                        value={form.content}
                        onChange={(e) => update('content', e.target.value)}
                        required
                        rows={10}
                        className="input-field min-h-[200px] font-mono text-sm"
                        placeholder={t('contentPlaceholder')}
                    />
                </FormField>

                {/* Submit */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? tc('loading') : tc('create')}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                    >
                        {tc('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormField({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ms-1">*</span>}
            </label>
            {children}
        </div>
    );
}
