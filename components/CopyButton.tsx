import { useClipboard } from "@/hooks/useCopyToClipboard";
import { IconCheck, IconCopy } from "./icons";

export const CopyButton = ({
  text,
  label,
}: {
  text: string;
  label?: string;
}) => {
  const { copyToClipboard, copied } = useClipboard();
  return (
    <button
      className="ml-2 h-6 w-6 cursor-pointer"
      onClick={() => copyToClipboard(text)}
      title={`Copy ${label}`}
    >
      {copied === text ? (
        <IconCheck className="text-green-600 dark:text-green-500" />
      ) : (
        <IconCopy />
      )}
    </button>
  );
};
