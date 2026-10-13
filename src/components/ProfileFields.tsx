import { useId, useState } from "react";
import { X, Plus } from "lucide-react";
import { PROFESSIONS, PROVINCE_NAMES, placesIn, resolvePlace, norm, type Place } from "@/lib/zambia";
import { inputCls } from "@/lib/zamwork";

/** Pick from common professions or type anything. Multiple allowed. Original wording is kept. */
export function SkillsInput({ value, onChange, max = 8, placeholder = "Type your work, e.g. Plumber" }: { value: string[]; onChange: (v: string[]) => void; max?: number; placeholder?: string }) {
  const id = useId();
  const [text, setText] = useState("");
  function add(raw = text) {
    const s = raw.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!s || value.length >= max) return;
    if (value.some((v) => norm(v) === norm(s))) { setText(""); return; }
    onChange([...value, s]);
    setText("");
  }
  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1.5 rounded-full">
              {s}
              <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((v) => v !== s))}><X className="w-4 h-4" /></button>
            </span>
          ))}
        </div>
      )}
      {value.length < max && (
        <div className="flex gap-2">
          <input
            className={inputCls}
            list={id}
            placeholder={value.length ? "Add another skill or service" : placeholder}
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              // picking a suggestion from the list adds it straight away
              if (PROFESSIONS.includes(v)) add(v); else setText(v);
            }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
            aria-label="What I do"
          />
          <button type="button" onClick={() => add()} className="px-4 rounded-lg border border-border hover:bg-muted" aria-label="Add"><Plus className="w-5 h-5" /></button>
          <datalist id={id}>{PROFESSIONS.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">Choose from the list or type your own. You can add more than one.</p>
    </div>
  );
}

/** Province first, then a searchable town/district box that also accepts any typed place. */
export function LocationPicker({ value, onChange }: { value: Place; onChange: (p: Place) => void }) {
  const id = useId();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select className={inputCls} value={value.province} aria-label="Province"
        onChange={(e) => onChange({ ...resolvePlace(value.town, e.target.value), province: e.target.value })}>
        <option value="">Province…</option>
        {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <div>
        <input className={inputCls} list={id} placeholder="Town, district or area" aria-label="Town or district" value={value.town}
          onChange={(e) => onChange(resolvePlace(e.target.value, value.province))} />
        <datalist id={id}>{placesIn(value.province).map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2 -mt-1">Not in the list? Just type your town or area.</p>
    </div>
  );
}
