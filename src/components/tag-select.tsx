'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, Loader2 } from 'lucide-react';

export interface Tag {
    id: string;
    name: string;
}

interface TagSelectProps {
    selectedTags: Tag[];
    onChange: (tags: Tag[]) => void;
}

export function TagSelect({ selectedTags, onChange }: TagSelectProps) {
    const tc = useTranslations('common');
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTags();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchTags() {
        try {
            const res = await fetch('/api/tags');
            if (res.ok) {
                const data = await res.json();
                setAllTags(data);
            }
        } catch (e) {
            console.error('Failed to fetch tags', e);
        }
    }

    async function createTag(name: string) {
        setCreating(true);
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const newTag = await res.json();
                setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
                handleAddTag(newTag);
            }
        } catch (e) {
            console.error('Failed to create tag', e);
        }
        setCreating(false);
    }

    function handleAddTag(tag: Tag) {
        if (!selectedTags.find((t) => t.id === tag.id)) {
            onChange([...selectedTags, tag]);
        }
        setInputValue('');
        setIsOpen(false);
    }

    function handleRemoveTag(tagId: string) {
        onChange(selectedTags.filter((t) => t.id !== tagId));
    }

    const unselectedTags = allTags.filter((t) => !selectedTags.find((st) => st.id === t.id));
    const filteredTags = unselectedTags.filter((t) => t.name.toLowerCase().includes(inputValue.toLowerCase()));

    // Check if exactly matching an existing tag
    const exactMatch = allTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());
    const showCreateOption = inputValue.trim().length >= 2 && !exactMatch;

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="flex min-h-[40px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {selectedTags.map((tag) => (
                    <span
                        key={tag.id}
                        className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag.id);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag.name}</span>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selectedTags.length === 0 ? tc('search') + '...' : ''}
                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
                />
            </div>

            {isOpen && (inputValue.length > 0 || unselectedTags.length > 0) && (
                <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md">
                    {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleAddTag(tag)}
                                className="w-full px-3 py-1.5 text-start text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                {tag.name}
                            </button>
                        ))
                    ) : !showCreateOption ? (
                        <div className="px-3 py-1.5 text-sm text-muted-foreground">
                            {tc('noResults')}
                        </div>
                    ) : null}

                    {showCreateOption && (
                        <button
                            type="button"
                            onClick={() => createTag(inputValue.trim())}
                            disabled={creating}
                            className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-start text-sm text-primary hover:bg-accent disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="text-xl leading-none">+</span>}
                            Create "{inputValue.trim()}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
