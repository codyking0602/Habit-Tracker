import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Brain,
  CalendarDays,
  Check,
  Home,
  Sparkles,
} from "lucide-react";

const CORE_SECTIONS = [
  "Body",
  "Focus",
  "Family",
  "Recovery",
  "Nutrition",
  "Mind",
];

const CORE_HABITS = [
  { id: "exercise", label: "Exercise", points: 15, group: "Body" },
  { id: "steps", label: "5k+ steps", points: 10, group: "Body" },

  { id: "deep", label: "Deep work session", points: 15, group: "Focus" },
  {
    id: "screen",
    label: "Screen time under 4 hours",
    points: 10,
    group: "Focus",
  },

  {
    id: "phoneFamily",
    label: "Phone away during family windows",
    points: 10,
    group: "Family",
  },
  {
    id: "school",
    label: "School with the kids",
    points: 5,
    group: "Family",
  },
  {
    id: "sports",
    label: "Sports with the kids",
    points: 5,
    group: "Family",
  },

  { id: "bed", label: "Bed on time", points: 10, group: "Recovery" },
  {
    id: "yoga",
    label: "Yoga + meditate",
    points: 10,
    group: "Recovery",
  },

  {
    id: "calories",
    label: "Under 2,300 calories",
    points: 10,
    group: "Nutrition",
  },
  { id: "water", label: "Gallon water", points: 5, group: "Nutrition" },

  { id: "read", label: "Read", points: 5, group: "Mind" },
];

const BONUS_HABITS = [
  { id: "planTomorrow", label: "Plan tomorrow", points: 10 },
  { id: "fast24", label: "24-hour fast", points: 25 },
  { id: "sober", label: "Sober", points: 15 },
  { id: "noSocial", label: "No social media", points: 20 },
  { id: "completeTask", label: "Complete lingering task", points: 10 },
];

const MAX_CORE_POINTS = 110;
const STORAGE_KEY = "momentum-os-v4";

function todayKey() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function shiftDate(dateKey, days) {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() + days);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function defaultDay() {
  return {
    core: {},
    bonus: {},
    closed: false,
  };
}

function completionFor(day) {
  const safeDay = day || defaultDay();

  const core = CORE_HABITS.reduce(
    (sum, h) => sum + (safeDay.core?.[h.id] ? h.points : 0),
    0
  );

  const bonus = BONUS_HABITS.reduce(
    (sum, h) => sum + (safeDay.bonus?.[h.id] ? h.points : 0),
    0
  );

  return {
    core,
    bonus,
    total: core + bonus,
    percent: Math.round((core / MAX_CORE_POINTS) * 100),
  };
}

function ProgressRing({ percent, score }) {
  const clamped = Math.max(0, Math.min(100, percent));

  const color =
    clamped >= 85
      ? "#10b981"
      : clamped >= 55
      ? "#d4af37"
      : "#ef4444";

  return (
    <div
      className="relative mx-auto grid h-36 w-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${
          clamped * 3.6
        }deg, rgba(255,255,255,.07) 0deg)`,
      }}
    >
      <div className="absolute inset-3 rounded-full bg-[#0b0d0f]" />

      <div className="relative text-center">
        <div className="text-5xl font-black tracking-tight">{score}</div>

        <div className="text-xs font-semibold text-[#9ca3af]">
          {percent}% core
        </div>
      </div>
    </div>
  );
}

function XpBurst({ burst }) {
  return (
    <AnimatePresence>
      {burst && (
        <motion.div
          key={burst.id}
          initial={{ opacity: 0, y: 10, scale: 0.85 }}
          animate={{ opacity: 1, y: -44, scale: 1 }}
          exit={{ opacity: 0, y: -74, scale: 0.95 }}
          transition={{ duration: 0.75 }}
          className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-5 py-3 text-2xl font-black text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,.35)] backdrop-blur"
        >
          +{burst.points} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HabitRow({
  habit,
  checked,
  locked = false,
  onToggle,
  bonus = false,
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: locked ? 1 : 0.98 }}
      onClick={() => !locked && onToggle(habit)}
      className={`flex w-full items-center gap-3 border-b border-[#1f2328] px-3 py-4 text-left last:border-b-0 ${
        locked ? "opacity-30" : ""
      }`}
    >
      <div
        className={`grid h-7 w-7 place-items-center rounded-full border ${
          checked
            ? "border-emerald-400 bg-emerald-500 text-black"
            : "border-[#343941] bg-[#15181c]"
        }`}
      >
        {checked && <Check size={17} strokeWidth={4} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-bold text-[#f3f4f6]">
            {habit.label}
          </div>

          {bonus && <Sparkles size={14} className="text-[#d4af37]" />}
        </div>

        {!bonus && (
          <div className="text-xs text-[#6b7280]">{habit.group}</div>
        )}
      </div>

      <div className="font-black text-[#d4af37]">+{habit.points}</div>
    </motion.button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-[#262a30] bg-[#121417] p-3 text-center shadow-[0_0_25px_rgba(0,0,0,.35)]">
      <div className="text-2xl font-black">{value}</div>

      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
        {label}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-black transition ${
        active
          ? "bg-[#1a1d21] text-[#f3f4f6]"
          : "text-[#6b7280]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function MomentumOS() {
  const [date, setDate] = useState(todayKey());
  const [tab, setTab] = useState("home");
  const [data, setData] = useState({});
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    try {
      const loaded = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );

      setData(loaded);
    } catch {
      setData({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const day = data[date] || defaultDay();

  const score = completionFor(day);

  const familyScore = ["phoneFamily", "school", "sports"].reduce(
    (sum, id) =>
      sum +
      (day.core?.[id]
        ? CORE_HABITS.find((h) => h.id === id)?.points || 0
        : 0),
    0
  );

  function updateDay(updater) {
    setData((prev) => {
      const current = prev[date] || defaultDay();

      return {
        ...prev,
        [date]: updater(current),
      };
    });
  }

  function triggerBurst(points) {
    const id = Date.now();

    setBurst({ id, points });

    setTimeout(() => {
      setBurst((b) => (b?.id === id ? null : b));
    }, 700);
  }

  function toggleCore(habit) {
    const currently = Boolean(day.core?.[habit.id]);

    updateDay((d) => ({
      ...d,
      core: {
        ...d.core,
        [habit.id]: !currently,
      },
    }));

    if (!currently) triggerBurst(habit.points);
  }

  function toggleBonus(habit) {
    const currently = Boolean(day.bonus?.[habit.id]);

    updateDay((d) => ({
      ...d,
      bonus: {
        ...d.bonus,
        [habit.id]: !currently,
      },
    }));

    if (!currently) triggerBurst(habit.points);
  }

  const bonusUnlocked = score.percent >= 100;

  return (
    <div className="min-h-screen bg-[#070809] bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,.14),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(16,185,129,.10),transparent_30%)] px-4 pb-28 pt-5 text-[#f3f4f6]">
      <XpBurst burst={burst} />

      <div className="mx-auto max-w-md">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Momentum OS
            </h1>

            <p className="mt-1 text-sm text-[#9ca3af]">
              Consistency compounds.
            </p>
          </div>

          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="rounded-3xl border border-[#2b3036] bg-[#111315] px-4 py-3 text-sm font-bold text-white outline-none"
          />
        </header>

        {tab === "home" && (
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <section className="rounded-[2rem] border border-[#262a30] bg-[#121417]/95 p-5 shadow-[0_0_40px_rgba(0,0,0,.45)]">
              <ProgressRing
                percent={score.percent}
                score={score.core}
              />

              <div className="mt-4 text-center">
                <div className="text-6xl font-black tracking-tighter">
                  {score.percent}%
                </div>

                <div className="mt-1 text-sm text-[#9ca3af]">
                  daily core momentum
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat label="Streak" value={0} />
                <Stat label="7-Day" value="0%" />
                <Stat label="Stable Days" value={0} />
              </div>

              <div className="mt-4 rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 p-4 text-sm font-bold text-[#f6deb0] shadow-[0_0_25px_rgba(212,175,55,.08)]">
                Today’s Next Move: Exercise + Phone away during
                family windows
              </div>
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#262a30] bg-[#111315]/95 p-4 shadow-[0_0_35px_rgba(0,0,0,.35)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-black text-white">Family</div>

                  <div className="text-xs text-[#6b7280]">
                    Priority #1
                  </div>
                </div>

                <div className="font-black text-[#d4af37]">
                  {familyScore}/20
                </div>
              </div>

              <div className="grid gap-2">
                {CORE_HABITS.filter(
                  (h) => h.group === "Family"
                ).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleCore(h)}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
                      day.core?.[h.id]
                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                        : "border-[#262a30] bg-[#0e1012] text-[#d1d5db]"
                    }`}
                  >
                    <span>{h.label}</span>

                    <span className="text-[#d4af37]">
                      +{h.points}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </motion.main>
        )}

        {tab === "today" && (
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <section className="rounded-[1.7rem] border border-[#262a30] bg-[#111315]/95 p-4 shadow-[0_0_35px_rgba(0,0,0,.35)]">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-black">Core XP</div>

                  <div className="text-xs text-[#6b7280]">
                    Always available
                  </div>
                </div>

                <div className="font-black text-[#d4af37]">
                  {score.core}/{MAX_CORE_POINTS}
                </div>
              </div>

              {CORE_SECTIONS.map((section) => {
                const habits = CORE_HABITS.filter(
                  (h) => h.group === section
                );

                return (
                  <div
                    key={section}
                    className="mb-4 overflow-hidden rounded-3xl border border-[#262a30] bg-[#0b0d0f]"
                  >
                    <div className="border-b border-[#1f2328] bg-[#121417] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#6b7280]">
                      {section}
                    </div>

                    {habits.map((h) => (
                      <HabitRow
                        key={h.id}
                        habit={h}
                        checked={Boolean(day.core?.[h.id])}
                        onToggle={toggleCore}
                      />
                    ))}
                  </div>
                );
              })}
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#262a30] bg-[#111315]/95 p-4 shadow-[0_0_35px_rgba(0,0,0,.35)]">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-black">Bonus XP</div>

                  <div className="text-xs text-[#6b7280]">
                    Unlocks after 100% core momentum
                  </div>
                </div>

                <div className="font-black text-emerald-400">
                  +{score.bonus}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[#262a30] bg-[#0b0d0f]">
                {BONUS_HABITS.map((h) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    checked={Boolean(day.bonus?.[h.id])}
                    locked={!bonusUnlocked}
                    onToggle={toggleBonus}
                    bonus
                  />
                ))}
              </div>
            </section>
          </motion.main>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#262a30] bg-[#0b0d0f]/92 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <NavButton
            active={tab === "home"}
            onClick={() => setTab("home")}
            icon={<Home size={18} />}
            label="Home"
          />

          <NavButton
            active={tab === "today"}
            onClick={() => setTab("today")}
            icon={<Activity size={18} />}
            label="Today"
          />

          <NavButton
            active={tab === "history"}
            onClick={() => setTab("history")}
            icon={<CalendarDays size={18} />}
            label="History"
          />

          <NavButton
            active={tab === "intel"}
            onClick={() => setTab("intel")}
            icon={<Brain size={18} />}
            label="Intel"
          />
        </div>
      </nav>
    </div>
  );
}
