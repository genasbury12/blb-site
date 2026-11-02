import { Checkbox, Field, Select, TextArea, TextInput } from "./fields";

export type LessonDefaults = {
  module_id: string;
  title?: string;
  slug?: string;
  order_index?: number;
  essential?: boolean;
  objective?: string | null;
  assignment?: string | null;
  transcript?: string | null;
  ai_prompt?: string | null;
  ai_assistant_url?: string | null;
  path_note_build?: string | null;
  path_note_optimize?: string | null;
  video_provider_id?: string | null;
  captions_ready?: boolean;
  duration_seconds?: number | null;
};

export function LessonFields({ d, modules }: { d: LessonDefaults; modules: { id: string; number: number; title: string }[] }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Module" htmlFor="module_id">
          <Select id="module_id" name="module_id" defaultValue={d.module_id}>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                Module {m.number}: {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Order in module" htmlFor="order_index">
          <TextInput id="order_index" name="order_index" type="number" min={1} max={99} required defaultValue={d.order_index ?? 1} />
        </Field>
      </div>
      <Field label="Title" htmlFor="title">
        <TextInput id="title" name="title" required maxLength={140} defaultValue={d.title} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="URL slug" hint="Lowercase letters, numbers and dashes." htmlFor="slug">
          <TextInput id="slug" name="slug" required pattern="[a-z0-9-]{3,80}" defaultValue={d.slug} />
        </Field>
        <Field label="Length in minutes" htmlFor="duration_minutes">
          <TextInput id="duration_minutes" name="duration_minutes" type="number" min={0} max={120} step="0.5" defaultValue={d.duration_seconds ? d.duration_seconds / 60 : ""} />
        </Field>
      </div>
      <Checkbox name="essential" label="Essential lesson (counts toward completion). Leave unchecked for optional tutorials." defaultChecked={d.essential ?? true} />
      <Field label="Learning objective" htmlFor="objective">
        <TextArea id="objective" name="objective" maxLength={2000} defaultValue={d.objective ?? ""} />
      </Field>
      <Field label="Assignment" htmlFor="assignment">
        <TextArea id="assignment" name="assignment" maxLength={4000} defaultValue={d.assignment ?? ""} />
      </Field>
      <fieldset className="grid gap-5 rounded-2xl border border-rose/70 p-5">
        <legend className="px-2 text-sm font-semibold">Video</legend>
        <Field label="Mux playback ID" hint="From the Mux asset. Use a signed playback policy." htmlFor="video_provider_id">
          <TextInput id="video_provider_id" name="video_provider_id" maxLength={80} defaultValue={d.video_provider_id ?? ""} />
        </Field>
        <Checkbox name="captions_ready" label="Captions are uploaded and reviewed (required before publishing a video lesson)" defaultChecked={d.captions_ready ?? false} />
        <Field label="Transcript" hint="Required before publishing a video lesson." htmlFor="transcript">
          <TextArea id="transcript" name="transcript" className="min-h-48" defaultValue={d.transcript ?? ""} />
        </Field>
      </fieldset>
      <fieldset className="grid gap-5 rounded-2xl border border-rose/70 p-5">
        <legend className="px-2 text-sm font-semibold">AI assistant (external)</legend>
        <Field label="Prompt for members to copy" htmlFor="ai_prompt">
          <TextArea id="ai_prompt" name="ai_prompt" maxLength={4000} defaultValue={d.ai_prompt ?? ""} />
        </Field>
        <Field label="Assistant link (ChatGPT or Claude, https)" htmlFor="ai_assistant_url">
          <TextInput id="ai_assistant_url" name="ai_assistant_url" type="url" defaultValue={d.ai_assistant_url ?? ""} />
        </Field>
      </fieldset>
      <fieldset className="grid gap-5 rounded-2xl border border-rose/70 p-5">
        <legend className="px-2 text-sm font-semibold">Path callouts (only where authored)</legend>
        <Field label="For Build From Scratch" htmlFor="path_note_build">
          <TextArea id="path_note_build" name="path_note_build" maxLength={2000} defaultValue={d.path_note_build ?? ""} />
        </Field>
        <Field label="For Optimize & Automate" htmlFor="path_note_optimize">
          <TextArea id="path_note_optimize" name="path_note_optimize" maxLength={2000} defaultValue={d.path_note_optimize ?? ""} />
        </Field>
      </fieldset>
    </div>
  );
}
