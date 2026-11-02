import { utcToEasternWall } from "@/domain/schedule/calendar";
import { Checkbox, Field, TextArea, TextInput } from "./fields";

export type WorkshopDefaults = { id?: string; title?: string; slug?: string; description?: string | null; release_at?: string; video_provider_id?: string | null; captions_ready?: boolean; transcript?: string | null; duration_seconds?: number | null };

export function WorkshopFields({ d, suggested }: { d: WorkshopDefaults; suggested?: string }) {
  return (
    <div className="grid gap-4">
      <input type="hidden" name="id" value={d.id ?? ""} />
      <Field label="Title" htmlFor="w-title"><TextInput id="w-title" name="title" required defaultValue={d.title} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Slug" htmlFor="w-slug"><TextInput id="w-slug" name="slug" required pattern="[a-z0-9-]{3,80}" defaultValue={d.slug} /></Field>
        <Field label="Release (Eastern time)" hint="First or third Monday" htmlFor="w-rel"><TextInput id="w-rel" name="release_at" type="datetime-local" required defaultValue={d.release_at ? utcToEasternWall(new Date(d.release_at)) : suggested} /></Field>
        <Field label="Minutes" htmlFor="w-min"><TextInput id="w-min" name="duration_minutes" type="number" min={0} max={240} defaultValue={d.duration_seconds ? d.duration_seconds / 60 : ""} /></Field>
      </div>
      <Field label="Description" htmlFor="w-desc"><TextArea id="w-desc" name="description" defaultValue={d.description ?? ""} /></Field>
      <Field label="Mux playback ID" htmlFor="w-mux"><TextInput id="w-mux" name="video_provider_id" defaultValue={d.video_provider_id ?? ""} /></Field>
      <Checkbox name="captions_ready" label="Captions uploaded and reviewed (required to publish with video)" defaultChecked={d.captions_ready ?? false} />
      <Field label="Transcript" htmlFor="w-tr"><TextArea id="w-tr" name="transcript" className="min-h-40" defaultValue={d.transcript ?? ""} /></Field>
    </div>
  );
}
