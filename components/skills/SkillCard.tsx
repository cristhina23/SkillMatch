interface SkillCardProps {
  name: string;
  level: string;
  type: "TEACH" | "LEARN";
}

export function SkillCard({ name, level, type }: SkillCardProps) {
  const isTeaching = type === "TEACH";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-zinc-900">{name}</h3>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isTeaching
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {isTeaching ? "Teaching" : "Learning"}
        </span>
      </div>

      <p className="text-sm text-zinc-500">Level: {level}</p>
    </div>
  );
}