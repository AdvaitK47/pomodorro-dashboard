// components/features/TodosPanel.tsx
import { Todo } from "../../lib/types";
import { tagColors } from "../../lib/constants";
import GlassDatePicker from "../ui/GlassDatePicker";

export default function TodosPanel({
  setActiveTab,
  setShowWidget,
  todoName,
  setTodoName,
  todoTag,
  setTodoTag,
  todoDate,
  setTodoDate,
  todoHours,
  setTodoHours,
  tags,
  handleAddTodo,
  todos,
  todayStr,
  todayTodos,
  upcomingWeekTodos,
  laterTodos,
  pastTodos,
  getTodoProgressSeconds,
  setTodoToDelete,
}: any) {
  return (
    <div className="z-20 flex flex-col bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[820px] max-w-[95vw] h-[520px] p-6 transition-all -translate-y-2 overflow-y-auto">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("focus");
              setShowWidget(false);
            }}
            className="text-white/50 hover:text-white transition p-1 grayscale"
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
          <h2 className="text-2xl font-bold text-[#f1e9e9]">
            Todos Schedule <span className="grayscale">📅</span>
          </h2>
        </div>
      </div>
      <p className="text-xs text-white/40 mb-6">
        Schedule task goals for specific days and track your progress.
      </p>

      <div className="bg-[#111115] border border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
          New Task
        </h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              Name
            </span>
            <input
              type="text"
              value={todoName}
              onChange={(e) => setTodoName(e.target.value)}
              placeholder="e.g. Deep Work"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/40 text-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              Tag
            </span>
            <select
              value={todoTag}
              onChange={(e) => setTodoTag(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/40 text-white"
            >
              {tags.map((t: string) => (
                <option key={t} value={t} className="bg-[#111]">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              Scheduled Date
            </span>
            <GlassDatePicker value={todoDate} onChange={setTodoDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              Target Hours
            </span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={todoHours}
              onChange={(e) => setTodoHours(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/40 text-white"
            />
          </div>
        </div>
        <button
          onClick={handleAddTodo}
          className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all active:scale-95"
        >
          + Add Todo
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="text-xs text-white/30 py-8 text-center">
          No todos scheduled yet - add one above to start tracking.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* TODAY */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3 flex items-center gap-2">
              <span className="grayscale">☀️</span> Today's Todos{" "}
              <span className="text-white/30 font-normal normal-case">
                ({todayTodos.length})
              </span>
            </h3>
            <div className="flex flex-col gap-3">
              {todayTodos.length === 0 ? (
                <div className="text-xs text-white/30 py-3 text-center bg-black/20 border border-white/5 rounded-xl">
                  Nothing scheduled for today.
                </div>
              ) : (
                todayTodos.map((todo: Todo) => {
                  const progressHours = getTodoProgressSeconds(todo) / 3600;
                  const pct = Math.min(
                    100,
                    Math.floor((progressHours / todo.targetHours) * 100),
                  );
                  const done = pct >= 100;
                  const tagIdx = tags.indexOf(todo.tag);
                  return (
                    <div
                      key={todo.id}
                      className="bg-black/40 border border-white/5 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                tagColors[
                                  (tagIdx !== -1 ? tagIdx : 0) %
                                    tagColors.length
                                ],
                            }}
                          ></span>
                          <span
                            className={`font-semibold text-sm ${done ? "text-white/50 line-through" : "text-white/90"}`}
                          >
                            {todo.name}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 ml-2">
                            Today
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/40">
                            {todo.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {done && (
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                              ✓ Done
                            </span>
                          )}
                          <button
                            onClick={() => setTodoToDelete(todo)}
                            className="text-white/30 hover:text-white font-bold text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${done ? "bg-emerald-400" : "bg-white"}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-white/50 whitespace-nowrap">
                          {progressHours.toFixed(1)}h / {todo.targetHours}h
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* UPCOMING WEEK */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3 flex items-center gap-2">
              <span className="grayscale">🗓️</span> Upcoming Week{" "}
              <span className="text-white/30 font-normal normal-case">
                ({upcomingWeekTodos.length})
              </span>
            </h3>
            <div className="flex flex-col gap-3">
              {upcomingWeekTodos.length === 0 ? (
                <div className="text-xs text-white/30 py-3 text-center bg-black/20 border border-white/5 rounded-xl">
                  Nothing scheduled for the next 7 days.
                </div>
              ) : (
                upcomingWeekTodos.map((todo: Todo) => {
                  const progressHours = getTodoProgressSeconds(todo) / 3600;
                  const pct = Math.min(
                    100,
                    Math.floor((progressHours / todo.targetHours) * 100),
                  );
                  const done = pct >= 100;
                  const tagIdx = tags.indexOf(todo.tag);
                  return (
                    <div
                      key={todo.id}
                      className="bg-black/40 border border-white/5 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                tagColors[
                                  (tagIdx !== -1 ? tagIdx : 0) %
                                    tagColors.length
                                ],
                            }}
                          ></span>
                          <span
                            className={`font-semibold text-sm ${done ? "text-white/50 line-through" : "text-white/90"}`}
                          >
                            {todo.name}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 ml-2">
                            {todo.scheduledDate}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/40">
                            {todo.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {done && (
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                              ✓ Done
                            </span>
                          )}
                          <button
                            onClick={() => setTodoToDelete(todo)}
                            className="text-white/30 hover:text-white font-bold text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${done ? "bg-emerald-400" : "bg-white"}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-white/50 whitespace-nowrap">
                          {progressHours.toFixed(1)}h / {todo.targetHours}h
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LATER / PAST */}
          {(laterTodos.length > 0 || pastTodos.length > 0) && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
                Other Scheduled
              </h3>
              <div className="flex flex-col gap-2">
                {[...pastTodos, ...laterTodos].map((todo: Todo) => {
                  const progressHours = getTodoProgressSeconds(todo) / 3600;
                  const pct = Math.min(
                    100,
                    Math.floor((progressHours / todo.targetHours) * 100),
                  );
                  const done = pct >= 100;
                  const tagIdx = tags.indexOf(todo.tag);
                  return (
                    <div
                      key={todo.id}
                      className="flex justify-between items-center bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              tagColors[
                                (tagIdx !== -1 ? tagIdx : 0) % tagColors.length
                              ],
                          }}
                        ></span>
                        <span
                          className={`truncate ${done ? "text-white/40 line-through" : "text-white/80"}`}
                        >
                          {todo.name}
                        </span>
                        <span className="text-white/30 shrink-0">
                          {todo.scheduledDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-white/40 font-mono">
                          {progressHours.toFixed(1)}h / {todo.targetHours}h
                        </span>
                        <button
                          onClick={() => setTodoToDelete(todo)}
                          className="text-white/30 hover:text-white font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
