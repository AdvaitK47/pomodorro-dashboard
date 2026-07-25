import { Todo } from "../../lib/types";

export default function DeleteTodoModal({
  todo,
  onConfirm,
  onCancel,
}: {
  todo: Todo;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-[#111111]/95 border border-white/10 p-8 rounded-3xl shadow-2xl w-[350px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold tracking-wide mb-2 text-[#f1e9e9]">
          Delete Todo?
        </h2>
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-center text-xs mb-6 mt-4">
          <span className="text-white/60 block">
            Are you sure you want to delete
          </span>
          <span className="text-[#e491c9] font-bold uppercase tracking-wider mt-1 block">
            "{todo.name}"
          </span>
          <span className="text-white/40 block mt-2">
            Scheduled for {todo.scheduledDate}
          </span>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-red-300"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white/50 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
