import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Activity,
  CalendarDays,
  Brain,
  Check,
  Sparkles,
} from "lucide-react";

const CORE_HABITS = [
  { id: "exercise", label: "Exercise", points: 15 },
  { id: "steps", label: "5k+ Steps", points: 10 },
  { id: "deep", label: "Deep Work", points: 15 },
  { id: "screen", label: "Under 4hr Screen", points: 10 },
  { id: "bed", label: "Bed On Time", points: 10 },
  { id: "water", label: "Gallon Water", points: 5 },
  { id: "calories", label: "Under 2300 Calories", points: 10 },
  { id: "read", label: "Read", points: 5 },
];

const FAMILY_HABITS = [
  { id: "phoneFamily", label: "Phone Away", points: 10 },
  { id: "school", label: "School", points: 5 },
  { id: "sports", label: "Sports", points: 5 },
];

const BONUS_HABITS = [
  { id: "plan", label: "Plan Tomorrow", points: 10 },
  { id: "fast", label: "24hr Fast", points: 25 },
  { id: "sober", label: "Sober", points: 15 },
  { id: "social", label: "No Social Media", points: 20 },
];

const STORAGE_KEY = "momentum-v5";

function todayKey() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function defaultDay() {
  return {
    core: {},
    family: {},
    bonus: {},
    closed: false,
  };
}

export default function App() {
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

  const today = todayKey();

  const day = data[today] || defaultDay();

  const corePoints = CORE_HABITS.reduce(
    (sum, h) => sum + (day.core[h.id] ? h.points : 0),
    0
  );

  const familyPoints = FAMILY_HABITS.reduce(
    (sum, h) => sum + (day.family[h.id] ? h.points : 0),
    0
  );

  const bonusPoints = BONUS_HABITS.reduce(
    (sum, h) => sum + (day.bonus[h.id] ? h.points : 0),
    0
  );

  const totalCore = corePoints + familyPoints;

  const percent = Math.min(
    100,
    Math.round((totalCore / 130) * 100)
  );

  const bonusUnlocked = percent >= 100;

  function update(updater) {
    setData((prev) => ({
      ...prev,
      [today]: updater(prev[today] || defaultDay()),
    }));
  }

  function trigger(points) {
    const id = Date.now();

    setBurst({ id, points });

    setTimeout(() => {
      setBurst(null);
    }, 700);
  }

  function toggle(section, habit) {
    const checked = day[section][habit.id];

    update((d) => ({
      ...d,
      [section]: {
        ...d[section],
        [habit.id]: !checked,
      },
    }));

    if (!checked) trigger(habit.points);
  }

  return (
    <div className="min-h-screen bg-[#08131f] text-white px-4 pb-28 pt-5 bg-[radial-gradient(circle_at_top_left,rgba(123,175,212,.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,145,77,.18),transparent_28%)]">
      <AnimatePresence>
        {burst && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 rounded-3xl border border-yellow-300/30 bg-yellow-300/15 px-6 py-4 text-2xl font-black text-yellow-200 shadow-[0_0_40px_rgba(255,200,0,.25)]"
          >
            +{burst.points} XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#9fd3ff]">
              Momentum
            </h1>

            <p className="text-sm text-slate-400">
              Stack good days.
            </p>
          </div>

          <div className="rounded-3xl border border-[#24364a] bg-[#0d1a28] px-4 py-3 text-sm font-bold text-slate-300">
            {today}
          </div>
        </header>

        {tab === "home" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <section className="rounded-[2rem] border border-[#24364a] bg-[#0d1a28]/95 p-5 shadow-[0_0_50px_rgba(0,0,0,.45)]">
              <div
                className="relative mx-auto grid h-40 w-40 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${
                    percent >= 85
                      ? "#10b981"
                      : percent >= 55
                      ? "#facc15"
                      : "#fb923c"
                  } ${percent * 3.6}deg, rgba(255,255,255,.08) 0deg)`,
                }}
              >
                <div className="absolute inset-3 rounded-full bg-[#08131f]" />

                <div className="relative text-center">
                  <div className="text-5xl font-black">
                    {percent}%
                  </div>

                  <div className="text-xs font-bold text-slate-400">
                    Daily Momentum
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-3xl bg-[#111f30] p-3 text-center">
                  <div className="text-2xl font-black text-[#9fd3ff]">
                    {totalCore}
                  </div>

                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    Core XP
                  </div>
                </div>

                <div className="rounded-3xl bg-[#111f30] p-3 text-center">
                  <div className="text-2xl font-black text-[#ffd84d]">
                    {bonusPoints}
                  </div>

                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    Bonus XP
                  </div>
                </div>

                <div className="rounded-3xl bg-[#111f30] p-3 text-center">
                  <div className="text-2xl font-black text-[#ff9b57]">
                    0
                  </div>

                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    Streak
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-[#ffd84d]/20 bg-[#ffd84d]/10 p-4 text-sm font-bold text-[#ffeaa0]">
                Today’s Next Move: Exercise + Phone Away
              </div>
            </section>

            <section className="mt-4 rounded-[2rem] border border-[#24364a] bg-[#0d1a28]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#9fd3ff]">
                    Family
                  </div>

                  <div className="text-xs text-slate-500">
                    Priority #1
                  </div>
                </div>

                <div className="font-black text-[#ffd84d]">
                  {familyPoints}/20
                </div>
              </div>

              <div className="grid gap-2">
                {FAMILY_HABITS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggle("family", h)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                      day.family[h.id]
                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                        : "border-[#24364a] bg-[#101d2c]"
                    }`}
                  >
                    <span>{h.label}</span>

                    <span className="text-[#ffd84d]">
                      +{h.points}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {tab === "today" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <section className="rounded-[2rem] border border-[#24364a] bg-[#0d1a28]/95 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#9fd3ff]">
                    Core XP
                  </div>

                  <div className="text-xs text-slate-500">
                    Daily standards
                  </div>
                </div>

                <div className="font-black text-[#ffd84d]">
                  {totalCore}/130
                </div>
              </div>

              <div className="grid gap-2">
                {CORE_HABITS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggle("core", h)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                      day.core[h.id]
                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                        : "border-[#24364a] bg-[#101d2c]"
                    }`}
                  >
                    <span>{h.label}</span>

                    <span className="text-[#ffd84d]">
                      +{h.points}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-4 rounded-[2rem] border border-[#24364a] bg-[#0d1a28]/95 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-black text-[#ffb067]">
                    Bonus XP
                  </div>

                  <div className="text-xs text-slate-500">
                    Unlocks at 100%
                  </div>
                </div>

                <div className="font-black text-[#ffd84d]">
                  +{bonusPoints}
                </div>
              </div>

              <div className="grid gap-2">
                {BONUS_HABITS.map((h) => (
                  <button
                    key={h.id}
                    disabled={!bonusUnlocked}
                    onClick={() => toggle("bonus", h)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                      !bonusUnlocked
                        ? "opacity-30"
                        : day.bonus[h.id]
                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                        : "border-[#24364a] bg-[#101d2c]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={16}
                        className="text-[#ffd84d]"
                      />

                      <span>{h.label}</span>
                    </div>

                    <span className="text-[#ffd84d]">
                      +{h.points}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <motion.button
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full rounded-[2rem] border border-[#ffb067]/20 bg-gradient-to-br from-[#ffb067]/30 to-[#ffd84d]/20 px-6 py-6 text-lg font-black text-[#fff2bf] shadow-[0_0_45px_rgba(255,175,90,.18)]"
            >
              Daily Closeout
            </motion.button>
          </motion.div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#24364a] bg-[#08131f]/92 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <button
            onClick={() => setTab("home")}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-black ${
              tab === "home"
                ? "bg-[#152437] text-[#9fd3ff]"
                : "text-slate-500"
            }`}
          >
            <Home size={18} />
            Home
          </button>

          <button
            onClick={() => setTab("today")}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-black ${
              tab === "today"
                ? "bg-[#152437] text-[#9fd3ff]"
                : "text-slate-500"
            }`}
          >
            <Activity size={18} />
            Today
          </button>

          <button className="flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-black text-slate-500">
            <CalendarDays size={18} />
            History
          </button>

          <button className="flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-black text-slate-500">
            <Brain size={18} />
            Intel
          </button>
        </div>
      </nav>
    </div>
  );
}
