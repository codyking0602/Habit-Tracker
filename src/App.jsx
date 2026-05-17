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

const CORE_SECTIONS = ["Body", "Focus", "Family", "Recovery", "Nutrition", "Mind"];

const CORE_HABITS = [
  { id: "exercise", label: "Exercise", points: 15, group: "Body" },
  { id: "steps", label: "5k+ steps", points: 10, group: "Body" },
  { id: "deep", label: "Deep work session", points: 15, group: "Focus" },
  { id: "screen", label: "Screen time under 4 hours", points: 10, group: "Focus" },
  { id: "phoneFamily", label: "Phone away during family windows", points: 10, group: "Family" },
  { id: "school", label: "School with the kids", points: 5, group: "Family" },
  { id: "sports", label: "Sports with the kids", points: 5, group: "Family" },
  { id: "bed", label: "Bed on time", points: 10, group: "Recovery" },
  { id: "yoga", label: "Yoga + meditate", points: 10, group: "Recovery" },
  { id: "calories", label: "Under 2,300 calories", points: 10, group: "Nutrition" },
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

const MAX_CORE_POINTS = CORE_HABITS.reduce((sum, h) => sum + h.points, 0);
const STORAGE_KEY = "momentum-os-v6";

const COLORS = {
  bg: "#07111f",
  panel: "#0d1b2a",
  panel2: "#102338",
  border: "#1d3a55",
  unc: "#7BAFD4",
  uncSoft: "rgba(123,175,212,.16)",
  orange: "#ff8a3d",
  orangeSoft: "rgba(255,138,61,.14)",
  yellow: "#ffd84d",
  yellowSoft: "rgba(255,216,77,.12)",
  green: "#22c55e",
  red: "#ef4444",
};

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

function monthDays(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const blanks = Array.from({ length: first.getDay() }, () => null);
  const days = Array.from({ length: last.getDate() }, (_, i) => {
    const day = new Date(y, m, i + 1);
    day.setMinutes(day.getMinutes() - day.getTimezoneOffset());
    return day.toISOString().slice(0, 10);
  });
  return [...blanks, ...days];
}

function defaultDay() {
  return { core: {}, bonus: {}, closed: false };
}

function isPastDate(dateKey) {
  return dateKey < todayKey();
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

function getNextMove(day, score) {
  if (score.core >= 60) return "Momentum stable. Protect family and bedtime.";

  const open = CORE_HABITS.filter((h) => !day?.core?.[h.id]);
  const body = open.find((h) => h.group === "Body");
  const family = open.find((h) => h.group === "Family");
  const focus = open.find((h) => h.group === "Focus");
  const nutrition = open.find((h) => h.group === "Nutrition");
  const picks = [body, family, focus, nutrition].filter(Boolean).slice(0, 2);

  if (!picks.length) return `${60 - score.core} core points to stabilize the day.`;
  return picks.map((p) => p.label).join(" + ");
}

function ProgressRing({ percent, score }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 85 ? COLORS.green : clamped >= 55 ? COLORS.yellow : COLORS.orange;

  return (
    <div
      className="relative mx-auto grid h-44 w-44 place-items-center rounded-full shadow-[0_0_55px_rgba(123,175,212,.18)]"
      style={{
        background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(255,255,255,.08) 0deg)`,
      }}
    >
      <div className="absolute inset-3 rounded-full border border-[#1d3a55] bg-[#07111f]" />
      <div className="relative text-center">
        <div className="text-5xl font-black tracking-tight text-white">{score}</div>
        <div className="text-xs font-semibold text-[#9fb7cc]">{percent}% core</div>
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
          className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 rounded-2xl border border-[#ffd84d]/40 bg-[#ffd84d]/15 px-5 py-3 text-2xl font-black text-[#fff0a8] shadow-[0_0_45px_rgba(255,216,77,.25)] backdrop-blur"
        >
          +{burst.points} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HabitRow({ habit, checked, locked = false, onToggle, bonus = false }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: locked ? 1 : 0.98 }}
      onClick={() => !locked && onToggle(habit)}
      className={`flex w-full items-center gap-3 border-b border-[#1d3a55]/70 px-3 py-4 text-left last:border-b-0 ${
        locked ? "opacity-30" : ""
      }`}
    >
      <div
        className={`grid h-7 w-7 place-items-center rounded-full border ${
          checked
            ? "border-emerald-300 bg-emerald-400 text-[#07111f]"
            : "border-[#315b7a] bg-[#102338]"
        }`}
      >
        {checked && <Check size={17} strokeWidth={4} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-bold text-slate-100">{habit.label}</div>
          {bonus && <Sparkles size={14} className="text-[#ffd84d]" />}
        </div>
        {!bonus && <div className="text-xs text-[#86a7c2]">{habit.group}</div>}
      </div>

      <div className="font-black text-[#ffd84d]">+{habit.points}</div>
    </motion.button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#1d3a55] bg-[#102338] p-3 text-center shadow-[0_0_25px_rgba(0,0,0,.28)]">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#86a7c2]">
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
        active ? "bg-[#102f4a] text-[#7BAFD4]" : "text-[#6f8ba3]"
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
      const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const closedPastDays = { ...loaded };

      Object.keys(closedPastDays).forEach((key) => {
        if (isPastDate(key) && !closedPastDays[key]?.closed) {
          closedPastDays[key] = { ...defaultDay(), ...closedPastDays[key], closed: true };
        }
      });

      setData(closedPastDays);
    } catch {
      setData({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const rawDay = data[date] || defaultDay();
  const day = isPastDate(date) && !rawDay.closed ? { ...rawDay, closed: true } : rawDay;
  const score = completionFor(day);
  const loggedKeys = Object.keys(data).sort();

  const stats = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => shiftDate(todayKey(), i - 6));
    const avg = last7.reduce((sum, k) => sum + completionFor(data[k]).percent, 0) / 7;

    let streak = 0;
    let cursor = todayKey();

    while (completionFor(data[cursor]).core >= 60) {
      streak += 1;
      cursor = shiftDate(cursor, -1);
    }

    const wins = loggedKeys.filter((k) => completionFor(data[k]).core >= 60).length;

    const bestStreak = loggedKeys.reduce(
      (acc, k) => {
        const win = completionFor(data[k]).core >= 60;
        const cur = win ? acc.cur + 1 : 0;
        return { cur, best: Math.max(acc.best, cur) };
      },
      { cur: 0, best: 0 }
    ).best;

    return { avg: Math.round(avg), streak, wins, bestStreak };
  }, [data, loggedKeys.length]);

  const insights = useMemo(() => {
    if (!loggedKeys.length) return ["No pattern yet. Log a few days first."];

    const rates = CORE_HABITS.map((h) => {
      const done = loggedKeys.filter((k) => data[k]?.core?.[h.id]).length;
      return { ...h, rate: Math.round((done / loggedKeys.length) * 100) };
    }).sort((a, b) => a.rate - b.rate);

    const rows = [];

    if (stats.avg < 60) rows.push("Drift detected: 7-day average is below 60%. Tighten the floor before adding more.");
    if ((rates.find((h) => h.id === "bed")?.rate ?? 100) < 50) rows.push("Bedtime is weak. That usually taxes tomorrow before it starts.");
    if ((rates.find((h) => h.id === "screen")?.rate ?? 100) < 50) rows.push("Phone control is dragging momentum. This is a leverage point.");

    const familyIds = ["phoneFamily", "school", "sports"];
    const familyRate = Math.round(
      familyIds.reduce((sum, id) => sum + (rates.find((h) => h.id === id)?.rate || 0), 0) / familyIds.length
    );

    if (familyRate < 60) rows.push("Family presence is leaking. Keep the windows smaller and more protected.");

    rows.push(`Weakest habit: ${rates[0].label} (${rates[0].rate}%).`);
    rows.push(`Strongest habit: ${rates[rates.length - 1].label} (${rates[rates.length - 1].rate}%).`);

    return rows;
  }, [data, loggedKeys.length, stats.avg]);

  function updateDay(updater) {
    setData((prev) => {
      const current = prev[date] || defaultDay();
      return { ...prev, [date]: updater(current) };
    });
  }

  function triggerBurst(points) {
    const id = Date.now();
    setBurst({ id, points });
    setTimeout(() => setBurst((b) => (b?.id === id ? null : b)), 700);
  }

  function toggleCore(habit) {
    const currently = Boolean(day.core?.[habit.id]);

    updateDay((d) => ({
      ...d,
      core: { ...d.core, [habit.id]: !currently },
    }));

    if (!currently) triggerBurst(habit.points);
  }

  function toggleBonus(habit) {
    const currently = Boolean(day.bonus?.[habit.id]);

    updateDay((d) => ({
      ...d,
      bonus: { ...d.bonus, [habit.id]: !currently },
    }));

    if (!currently) triggerBurst(habit.points);
  }

  function closeDay() {
    updateDay((d) => ({ ...d, closed: true }));
  }

  const bonusUnlocked = score.percent >= 100;
  const availableBonus = BONUS_HABITS.map((h) => ({ ...h, locked: !bonusUnlocked }));
  const last7 = Array.from({ length: 7 }, (_, i) => shiftDate(todayKey(), i - 6));

  const familyScore = ["phoneFamily", "school", "sports"].reduce(
    (sum, id) => sum + (day.core?.[id] ? CORE_HABITS.find((h) => h.id === id)?.points || 0 : 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#07111f] bg-[radial-gradient(circle_at_15%_10%,rgba(123,175,212,.22),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(255,138,61,.16),transparent_30%)] px-4 pb-28 pt-5 text-slate-100">
      <XpBurst burst={burst} />

      <div className="mx-auto max-w-md">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#7BAFD4]">
              Momentum OS
            </h1>
            <p className="mt-1 text-sm text-[#9fb7cc]">Consistency compounds.</p>
          </div>

          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="max-w-[142px] rounded-2xl border border-[#1d3a55] bg-[#0d1b2a] px-3 py-2 text-sm font-bold text-slate-100 outline-none"
          />
        </header>

        {tab === "home" && (
          <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <section className="rounded-[2rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-5 shadow-2xl shadow-black/30">
              <ProgressRing percent={score.percent} score={score.core} />

              <div className="mt-5 text-center">
                <div className="text-6xl font-black tracking-tighter text-white">{score.percent}%</div>
                <div className="mt-1 text-sm text-[#9fb7cc]">daily core momentum</div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat label="Streak" value={stats.streak} />
                <Stat label="7-Day" value={`${stats.avg}%`} />
                <Stat label="Stable Days" value={stats.wins} />
              </div>

              <div className="mt-4 rounded-2xl border border-[#ff8a3d]/30 bg-[#ff8a3d]/15 p-3 text-sm font-bold text-[#ffd6b9]">
                Today&apos;s Next Move: {getNextMove(day, score)}
              </div>
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#7BAFD4]">Family</div>
                  <div className="text-xs text-[#86a7c2]">Priority #1</div>
                </div>
                <div className="font-black text-[#ffd84d]">{familyScore}/20</div>
              </div>

              <div className="grid gap-2">
                {CORE_HABITS.filter((h) => h.group === "Family").map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleCore(h)}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-bold ${
                      day.core?.[h.id]
                        ? "border-emerald-300/30 bg-emerald-400/20 text-emerald-100"
                        : "border-[#1d3a55] bg-[#102338] text-slate-300"
                    }`}
                  >
                    <span>{h.label}</span>
                    <span className="text-[#ffd84d]">+{h.points}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#7BAFD4]">Last 7 Days</div>
                  <div className="text-xs text-[#86a7c2]">Heat strip</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {last7.map((k) => {
                  const p = completionFor(data[k]).percent;

                  return (
                    <div
                      key={k}
                      className={`h-10 rounded-xl border border-[#1d3a55] ${
                        p >= 85
                          ? "bg-emerald-400/70"
                          : p >= 55
                          ? "bg-[#ffd84d]/55"
                          : data[k]
                          ? "bg-red-500/25"
                          : "bg-[#102338]"
                      }`}
                    />
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="font-black text-[#7BAFD4]">Latest Insight</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{insights[0]}</p>
            </section>
          </motion.main>
        )}

        {tab === "today" && (
          <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <section className="rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#7BAFD4]">Core XP</div>
                  <div className="text-xs text-[#86a7c2]">Always available</div>
                </div>
                <div className="font-black text-[#ffd84d]">
                  {score.core}/{MAX_CORE_POINTS}
                </div>
              </div>

              {CORE_SECTIONS.map((section) => {
                const habits = CORE_HABITS.filter((h) => h.group === section);

                if (!habits.length) return null;

                return (
                  <div
                    key={section}
                    className="mb-4 overflow-hidden rounded-3xl border border-[#1d3a55] bg-[#102338] last:mb-0"
                  >
                    <div className="border-b border-[#1d3a55] bg-[#07111f]/60 px-4 py-3 text-xs font-black uppercase tracking-widest text-[#86a7c2]">
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

            <section className="mt-4 rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#ff8a3d]">Bonus XP</div>
                  <div className="text-xs text-[#86a7c2]">Unlocks after 100% core momentum</div>
                </div>
                <div className="font-black text-[#ffd84d]">+{score.bonus}</div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[#1d3a55] bg-[#102338]">
                {availableBonus.map((h) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    checked={Boolean(day.bonus?.[h.id])}
                    locked={h.locked}
                    onToggle={toggleBonus}
                    bonus
                  />
                ))}
              </div>
            </section>
          </motion.main>
        )}

        {tab === "history" && (
          <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <section className="rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#7BAFD4]">History</div>
                  <div className="text-xs text-[#86a7c2]">Monthly heatmap</div>
                </div>
                <div className="text-sm font-black text-slate-300">Best {stats.bestStreak}</div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-[#86a7c2]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={`${d}-${i}`}>{d}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthDays(date).map((k, i) => {
                  if (!k) return <div key={`blank-${i}`} />;

                  const p = completionFor(data[k]).percent;

                  return (
                    <div
                      key={k}
                      className={`grid aspect-square place-items-center rounded-xl border border-[#1d3a55] text-xs font-black ${
                        p >= 85
                          ? "bg-emerald-400/70 text-[#07111f]"
                          : p >= 55
                          ? "bg-[#ffd84d]/60 text-[#07111f]"
                          : data[k]
                          ? "bg-red-500/25 text-slate-200"
                          : "bg-[#102338] text-[#86a7c2]"
                      }`}
                    >
                      {new Date(k + "T00:00:00").getDate()}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-widest text-[#86a7c2]">
                {day.closed ? "Closed" : "Open"}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={closeDay}
                className="w-full rounded-[1.75rem] border border-[#ff8a3d]/30 bg-gradient-to-br from-[#ff8a3d]/25 to-[#ffd84d]/15 px-6 py-6 text-lg font-black tracking-tight text-[#ffe8a6] shadow-2xl shadow-orange-500/10"
              >
                {day.closed ? "Day Closed" : "Daily Closeout"}
              </motion.button>
            </section>
          </motion.main>
        )}

        {tab === "insights" && (
          <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <section className="rounded-[1.7rem] border border-[#1d3a55] bg-[#0d1b2a]/95 p-4">
              <div className="font-black text-[#7BAFD4]">Pattern Intelligence</div>

              <div className="mt-3 overflow-hidden rounded-3xl border border-[#1d3a55] bg-[#102338]">
                {insights.map((x, i) => (
                  <div
                    key={i}
                    className="border-b border-[#1d3a55] px-4 py-4 text-sm leading-6 text-slate-300 last:border-b-0"
                  >
                    {x}
                  </div>
                ))}
              </div>
            </section>
          </motion.main>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#1d3a55] bg-[#07111f]/92 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <NavButton active={tab === "home"} onClick={() => setTab("home")} icon={<Home size={18} />} label="Home" />
          <NavButton active={tab === "today"} onClick={() => setTab("today")} icon={<Activity size={18} />} label="Today" />
          <NavButton active={tab === "history"} onClick={() => setTab("history")} icon={<CalendarDays size={18} />} label="History" />
          <NavButton active={tab === "insights"} onClick={() => setTab("insights")} icon={<Brain size={18} />} label="Intel" />
        </div>
      </nav>
    </div>
  );
}
