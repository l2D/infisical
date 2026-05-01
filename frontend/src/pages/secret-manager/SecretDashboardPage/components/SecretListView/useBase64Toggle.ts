import { useCallback, useEffect, useMemo, useState } from "react";

import { Base64ToggleState } from "@app/components/v2/SecretInput/Base64Toggle";
import { base64Encode, hasBase64Encoding, isBase64, safeBase64Decode } from "@app/lib/fn/base64";

type UseBase64ToggleParams = {
  rawValue: string | undefined;
  secretMetadata?: { key: string; value: string; isEncrypted?: boolean }[];
  isVisible: boolean;
  // Called only for auto-detected (unsaved) values when the toggle state changes.
  // Lets callers stage the encoding=base64 metadata into their form so saving persists it.
  onMarkChange?: (shouldBeMarked: boolean) => void;
};

type UseBase64ToggleReturn = {
  displayValue: string | undefined;
  toggleState: Base64ToggleState | null;
  warningMessage: string | undefined;
  isMarkedBase64: boolean;
  handleToggle: () => void;
  enableDecoding: () => void;
  toStorageValue: (editedValue: string) => string;
  isDecoding: boolean;
};

export const useBase64Toggle = ({
  rawValue,
  secretMetadata,
  isVisible,
  onMarkChange
}: UseBase64ToggleParams): UseBase64ToggleReturn => {
  const isMarkedBase64 = useMemo(() => hasBase64Encoding(secretMetadata), [secretMetadata]);
  const [isDecoding, setIsDecoding] = useState(isMarkedBase64);

  useEffect(() => {
    setIsDecoding(isMarkedBase64);
  }, [isMarkedBase64]);

  // Compute decode result whenever we have a value (don't gate on isVisible —
  // we need this to determine badge state even when the secret is masked).
  const decodeResult = useMemo(() => {
    if (!rawValue) return null;
    return safeBase64Decode(rawValue);
  }, [rawValue]);

  // Auto-detect base64 from the raw value alone, independent of visibility.
  const isAutoDetected = useMemo(() => {
    if (isMarkedBase64 || !rawValue) return false;
    return rawValue.length >= 8 && isBase64(rawValue);
  }, [rawValue, isMarkedBase64]);

  const warningMessage = useMemo(() => {
    if (!isDecoding || !decodeResult || decodeResult.ok) return undefined;
    switch (decodeResult.error) {
      case "invalid-base64":
        return "Value is not valid base64";
      case "binary-content":
        return "Decoded content contains binary data";
      case "too-large":
        return "Value too large to decode in browser";
      default:
        return undefined;
    }
  }, [isDecoding, decodeResult]);

  // Only show decoded content when the secret is visible (otherwise the
  // overlay masks the value with dots anyway).
  const displayValue = useMemo(() => {
    if (!isDecoding || !isVisible || !decodeResult || !decodeResult.ok) return rawValue;
    return decodeResult.value;
  }, [rawValue, isDecoding, isVisible, decodeResult]);

  const toggleState = useMemo((): Base64ToggleState | null => {
    // For marked secrets, always show the badge even before reveal.
    if (isMarkedBase64) {
      if (isDecoding && isVisible && decodeResult?.ok) return Base64ToggleState.Active;
      return Base64ToggleState.Inactive;
    }
    // For auto-detected, show badge only when the value is visible.
    if (!rawValue) return null;
    if (isAutoDetected) {
      if (!isVisible) return null;
      if (isDecoding && decodeResult?.ok) return Base64ToggleState.Active;
      return Base64ToggleState.Suggested;
    }
    return null;
  }, [isVisible, rawValue, isMarkedBase64, isDecoding, isAutoDetected, decodeResult]);

  // For saved-marked values: just toggles the decode view.
  // For auto-detected values: also notifies the consumer so they can stage
  // (or unstage) the encoding=base64 metadata in their form, so the next save
  // persists the user's intent.
  const handleToggle = useCallback(() => {
    if (isMarkedBase64) {
      setIsDecoding((prev) => !prev);
      return;
    }
    if (isAutoDetected) {
      const next = !isDecoding;
      setIsDecoding(next);
      onMarkChange?.(next);
    }
  }, [isMarkedBase64, isAutoDetected, isDecoding, onMarkChange]);

  // Unconditionally enable decoding (avoids race with useEffect on isMarkedBase64).
  const enableDecoding = useCallback(() => setIsDecoding(true), []);

  const toStorageValue = useCallback(
    (editedValue: string): string => {
      if (isDecoding && decodeResult?.ok) {
        return base64Encode(editedValue);
      }
      return editedValue;
    },
    [isDecoding, decodeResult]
  );

  return {
    displayValue,
    toggleState,
    warningMessage,
    isMarkedBase64,
    handleToggle,
    enableDecoding,
    toStorageValue,
    isDecoding
  };
};
