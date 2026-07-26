// components/modals/TodoLinkModal.tsx
import { Todo } from "../../lib/types";

export default function TodoLinkModal({
  todos,
  onSelect,
  onCancel,
}: {
  todos: Todo[];
  onSelect: (todoId: string | null) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="pr-4">
            <h3 className="text-base font-semibold text-[#f1e9e9] mb-1">
              Link this session
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              You have {todos.length} todo{todos.length > 1 ? "s" : ""} for
              today matching this tag. Which one should this session count
              towards?
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white transition p-1 -mt-1 -mr-1 shrink-0"
            aria-label="Cancel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-1 max-h-64 overflow-y-auto pretty-scrollbar pr-1">
          {todos.map((todo) => (
            <button
              key={todo.id}
              onClick={() => onSelect(todo.id)}
              className="w-full text-left px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 hover:border-[#ec4899]/60 hover:bg-[#ec4899]/10 transition-colors text-sm text-white/90"
            >
              {todo.name}
              <span className="block text-[10px] text-white/40 mt-0.5">
                Target: {todo.targetHours}h
              </span>
            </button>
          ))}
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-4 py-2.5 rounded-xl border border-white/10 bg-black/20 hover:border-white/30 transition-colors text-sm text-white/60 italic"
          >
            None — just a focus session
          </button>
        </div>
      </div>
    </div>
  );
}
