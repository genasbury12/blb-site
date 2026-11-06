import { describe, expect, it } from "vitest";
import { duplicateConstraint, errorState, formValues } from "./form-result";

describe("form results", () => {
  it("names the unique constraint a duplicate key error hit", () => {
    expect(duplicateConstraint('duplicate key value violates unique constraint "lessons_module_id_order_index_key"')).toBe("lessons_module_id_order_index_key");
    expect(duplicateConstraint('duplicate key value violates unique constraint "lessons_module_id_slug_key"')).toBe("lessons_module_id_slug_key");
    expect(duplicateConstraint("duplicate key value")).toBeNull();
    expect(duplicateConstraint('new row violates check constraint "lessons_slug_check"')).toBeNull();
  });

  it("keeps every submitted text value, repeated names included, and leaves out files and Next's own keys", () => {
    const fd = new FormData();
    fd.append("title", "A lesson");
    fd.append("transcript", "x".repeat(50_000));
    fd.append("tags", "a");
    fd.append("tags", "b");
    fd.append("$ACTION_ID_abc", "");
    fd.append("file", new Blob(["data"]), "notes.pdf");
    const v = formValues(fd);
    expect(Object.keys(v).sort()).toEqual(["tags", "title", "transcript"]);
    expect(v.tags).toEqual(["a", "b"]);
    expect(v.transcript![0]).toHaveLength(50_000);
  });

  it("sends the values back only when given", () => {
    expect(errorState("No")).not.toHaveProperty("values");
    expect(errorState("No", { title: ["x"] })!.values).toEqual({ title: ["x"] });
  });
});
