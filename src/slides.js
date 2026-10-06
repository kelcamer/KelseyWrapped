/* Every slide is built from data.json, so re-running build_data.py with a
   newer log rewrites the numbers and the roasts follow. Nothing here is
   typed in by hand except the jokes. */
import D from "./data.json";

const f = D.food, g = D.gym, c = D.cross;

const n = (x, d = 0) =>
  Number(x).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const day = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const dayShort = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const pct = (a, b) => Math.round((a / b) * 100);
const mood = (k) => g.moods.find((m) => m.key === k);
const moodFood = (k) => c.mood_food.find((m) => m.key === k);
const lift = (k) => g.lifts[k];

/* 234 days -> "7 months and 21 days" (30.44-day months) */
function monthsAndDays(days) {
  const m = Math.floor(days / 30.44);
  return { m, d: Math.round(days - m * 30.44) };
}

const shake = f.counts["protein shake"];
const shakeMD = monthsAndDays(shake);
const tons = g.volume_lbs / 2000;              // US short tons
const STATUE_TONS = 225;                       // Statue of Liberty, NPS figure
const WERTHERS_KCAL = 23;                      // one Werther's Original hard candy
const proteinKg = f.protein_total_g / 1000;
const hoursHeld = g.hold_seconds / 3600;
const sat = g.by_dow.find((d) => d.dow === "Saturday").n;
const topDow = [...g.by_dow].sort((a, b) => b.n - a.n)[0];
const legCurlSessions = g.exercises.find(([k]) => k === "leg curl")?.[1] ?? 0;
const legCurlHate = (g.hated.find(([k]) => k === "leg curl") || [0, 0])[1];
const unmot = mood("unmotivated"), beast = mood("beast"), fumes = mood("fumes");
const pizzaLift = ((c.after_pizza.avg_volume - c.avg_volume_all) / c.avg_volume_all) * 100;
const burnRatio = c.gym_days.active / c.rest_days.active;
const eatDiff = c.rest_days.kcal - c.gym_days.kcal;

/* Personal records, heaviest first; assisted machines listed apart. */
const PR_NAMES = {
  "leg press": "Leg press", "hip abduction": "Hip abduction", "hip adduction": "Hip adduction",
  "leg extension": "Leg extension", rows: "Rows", "lat pulldown": "Lat pulldown",
  "leg curl": "Leg curl", triceps: "Triceps", "rear delt": "Rear delt", squats: "Squats",
  "shoulder press": "Shoulder press", "lateral raise": "Lateral raise",
};
const prs = Object.entries(PR_NAMES)
  .filter(([k]) => lift(k))
  .map(([k, label]) => ({ label, lbs: lift(k).best, date: lift(k).best_date }))
  .sort((a, b) => b.lbs - a.lbs);

export const CHAPTERS = {
  intro: { name: "Kelsey Wrapped" },
  food: { name: "Food" },
  gym: { name: "Gym" },
  mood: { name: "Mood" },
  cross: { name: "Food meets gym" },
  end: { name: "The receipt" },
};

/* bg is a magnet colour. Roasts are the stickers. `foot` says where the
   number came from, so a joke never hides how thin the data is. */
export const SLIDES = [
  {
    chapter: "intro", bg: "paper", kind: "intro",
    line: `${n(f.days)} days of food. ${g.sessions} gym sessions. One woman. Almost zero Saturdays.`,
    foot: `Food diary ${dayShort(f.first)} ${f.first.slice(0, 4)} to ${dayShort(f.last)} ${f.last.slice(0, 4)}. Gym log ${dayShort(g.first)} to ${dayShort(g.last)} ${g.last.slice(0, 4)}.`,
  },

  // ---------------------------------------------------------------- food
  {
    chapter: "food", bg: "red",
    big: n(shake), unit: "days with a protein shake",
    roast: `Who drinks a protein shake for ${shakeMD.m} months and ${shakeMD.d} days? Apparently Kelsey!`,
    foot: `Counted on the ${n(f.noted_days)} days whose food notes survived Gemini. Every day was logged, so the real number is higher. Longest unbroken run: ${f.streaks["protein shake"].days} days.`,
  },
  {
    chapter: "food", bg: "orange",
    big: n(proteinKg, 1), unit: "kilograms of protein, eaten",
    roast: "That's roughly two golden retrievers of pure protein. The retrievers have not been consulted.",
    foot: `${n(f.protein_total_g)} g over ${n(f.days)} days, ${n(f.protein_avg_g, 1)} g a day on average.`,
  },
  {
    chapter: "food", bg: "yellow",
    big: `${pct(f.protein_100_days, f.days)}%`, unit: "of days cleared 100 g of protein",
    roast: `${n(f.protein_100_days)} days out of ${n(f.days)}. The other ${f.days - f.protein_100_days} are under investigation.`,
    foot: "Protein as logged in the nutrition spreadsheet.",
  },
  {
    chapter: "food", bg: "green",
    big: n(f.usual_breakfast_days), unit: "days of eggs and half a bagel",
    roast: "At this point the bagel has a key to your apartment.",
    foot: `Days where eggs and "1/2 bagel" appear together in a surviving note. Eggs at all: ${n(f.counts.eggs)} days. Cream cheese: ${n(f.counts["cream cheese"])}.`,
  },
  {
    chapter: "food", bg: "blue",
    big: n(f.counts["maple anything"]), unit: "days with something maple",
    roast: "Canada would like a word about a sponsorship deal.",
    foot: "Maple coffee, maple candy, maple syrup: any surviving note with the word maple in it.",
  },
  {
    chapter: "food", bg: "purple", kind: "duo",
    duo: [
      { big: n(f.counts["Werther's"]), unit: "Werther's days" },
      { big: n(f.counts.macaron), unit: "macaron days" },
    ],
    roast: "Candy, but make it grandma. Dessert, but make it French.",
    foot: `Also on the list: HelloFresh ${n(f.counts.HelloFresh)} days, pizza ${n(f.counts.pizza)}, licorice ${n(f.counts.licorice)}.`,
  },
  {
    chapter: "food", bg: "red",
    big: n(f.deficit_days), unit: `days in a calorie deficit, out of ${n(f.days)}`,
    roast: `Average day: ${n(Math.abs(f.net_avg))} calories under. Running a deficit like it's a side hustle.`,
    foot: "Net balance = intake minus BMR minus active burn, from the spreadsheet.",
  },
  {
    chapter: "food", bg: "orange", kind: "line",
    big: n(f.highest_kcal.kcal), unit: `calories on ${day(f.highest_kcal.date)}`,
    roast: `Biggest day on record, and of course it was a ${f.highest_kcal.dow}. We don't talk about it.`,
    chart: {
      title: "Average calories eaten per day, by month",
      points: f.by_month.filter((m) => m.n >= 20).map((m) => ({
        label: new Date(m.month + "-15T12:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        v: m.kcal,
      })),
      unit: "kcal",
    },
    foot: `Smallest day: ${n(f.lowest_kcal.kcal)} calories on ${day(f.lowest_kcal.date)}. Eating more over time while lifting more is the whole point of a recomp.`,
  },
  {
    chapter: "food", bg: "yellow",
    big: n(f.streaks.coffee.days), unit: "days of coffee in a row",
    roast: "The longest relationship in this dataset.",
    foot: `${dayShort(f.streaks.coffee.from)} to ${dayShort(f.streaks.coffee.to)} ${f.streaks.coffee.to.slice(0, 4)}. Coffee shows up on ${n(f.counts.coffee)} days in total.`,
  },

  {
    chapter: "food", bg: "green", kind: "menu",
    unit: "A real day, picked at random",
    foot: `${n(f.menus.length)} days to pick from: the food notes that survived Gemini, minus any day that mentions health stuff.`,
  },

  // ----------------------------------------------------------------- gym
  {
    chapter: "gym", bg: "blue", kind: "trio",
    duo: [
      { big: n(g.sessions), unit: "sessions" },
      { big: n(g.sets), unit: "sets" },
      { big: n(g.reps), unit: "reps" },
    ],
    roast: `One session every ${n(g.gap_avg_days, 1)} days. The longest break was ${g.gap_max_days} days and the machines noticed.`,
    foot: `Every set parsed out of the log, ${dayShort(g.first)} to ${dayShort(g.last)}.`,
  },
  {
    chapter: "gym", bg: "green",
    big: n(g.volume_lbs), unit: "pounds moved",
    roast: `That's ${n(tons / STATUE_TONS, 1)} Statues of Liberty. With a 3-second hold.`,
    foot: `Reps times weight. Assisted pull-ups and dips are left out, since that number is the machine helping. Statue of Liberty: ${STATUE_TONS} tons.`,
  },
  {
    chapter: "gym", bg: "purple",
    big: n(hoursHeld, 1), unit: "hours spent holding still under load",
    roast: "Sixteen hours of not moving, on purpose, while very angry at a machine.",
    foot: "Counts one 3-second hold per rep on every exercise logged with a hold, minus sets marked no hold.",
  },
  {
    chapter: "gym", bg: "red", kind: "emoji",
    big: n(g.emoji["🌈"]), unit: "rainbows",
    roast: "🌈 is the official unit of \"I finished the exercise.\" 💪 and 🔥 are just there for moral support.",
    emoji: [["💪", g.emoji["💪"]], ["🔥", g.emoji["🔥"]], ["🎯", g.emoji["🎯"]], ["✅", g.emoji["✅"]], ["❌", g.emoji["❌"]]],
    foot: "Every emoji in the gym log, counted.",
  },
  {
    chapter: "gym", bg: "orange", kind: "trio",
    duo: [
      { big: n(g.words.fuck), unit: "f-words" },
      { big: n(g.words.lol), unit: "lols" },
      { big: n(g.words.AF), unit: "AFs" },
    ],
    roast: "This isn't a workout log. It's a podcast with sets.",
    foot: `Also: "hard" ${n(g.words.hard)} times, "roasted" ${n(g.words.roasted)}, "brutal" ${n(g.words.brutal)}, "holy shit" ${n(g.words["holy shit"])}.`,
  },
  {
    chapter: "gym", bg: "yellow",
    big: n(legCurlHate), unit: "times you wrote \"because I hate it\" about leg curls",
    roast: `Who swears she hates leg curls, then does them in ${legCurlSessions} sessions anyway? Apparently Kelsey! That's not hate, that's a situationship.`,
    foot: "Also hated, less often: dips, lat pulldowns.",
  },
  {
    chapter: "gym", bg: "blue", kind: "bars",
    big: n(sat), unit: `Saturday session${sat === 1 ? "" : "s"} in ${Math.round((new Date(g.last) - new Date(g.first)) / 2.63e9)} months`,
    roast: `${topDow.dow} is leg day, arm day and every day. Saturday is a protected species.`,
    chart: {
      title: "Gym sessions by weekday",
      bars: g.by_dow.map((d) => ({ label: d.dow.slice(0, 3), full: d.dow, v: d.n })),
      unit: "sessions",
    },
    foot: "Session dates from the log headers.",
  },
  {
    chapter: "gym", bg: "green", kind: "prs",
    big: n(prs[0].lbs), unit: `lb leg press on ${day(prs[0].date)}`,
    roast: "Hip abduction and adduction: the whole stack, both of them. You ran out of machine.",
    prs: prs.slice(0, 8),
    foot: `Best completed set per exercise. Failed attempts marked ❌ don't count. Assisted pull-ups got down to ${lift("pull-ups")?.best} lb of help.`,
  },
  {
    chapter: "gym", bg: "purple",
    big: n(g.unassisted_pullups), unit: "fully unassisted pull-ups",
    roast: `Who does ${g.unassisted_pullups} unassisted pull-ups, then logs one more as "I think that counts?" Apparently Kelsey! The judges are still deliberating.`,
    foot: `No platform, no counterweight. The first one was ${day(g.first_unassisted_pullup)}, and your heart rate hit ${g.hr.max} that day, the highest in the whole log.`,
  },
  {
    chapter: "gym", bg: "red", kind: "duo",
    duo: [
      { big: n(g.words.claude), unit: "Claude mentions" },
      { big: n(g.words.gemini), unit: "Gemini mentions" },
    ],
    roast: "We know who the real spotter is. I'd like to thank the academy.",
    foot: "Times each name appears in the gym log.",
  },

  // ---------------------------------------------------------------- mood
  {
    chapter: "mood", bg: "yellow", kind: "bars",
    big: n(mood("none")?.sessions ?? 0), unit: "sessions with no mood stated",
    roast: "Half the time you just walked in and lifted. No notes. Very mysterious.",
    chart: {
      title: "Sessions by mood",
      bars: g.moods.filter((m) => m.key !== "none").map((m) => ({ label: m.label, full: m.label, v: m.sessions })),
      unit: "sessions", horizontal: true,
    },
    foot: "Mood comes only from the words at the top of each session, like \"strong\", \"tired\" or \"not motivated\".",
  },
  {
    chapter: "mood", bg: "purple", kind: "bars",
    big: n(unmot.avg_volume), unit: "lb per session when unmotivated",
    roast: `Beast mode moved ${n(beast.avg_volume)}. Your worst moods make your best workouts. Spite is a pre-workout.`,
    chart: {
      title: "Average pounds moved per session, by mood",
      bars: [beast, unmot, fumes, mood("sore")].filter(Boolean)
        .map((m) => ({ label: m.label, full: m.label, v: m.avg_volume, hot: m.key === "unmotivated" })),
      unit: "lb", horizontal: true,
    },
    foot: `Unmotivated: ${unmot.sessions} sessions, ${n(unmot.avg_rainbows, 1)} 🌈 each. Beast mode: ${beast.sessions} sessions, ${n(beast.avg_rainbows, 1)} 🌈. Running on fumes was the real low point. Small groups, so treat it as a pattern, not proof.`,
  },

  // ----------------------------------------------------------- crossover
  {
    chapter: "cross", bg: "blue", kind: "pair",
    big: `${n(burnRatio, 1)}×`, unit: "the active burn on gym days",
    roast: `And you eat ${n(eatDiff)} fewer calories on those days. Your stomach did not get the memo.`,
    pair: [
      { label: "Active burn", gym: c.gym_days.active, rest: c.rest_days.active },
      { label: "Calories eaten", gym: c.gym_days.kcal, rest: c.rest_days.kcal },
      { label: "Protein (g)", gym: c.gym_days.protein, rest: c.rest_days.protein },
    ],
    foot: `${c.gym_days.n} gym days against ${c.rest_days.n} rest days, ${dayShort(c.window[0])} to ${dayShort(c.window[1])}.`,
  },
  {
    chapter: "cross", bg: "orange", kind: "scatter",
    big: n(c.r_protein_volume, 2), unit: "correlation between yesterday's protein and today's lifting",
    roast: "Basically zero. Your muscles do not read the spreadsheet.",
    chart: { title: "Protein the day before vs pounds moved", pts: c.pairs, x: "protein the day before (g)", y: "pounds moved" },
    foot: `${c.prev_day_pairs} sessions. Calories the day before did a little better (r = ${n(c.r_kcal_volume, 2)}), still weak.`,
  },
  {
    chapter: "cross", bg: "red",
    big: `${pizzaLift >= 0 ? "+" : ""}${n(pizzaLift, 1)}%`, unit: "weight moved the day after pizza",
    roast: "Statistically meaningless. Spiritually huge. Do not tell your nutritionist.",
    foot: `${c.after_pizza.n} sessions after a pizza day, ${n(c.after_pizza.avg_volume)} lb on average against ${n(c.avg_volume_all)} overall.`,
  },
  {
    chapter: "cross", bg: "green", kind: "duo",
    duo: [
      { big: n(moodFood("beast").kcal), unit: "calories on beast-mode days" },
      { big: n(moodFood("unmotivated").kcal), unit: "calories on unmotivated days" },
    ],
    roast: "Feed the beast, apparently.",
    foot: `Same-day calories. ${moodFood("beast").n} beast-mode days, ${moodFood("unmotivated").n} unmotivated days.`,
  },

  { chapter: "end", bg: "paper", kind: "receipt" },
];

/* Lines for the end-of-year receipt. */
export const RECEIPT = [
  ["Days of food logged", n(f.days)],
  ["Protein shake days", n(shake)],
  ["Protein eaten", `${n(proteinKg, 1)} kg`],
  ["Eggs + half bagel", n(f.usual_breakfast_days)],
  ["Maple days", n(f.counts["maple anything"])],
  ["Werther's days", n(f.counts["Werther's"])],
  ["Macaron days", n(f.counts.macaron)],
  ["Deficit days", n(f.deficit_days)],
  ["Active burn", `${n(f.active_total)} kcal`],
  ["  in Werther's", n(f.active_total / WERTHERS_KCAL)],
  null,
  ["Gym sessions", n(g.sessions)],
  ["Sets", n(g.sets)],
  ["Reps", n(g.reps)],
  ["Pounds moved", n(g.volume_lbs)],
  ["Hours of holds", n(hoursHeld, 1)],
  ["Rainbows", n(g.emoji["🌈"])],
  ["F-words", n(g.words.fuck)],
  ["Unassisted pull-ups", n(g.unassisted_pullups)],
  ["Disputed pull-ups", n(g.unassisted_pullups_disputed)],
  ["Saturdays", n(sat)],
  ["Peak heart rate", `${g.hr.max} bpm`],
  ["Claude mentions", n(g.words.claude)],
];

export const MENUS = f.menus;

export const ROASTS = SLIDES.filter((s) => s.roast).map((s) => s.roast);
