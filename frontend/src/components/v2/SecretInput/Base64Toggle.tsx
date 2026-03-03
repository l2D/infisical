import { twMerge } from "tailwind-merge";

import { Tooltip } from "@app/components/v2";

export enum Base64ToggleState {
  /** Actively showing decoded content */
  Active = "active",
  /** Marked as base64 but showing raw */
  Inactive = "inactive",
  /** Auto-detected, suggesting user mark it */
  Suggested = "suggested"
}

type Props = {
  state: Base64ToggleState;
  onClick: () => void;
  isDisabled?: boolean;
  warningMessage?: string;
};

export const Base64Toggle = ({ state, onClick, isDisabled, warningMessage }: Props) => {
  const tooltipContent = (() => {
    if (warningMessage) return warningMessage;
    switch (state) {
      case Base64ToggleState.Active:
        return "Showing decoded base64. Click to show raw.";
      case Base64ToggleState.Inactive:
        return "Showing raw base64. Click to decode.";
      case Base64ToggleState.Suggested:
        return "This value looks like base64. Click to decode.";
      default:
        return "";
    }
  })();

  return (
    <Tooltip content={tooltipContent}>
      <button
        type="button"
        disabled={isDisabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        className={twMerge(
          "inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[10px] leading-none font-bold transition-colors",
          state === Base64ToggleState.Active && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
          state === Base64ToggleState.Inactive &&
            "bg-mineshaft-600 text-mineshaft-300 hover:bg-mineshaft-500",
          state === Base64ToggleState.Suggested &&
            "bg-mineshaft-600/50 text-mineshaft-400 hover:bg-mineshaft-500/50",
          isDisabled && "cursor-not-allowed opacity-50"
        )}
      >
        {state === Base64ToggleState.Suggested ? "B64?" : "B64"}
      </button>
    </Tooltip>
  );
};
