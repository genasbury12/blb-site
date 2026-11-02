import { LIBRARY_KINDS, LIBRARY_KIND_LABELS } from "@/domain/library";
import { Field, Select, TextArea, TextInput } from "./fields";

export type LibraryDefaults = { title?: string; slug?: string; kind?: string; summary?: string; body?: string | null; external_url?: string | null; tool_cost_note?: string | null; module_number?: number | null; tags?: string[] };

export function LibraryFields({ d }: { d: LibraryDefaults }) {
  return (
    <div className="grid gap-5">
      <Field label="Title" htmlFor="title"><TextInput id="title" name="title" required defaultValue={d.title} /></Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Slug" htmlFor="slug"><TextInput id="slug" name="slug" required pattern="[a-z0-9-]{3,80}" defaultValue={d.slug} /></Field>
        <Field label="Type" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={d.kind ?? "walkthrough"}>
            {LIBRARY_KINDS.map((k) => <option key={k} value={k}>{LIBRARY_KIND_LABELS[k]}</option>)}
          </Select>
        </Field>
        <Field label="Module" htmlFor="module_number">
          <Select id="module_number" name="module_number" defaultValue={d.module_number ?? 0}>
            <option value={0}>No module</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Module {n}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Summary" htmlFor="summary"><TextArea id="summary" name="summary" required maxLength={400} defaultValue={d.summary} /></Field>
      <Field label="Body" hint="Steps, the prompt text, or notes." htmlFor="body"><TextArea id="body" name="body" className="min-h-48" defaultValue={d.body ?? ""} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="External link (https)" htmlFor="external_url"><TextInput id="external_url" name="external_url" type="url" defaultValue={d.external_url ?? ""} /></Field>
        <Field label="Tags (comma separated)" htmlFor="tags"><TextInput id="tags" name="tags" defaultValue={(d.tags ?? []).join(", ")} /></Field>
      </div>
      <Field label="Tool cost note" hint="Explain third party subscription costs when relevant." htmlFor="tool_cost_note"><TextArea id="tool_cost_note" name="tool_cost_note" maxLength={400} defaultValue={d.tool_cost_note ?? ""} /></Field>
    </div>
  );
}
