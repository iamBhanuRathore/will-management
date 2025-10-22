import { useState, useEffect } from "react";

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>;

interface UseCopyToClipboardReturn {
  copiedText: CopiedValue;
  copy: CopyFn;
  isCopied: boolean;
}

function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copy: CopyFn = async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setIsCopied(true);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
    return;
  }, [isCopied]);

  return { copiedText, copy, isCopied };
}

export default useCopyToClipboard;
