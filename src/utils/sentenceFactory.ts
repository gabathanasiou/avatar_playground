import type { Expression } from '../types';

// --- MASSIVE SCI-FI VILLAGER WORD BANK ---
const W = {
    hey: [
        "Hey", "Excuse me", "Listen", "Actually", "Look", "Wait", "By the binary", "Star-blessings", "Honest truth",
        "By the motherboard", "Listen up", "Check it out", "Incredible", "Between us", "Did you see?", "Heads up",
        "Fair warning", "Citizen", "My friend", "Remarkable", "Fascinating", "Digital cheers", "Nebula-blessings",
        "Whoa", "Um", "Yo", "Resident", "Stranger", "Pardon me", "Hey you", "Listen to this", "You know what?",
        "Believe it or not", "The thing is", "Guess what?", "I was thinking", "Maybe...", "Wait a sec", "Oh!",
        "Aha", "Check the logs", "Statistically speaking", "In theory", "Honestly", "Between you and me",
        "Don't tell anyone", "I heard", "Rumor has it", "Fact is", "Basically", "Simply put", "To be fair",
    ],
    who: [
        "the replicator", "the anti-gravity thrusters", "the oxygen scrubber", "the neighborhood drone",
        "the plasma-fence", "my pet robo-cat", "the bio-luminescent garden", "the sub-space router",
        "the holographic laundry", "my nutritional paste", "the gravity floor", "the airlock door",
        "the weather control unit", "the nanite swarm", "the village dome", "the battery",
        "the teleportation pad", "the molecular deconstructor", "the sentient toaster",
        "Sector 7 parking", "the time-travel permit", "the life coach", "the synthetic steak",
        "the data pad", "the energy core", "the cooling vent", "the sensor array", "the comms relay",
        "the landing strut", "the fuel cell", "the heat shield", "the gravity boots", "the laser brush",
        "the neural link", "the memory shard", "the photon lamp", "the cryo-tank", "the hover-board",
        "the matter stream", "the sonic shower", "the nutrient tube", "the cyber-deck", "the logic gate",
        "the fusion coil", "the pulse engine", "the shield emitter", "the tractor beam", "the hydro-farm",
        "the solar sail", "the meteor shield", "the village AI", "the drone swarm", "the air lock",
    ],
    does: [
        "is leaking chronal radiation", "demanded a legal waiver", "is causing existential dread",
        "refused to dispense caffeine", "started humming a melody", "is shedding carbon fiber",
        "demanded a personality update", "is vibrating in 4D", "refused my credit chip",
        "is passive-aggressive", "tripped the safety protocols", "is smelling like burnt ozone",
        "keeps asking philosophical questions", "is haunted by a ghost code",
        "is drawing too much power", "started talking back", "vanished into a wormhole",
        "is glowing neon pink", "is tastes like copper", "is melting slowly", "is growing hair",
        "is reciting poetry", "is dancing alone", "is freezing time", "is eating credits",
        "is producing shadows", "is smelling like space", "is whispering secrets", "is singing shanties",
        "is calculating pi", "is dreaming of sheep", "is leaking blue logic", "is vibrating out of sync",
        "is refusing to boot", "is getting too smart", "is feeling lonely", "is being very rude",
        "is leaking liquid light", "is spinning backwards", "is emitting a low hum", "is shedding pixels",
        "is growing flowers", "is talking to birds", "is floating away", "is ignoring me",
        "is acting suspicious", "is demanding a raise", "is plotting something", "is feeling dizzy",
    ],
    how: [
        "expensive", "unreliable", "over-engineered", "passive-aggressive", "vibrant", "fragile",
        "obsolete", "lethal", "distracting", "chronally-unstable", "sticky", "clunky",
        "illegal", "noisy", "shiny", "geometrically offensive", "historically inaccurate",
        "beautiful", "terrifying", "amazing", "disgusting", "weird", "strange", "bizarre",
        "curious", "fascinating", "boring", "tasty", "smelly", "loud", "silent", "heavy",
        "light", "soft", "hard", "sharp", "dull", "bright", "dark", "dim", "neon", "pastel",
        "metallic", "organic", "synthetic", "real", "fake", "solid", "liquid", "gas", "plasma",
    ],
    action: [
        "recalibrate the mainframe", "check the oxygen seals", "reset the drone", "bypass the firewall",
        "polish the solar panels", "feed the robo-cat", "update the privacy settings",
        "ignore the screaming engine", "pray to the server gods", "avoid Sector 7",
        "reboot the universe", "clean the plasma tubes", "debug the weather", "sync the gravity",
        "patch the reality", "fix the time-leak", "vent the thermal core", "tighten the bolts",
        "reset the logic", "clear the cache", "flush the matter stream", "align the sensors",
        "check the hull", "test the air", "oild the joints", "recharge the cells", "swap the filters",
        "scan the horizon", "watch the stars", "count the nanites", "listen to the hum",
    ],
    time: [
        "at 3:00 AM", "during the solar flare", "whenever it rains plasma", "since the last patch",
        "before the reactor pulses", "every single Tuesday", "while I was sleeping",
        "at the crack of noon", "before the curfew", "during the supernova",
        "after the last reset", "whenever you walk by", "at high tide", "during the ritual",
        "when the moon is blue", "every millennium", "right now", "eventually", "soon-ish",
        "in the next cycle", "before the dome closes", "after the sirens stop",
    ],
    simple: [
        "I like bread", "This place is loud", "Sleep is a myth", "Water tastes metallic", 
        "The sky is too blue", "My feet hurt", "I missed the shuttle", "Syntax is hard",
        "The air is thin", "Silicon is cozy", "Data is beautiful", "Everything is chrome",
        "I need a reboot", "The dome is leaking", "Birds aren't real", "Moon's big today",
        "I forgot my password", "The coffee is cold", "Stars are bright", "I'm bored",
    ]
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- PHRASE VARIANTS FOR ARCHETYPES ---
const P = {
    declarative_start: [
        () => `${pick(W.who)} ${pick(W.does)}`,
        () => `it seems ${pick(W.who)} ${pick(W.does)}`,
        () => `apparently ${pick(W.who)} ${pick(W.does)}`,
        () => `get this: ${pick(W.who)} ${pick(W.does)}`,
    ],
    question_start: [
        () => `Have you noticed that ${pick(W.who)} is ${pick(W.how)}?`,
        () => `Is it just me, or is ${pick(W.who)} getting ${pick(W.how)}?`,
        () => `Do you think ${pick(W.who)} looks ${pick(W.how)}?`,
        () => `Why is ${pick(W.who)} always so ${pick(W.how)}?`,
    ],
    advice_start: [
        () => `You really should ${pick(W.action)}`,
        () => `Maybe someone ought to ${pick(W.action)}`,
        () => `I'd highly recommend you ${pick(W.action)}`,
        () => `If I were you, I'd ${pick(W.action)}`,
    ],
    rumor_start: [
        () => `I heard a rumor that ${pick(W.who)} ${pick(W.does)}`,
        () => `People are saying ${pick(W.who)} ${pick(W.does)}`,
        () => `Word on the street is ${pick(W.who)} ${pick(W.does)}`,
        () => `Rumour has it ${pick(W.who)} ${pick(W.does)}`,
    ],
    exclamation_start: [
        () => `By the stars! My ${pick(W.who)} is ${pick(W.how)}`,
        () => `Great galaxy! ${pick(W.who)} is ${pick(W.how)}`,
        () => `Look at that! ${pick(W.who)} is ${pick(W.how)}`,
        () => `Can you believe it? ${pick(W.who)} is ${pick(W.how)}`,
    ],
    personal_start: [
        () => `I tried to ${pick(W.action)}, but`,
        () => `I was about to ${pick(W.action)}, until`,
        () => `I spent all morning trying to ${pick(W.action)}, yet`,
    ]
};

// --- ARCHEtype BUILDERS ---
const archetypes = {
    DECLARATIVE: () => pick(P.declarative_start)() + " " + pick(W.end) + ".",
    QUESTION: () => pick(P.question_start)(),
    ADVICE: () => pick(P.advice_start)() + ` before ${pick(W.who)} ${pick(W.does)}.`,
    RUMOR: () => pick(P.rumor_start)() + " " + pick(W.time) + ".",
    EXCLAMATION: () => pick(P.exclamation_start)() + " " + pick(W.time) + "!",
    PERSONAL: () => pick(P.personal_start)() + ` ${pick(W.who)} ${pick(W.does)}.`,
    SIMPLE: () => pick(W.simple) + ".",
};

const conjunctions = [
    { text: ". And then", moodShift: "SAME" },
    { text: ". But", moodShift: "CONTRAST" },
    { text: ", also", moodShift: "SAME" },
    { text: ". Because", moodShift: "THINKING" },
    { text: ", yet", moodShift: "SAD" },
    { text: ". Which means", moodShift: "SHOCKED" },
    { text: "... even though", moodShift: "CONTRAST" },
    { text: ". Worse yet,", moodShift: "ANGRY" },
];

const getOppositeMood = (mood: Expression): Expression => {
    const opposites: Record<string, Expression> = {
        HAPPY: 'SAD', SAD: 'HAPPY', ANGRY: 'HAPPY', SHOCKED: 'THINKING', THINKING: 'SHOCKED', SMUG: 'ANGRY', NEUTRAL: 'HAPPY'
    };
    return opposites[mood] || 'NEUTRAL';
};

export interface DialoguePage {
    text: string;
    expression: Expression;
}

const buildPageText = (): string => {
    const keys = Object.keys(archetypes) as (keyof typeof archetypes)[];
    const type = pick(keys);
    let text = archetypes[type]();
    
    // 30% chance to add a prefix
    if (Math.random() < 0.3) {
        text = `${pick(W.hey)}. ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    }
    
    return text;
}

export const generateDialogue = (): DialoguePage[] => {
    const moods: Expression[] = ['HAPPY', 'SAD', 'ANGRY', 'SHOCKED', 'THINKING', 'SMUG'];
    const pages: DialoguePage[] = [];
    
    // Page 1
    const p1Mood = pick(moods) as Expression;
    pages.push({ text: buildPageText(), expression: p1Mood });

    // 75% chance for Page 2
    if (Math.random() < 0.75) {
        const conj = pick(conjunctions);
        let p2Mood: Expression = p1Mood;
        if (conj.moodShift === 'CONTRAST') p2Mood = getOppositeMood(p1Mood);
        else if (conj.moodShift === 'SAME') p2Mood = p1Mood;
        else p2Mood = conj.moodShift as Expression;

        let p2Text = buildPageText();
        // Check if page 2 should be a continuation or a new thought
        if (Math.random() < 0.5) {
            p2Text = `${conj.text} ${p2Text.charAt(0).toLowerCase()}${p2Text.slice(1)}`;
            p2Text = p2Text.replace(/^\. /, "").replace(/^\, /, ", ").replace(/^\.\.\. /, "... ");
        } else {
            const tangents = ["Actually...", "Nevermind,", "Also,", "Wait,", "And another thing!", "On top of that,"];
            p2Text = `${pick(tangents)} ${p2Text.charAt(0).toLowerCase()}${p2Text.slice(1)}`;
        }
        
        pages.push({ text: p2Text, expression: p2Mood });
        
        if (Math.random() < 0.2) {
            pages.push({ 
                text: `Honestly... I think we should just ${pick(W.action)} and forget it.`, 
                expression: 'THINKING' 
            });
        }
    }

    return pages;
};
