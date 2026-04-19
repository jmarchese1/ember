export interface Quote {
  id: string;
  text: string;
  author: string;
  bucket: "stoic" | "athlete" | "growth";
}

export const QUOTES: Quote[] = [
  // Stoic
  { id: "s1", text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s2", text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s3", text: "The obstacle is the way.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s4", text: "He who is brave is free.", author: "Seneca", bucket: "stoic" },
  { id: "s5", text: "We suffer more in imagination than in reality.", author: "Seneca", bucket: "stoic" },
  { id: "s6", text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", bucket: "stoic" },
  { id: "s7", text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca", bucket: "stoic" },
  { id: "s8", text: "No man is free who is not master of himself.", author: "Epictetus", bucket: "stoic" },
  { id: "s9", text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", bucket: "stoic" },
  { id: "s10", text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", bucket: "stoic" },
  { id: "s11", text: "Confine yourself to the present.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s12", text: "How long are you going to wait before you demand the best of yourself?", author: "Epictetus", bucket: "stoic" },
  { id: "s13", text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", bucket: "stoic" },
  { id: "s14", text: "Every new beginning comes from some other beginning's end.", author: "Seneca", bucket: "stoic" },
  { id: "s15", text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s16", text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s17", text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius", bucket: "stoic" },
  { id: "s18", text: "Sometimes even to live is an act of courage.", author: "Seneca", bucket: "stoic" },
  { id: "s19", text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", bucket: "stoic" },
  { id: "s20", text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus", bucket: "stoic" },

  // Athlete
  { id: "a1", text: "Discipline equals freedom.", author: "Jocko Willink", bucket: "athlete" },
  { id: "a2", text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", bucket: "athlete" },
  { id: "a3", text: "The body achieves what the mind believes.", author: "Napoleon Hill", bucket: "athlete" },
  { id: "a4", text: "Excellence is the gradual result of always striving to do better.", author: "Pat Riley", bucket: "athlete" },
  { id: "a5", text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke", bucket: "athlete" },
  { id: "a6", text: "The only bad workout is the one that didn't happen.", author: "Unknown", bucket: "athlete" },
  { id: "a7", text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", bucket: "athlete" },
  { id: "a8", text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger", bucket: "athlete" },
  { id: "a9", text: "Champions keep playing until they get it right.", author: "Billie Jean King", bucket: "athlete" },
  { id: "a10", text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown", bucket: "athlete" },
  { id: "a11", text: "Motivation gets you going. Discipline keeps you growing.", author: "John C. Maxwell", bucket: "athlete" },
  { id: "a12", text: "I've failed over and over again in my life. And that is why I succeed.", author: "Michael Jordan", bucket: "athlete" },
  { id: "a13", text: "Success is usually the culmination of controlling failure.", author: "Sylvester Stallone", bucket: "athlete" },
  { id: "a14", text: "The difference between the impossible and the possible lies in determination.", author: "Tommy Lasorda", bucket: "athlete" },
  { id: "a15", text: "Show up. Every damn day. The gains come from the reps.", author: "Unknown", bucket: "athlete" },
  { id: "a16", text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown", bucket: "athlete" },
  { id: "a17", text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle (via Will Durant)", bucket: "athlete" },
  { id: "a18", text: "The only way to define your limits is by going beyond them.", author: "Arthur C. Clarke", bucket: "athlete" },
  { id: "a19", text: "Don't count the days. Make the days count.", author: "Muhammad Ali", bucket: "athlete" },
  { id: "a20", text: "Sweat is just fat crying.", author: "Unknown", bucket: "athlete" },

  // Growth
  { id: "g1", text: "What you get by achieving your goals is not as important as what you become by achieving them.", author: "Zig Ziglar", bucket: "growth" },
  { id: "g2", text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell", bucket: "growth" },
  { id: "g3", text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", bucket: "growth" },
  { id: "g4", text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", bucket: "growth" },
  { id: "g5", text: "A year from now you may wish you had started today.", author: "Karen Lamb", bucket: "growth" },
  { id: "g6", text: "The quality of your life is determined by the quality of your habits.", author: "James Clear", bucket: "growth" },
  { id: "g7", text: "Become 1% better every day. That's how compounding works.", author: "James Clear", bucket: "growth" },
  { id: "g8", text: "Do not judge me by my success, judge me by how many times I fell down and got back up.", author: "Nelson Mandela", bucket: "growth" },
  { id: "g9", text: "The mind is everything. What you think you become.", author: "Buddha", bucket: "growth" },
  { id: "g10", text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Viktor Frankl", bucket: "growth" },
  { id: "g11", text: "The wound is the place where the Light enters you.", author: "Rumi", bucket: "growth" },
  { id: "g12", text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill", bucket: "growth" },
  { id: "g13", text: "Rest when you're weary. Refresh and renew yourself — but never give up.", author: "Ralph Marston", bucket: "growth" },
  { id: "g14", text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", bucket: "growth" },
  { id: "g15", text: "You cannot swim for new horizons until you have courage to lose sight of the shore.", author: "William Faulkner", bucket: "growth" },
  { id: "g16", text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", bucket: "growth" },
  { id: "g17", text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", bucket: "growth" },
  { id: "g18", text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche", bucket: "growth" },
  { id: "g19", text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", bucket: "growth" },
  { id: "g20", text: "Clarity comes from engagement, not thought.", author: "Marie Forleo", bucket: "growth" },
];

function hashDate(iso: string): number {
  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  return h;
}

export function getDailyQuote(dateISO: string): Quote {
  const idx = hashDate(dateISO) % QUOTES.length;
  return QUOTES[idx];
}

export function getRandomQuote(excludeIds: string[] = []): Quote {
  const pool = QUOTES.filter((q) => !excludeIds.includes(q.id));
  const arr = pool.length ? pool : QUOTES;
  return arr[Math.floor(Math.random() * arr.length)];
}
