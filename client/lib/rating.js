export function getRatingDisplay(rating) {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return { label: "—", color: "text-gray-400" };
  }

  const value = Number(rating);
  const tier = getRatingTier(value);
  return { label: String(value), color: tier.textColor };
}

export function getRatingTier(rating) {
  const value = Number(rating);
  if (!Number.isFinite(value) || value <= 0) {
    return {
      name: "Unrated",
      color: "from-gray-400 to-slate-500",
      badge: "🔘",
      textColor: "text-white",
    };
  }

  if (value < 800) {
    return {
      name: "Newbie",
      color: "from-gray-400 to-slate-500",
      badge: "🌱",
      textColor: "text-gray-100",
    };
  }
  if (value < 1000) {
    return {
      name: "Pupil",
      color: "from-green-500 to-emerald-600",
      badge: "🟢",
      textColor: "text-green-100",
    };
  }
  if (value < 1200) {
    return {
      name: "Specialist",
      color: "from-cyan-500 to-sky-600",
      badge: "🔵",
      textColor: "text-cyan-100",
    };
  }
  if (value < 1400) {
    return {
      name: "Expert",
      color: "from-blue-500 to-indigo-600",
      badge: "⚡",
      textColor: "text-blue-100",
    };
  }
  if (value < 1600) {
    return {
      name: "Candidate Master",
      color: "from-purple-500 to-violet-600",
      badge: "🥈",
      textColor: "text-purple-100",
    };
  }
  if (value < 1900) {
    return {
      name: "Master",
      color: "from-orange-500 to-amber-600",
      badge: "🥇",
      textColor: "text-orange-100",
    };
  }
  if (value < 2200) {
    return {
      name: "International Master",
      color: "from-red-500 to-rose-600",
      badge: "🔥",
      textColor: "text-red-100",
    };
  }

  return {
    name: "Grandmaster",
    color: "from-fuchsia-500 to-pink-600",
    badge: "🏆",
    textColor: "text-fuchsia-100",
  };
}
