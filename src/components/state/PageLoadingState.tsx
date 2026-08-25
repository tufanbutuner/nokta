import { LoadingState } from "@/components/state/LoadingState";

export function PageLoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <LoadingState message={message} />
    </div>
  );
}
