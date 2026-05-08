import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HintPopupProps {
  message: string;
  onClose: () => void;
}

export default function HintPopup({ message, onClose }: HintPopupProps) {
  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] rounded-md border border-blue-400/30 bg-slate-900/95 p-3 text-slate-100 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <p className="text-sm leading-5">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-slate-300 hover:text-white"
          onClick={onClose}
          aria-label="Close hint"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
