import { Upload } from "lucide-react";

export function OwnerMediaDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-nokta-surface-alt/60 p-8 text-center transition-colors hover:bg-secondary"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Upload className="h-8 w-8 text-nokta-accent-dark" />
      <span className="mt-3 font-medium">Upload venue photos for review</span>
      <span className="mt-1 text-sm text-nokta-ink-muted">JPEG, PNG or WebP. Up to 10 files, 8 MB each.</span>
      <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => onFiles(Array.from(event.target.files ?? []))} />
    </label>
  );
}
