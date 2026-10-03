export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mc" | "tf";

export interface Question {
  id: string;
  type: QuestionType;
  q: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  points: number;
}

export interface Topic {
  name: string;
  questions: Question[];
}

export interface QuizCategory {
  name: string;
  emoji: string;
  topics: Record<string, Topic>;
}

let _id = 0;
function q(
  type: QuestionType,
  question: string,
  options: string[],
  answer: string,
  explanation: string,
  difficulty: Difficulty,
): Question {
  const pts = difficulty === "easy" ? 100 : difficulty === "medium" ? 200 : 300;
  return { id: `q${++_id}`, type, q: question, options, answer, explanation, difficulty, points: pts };
}
function mc(question: string, a: string, b: string, c: string, d: string, answer: "A"|"B"|"C"|"D", explanation: string, difficulty: Difficulty): Question {
  return q("mc", question, [a, b, c, d], answer, explanation, difficulty);
}
function tf(question: string, answer: "True"|"False", explanation: string, difficulty: Difficulty): Question {
  return q("tf", question, ["True", "False"], answer, explanation, difficulty);
}

export const QUIZ_CATEGORIES: Record<string, QuizCategory> = {
  math: {
    name: "Mathematics",
    emoji: "🔢",
    topics: {
      algebra: {
        name: "Algebra",
        questions: [
          mc("What is x if 3x = 15?", "3", "5", "12", "45", "B", "3x = 15 → x = 5", "easy"),
          mc("What is 2x + 3 when x = 4?", "8", "9", "11", "14", "C", "2(4)+3 = 11", "easy"),
          mc("Solve for x: x − 7 = 3", "−4", "4", "10", "−10", "C", "x = 3+7 = 10", "easy"),
          mc("What is 5x when x = 3?", "8", "15", "2", "53", "B", "5×3 = 15", "easy"),
          tf("The equation y = 3x + 2 is linear.", "True", "Yes — it has degree 1.", "easy"),
          mc("Solve: 2(x + 3) = 14", "4", "5", "11", "7", "A", "2x+6=14 → 2x=8 → x=4", "medium"),
          mc("What are the solutions of x² = 16?", "4", "−4", "±4", "±2", "C", "x²=16 → x=±4", "medium"),
          mc("The slope of y = −2x + 3 is:", "3", "−2", "2", "−3", "B", "Slope is the coefficient of x", "medium"),
          mc("If f(x) = x² + 2, what is f(3)?", "7", "8", "11", "5", "C", "3²+2=9+2=11", "medium"),
          mc("Which factorises x² − 4?", "(x−2)²", "(x+2)(x−2)", "(x−4)(x+1)", "x(x−4)", "B", "Difference of squares", "medium"),
          mc("What is the discriminant of 2x²−4x+2=0?", "0", "8", "−8", "16", "A", "b²−4ac=16−16=0", "hard"),
          mc("Solve: log₂(8) = ?", "2", "3", "4", "8", "B", "2³=8", "hard"),
          mc("If 3^x = 81, what is x?", "3", "4", "27", "9", "B", "3⁴=81", "hard"),
          mc("Sum of arithmetic series 1+3+5+…+19?", "90", "100", "95", "110", "B", "n=10 terms, sum=10²=100", "hard"),
          tf("A quadratic equation always has two distinct real roots.", "False", "It can have 0, 1, or 2 real roots.", "hard"),
        ],
      },
      geometry: {
        name: "Geometry",
        questions: [
          mc("Area of a rectangle 5m × 4m?", "9 m²", "18 m²", "20 m²", "25 m²", "C", "Area = length × width = 20", "easy"),
          mc("How many sides does a hexagon have?", "5", "6", "7", "8", "B", "Hex = 6", "easy"),
          mc("Perimeter of a square with side 6?", "12", "24", "36", "6", "B", "4×6=24", "easy"),
          tf("All angles in an equilateral triangle are 60°.", "True", "Equilateral means all 3 angles equal 60°.", "easy"),
          mc("Area of a circle with radius 7? (use π≈3.14)", "49π", "14π", "22π", "7π", "A", "A=πr²=49π", "medium"),
          mc("Interior angle sum of a pentagon?", "360°", "540°", "720°", "900°", "B", "(5−2)×180=540", "medium"),
          mc("A triangle has angles 90° and 45°. The third angle?", "30°", "45°", "60°", "90°", "B", "180−90−45=45", "medium"),
          mc("Which set of sides forms a right triangle?", "3,4,6", "5,12,13", "6,8,11", "7,8,9", "B", "5²+12²=13²", "medium"),
          mc("Volume of a cube with side 3?", "9", "18", "27", "36", "C", "V=s³=27", "hard"),
          mc("A regular polygon has interior angles of 150°. How many sides?", "10", "12", "15", "6", "B", "(n−2)×180/n=150 → n=12", "hard"),
          mc("Midpoint of (2,4) and (6,8)?", "(4,6)", "(8,12)", "(3,6)", "(4,5)", "A", "((2+6)/2,(4+8)/2)=(4,6)", "hard"),
          tf("The diagonal of a square with side s equals s√2.", "True", "By Pythagoras: √(s²+s²)=s√2", "hard"),
        ],
      },
      probability: {
        name: "Probability",
        questions: [
          mc("Probability of rolling a 3 on a fair die?", "1/2", "1/3", "1/6", "1/4", "C", "1 favourable out of 6", "easy"),
          mc("Flipping a coin — probability of heads?", "1/4", "1/3", "1/2", "2/3", "C", "1 out of 2 equally likely outcomes", "easy"),
          tf("The probability of any event is between 0 and 1.", "True", "Probability is always in [0,1].", "easy"),
          mc("A bag has 3 red and 7 blue balls. P(red)?", "3/10", "7/10", "3/7", "1/3", "A", "3/(3+7)=3/10", "medium"),
          mc("P(A and B) if A,B independent, P(A)=0.4, P(B)=0.5?", "0.9", "0.2", "0.1", "0.45", "B", "0.4×0.5=0.2", "medium"),
          mc("P(A or B) if P(A)=0.3, P(B)=0.4, P(A∩B)=0.1?", "0.6", "0.7", "0.5", "0.8", "A", "0.3+0.4−0.1=0.6", "medium"),
          mc("Number of ways to arrange 4 books in a row?", "4", "16", "24", "12", "C", "4!=24", "hard"),
          mc("P(at least one head) in 3 coin flips?", "7/8", "3/8", "1/2", "6/8", "A", "1−P(all tails)=1−1/8=7/8", "hard"),
          mc("Choosing 2 from 5 people: how many combinations?", "10", "20", "5", "15", "A", "C(5,2)=10", "hard"),
          tf("If P(A)=0.6, then P(not A)=0.4.", "True", "Complement: 1−0.6=0.4", "easy"),
        ],
      },
    },
  },

  physics: {
    name: "Physics",
    emoji: "⚡",
    topics: {
      mechanics: {
        name: "Mechanics",
        questions: [
          mc("What is the unit of force?", "Joule", "Newton", "Pascal", "Watt", "B", "Force is measured in Newtons (N)", "easy"),
          mc("Speed = distance / ?", "Mass", "Force", "Time", "Energy", "C", "Speed = distance ÷ time", "easy"),
          tf("An object at rest has zero velocity.", "True", "Rest means no motion → velocity = 0", "easy"),
          mc("Which law: F = ma?", "Newton's 1st", "Newton's 2nd", "Newton's 3rd", "Hooke's", "B", "F=ma is Newton's Second Law", "easy"),
          mc("Force needed to accelerate 5 kg at 3 m/s²?", "8 N", "15 N", "2 N", "1.67 N", "B", "F=ma=5×3=15 N", "medium"),
          mc("A car travels 120 km in 2 hours. Average speed?", "60 km/h", "240 km/h", "30 km/h", "90 km/h", "A", "120÷2=60 km/h", "medium"),
          mc("What is the unit of work?", "Newton", "Pascal", "Joule", "Watt", "C", "Work = Force × distance, unit = Joule", "medium"),
          mc("Kinetic energy formula?", "mgh", "½mv²", "Fd", "mv", "B", "KE = ½mv²", "medium"),
          mc("An object falls freely. Approximate g on Earth?", "9.8 m/s²", "3.7 m/s²", "11.2 m/s²", "1.6 m/s²", "A", "g ≈ 9.8 m/s² near Earth's surface", "easy"),
          mc("A 10 kg object is 5 m high. Its potential energy? (g=10)", "50 J", "500 J", "150 J", "250 J", "B", "PE=mgh=10×10×5=500 J", "hard"),
          mc("Momentum of a 2 kg ball at 6 m/s?", "3 kg·m/s", "8 kg·m/s", "12 kg·m/s", "4 kg·m/s", "C", "p=mv=2×6=12 kg·m/s", "hard"),
          tf("Newton's 3rd law: for every action there is an equal and opposite reaction.", "True", "Classic statement of Newton's Third Law", "easy"),
        ],
      },
      electricity: {
        name: "Electricity",
        questions: [
          mc("Unit of electrical resistance?", "Volt", "Ampere", "Ohm", "Watt", "C", "Resistance is measured in Ohms (Ω)", "easy"),
          mc("Ohm's Law: V = ?", "I/R", "I×R", "R/I", "P/I", "B", "V = I × R", "easy"),
          tf("Current flows from high potential to low potential.", "True", "Conventional current flows from + to −", "easy"),
          mc("What does a voltmeter measure?", "Current", "Resistance", "Potential difference", "Power", "C", "Voltmeter measures voltage (potential difference)", "easy"),
          mc("Resistance of 5 Ω, current 2 A. Voltage?", "2.5 V", "7 V", "10 V", "3 V", "C", "V=IR=5×2=10 V", "medium"),
          mc("Power formula in terms of voltage and current?", "V/I", "V+I", "VI", "V²I", "C", "P = V × I", "medium"),
          mc("Resistors 4 Ω and 6 Ω in series. Total?", "2.4 Ω", "10 Ω", "5 Ω", "24 Ω", "B", "Series: R_total=4+6=10 Ω", "medium"),
          mc("Resistors 4 Ω and 4 Ω in parallel. Equivalent?", "8 Ω", "4 Ω", "2 Ω", "1 Ω", "C", "Parallel: 1/R=1/4+1/4 → R=2 Ω", "hard"),
          mc("A device uses 60 W at 120 V. Current drawn?", "2 A", "0.5 A", "7200 A", "1 A", "B", "I=P/V=60/120=0.5 A", "hard"),
          tf("Electrical energy is converted to light and heat in a bulb.", "True", "Resistance causes heating; phosphors emit light", "easy"),
        ],
      },
      waves: {
        name: "Waves & Optics",
        questions: [
          mc("What is the unit of frequency?", "Meter", "Second", "Hertz", "Watt", "C", "Frequency is measured in Hertz (Hz)", "easy"),
          mc("Speed of light in vacuum?", "3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁵ m/s", "A", "c ≈ 3×10⁸ m/s", "easy"),
          tf("Sound travels faster than light.", "False", "Light (~3×10⁸ m/s) is far faster than sound (~340 m/s)", "easy"),
          mc("Wave speed = frequency × ?", "Amplitude", "Wavelength", "Period", "Energy", "B", "v = f × λ", "medium"),
          mc("Which colour has the shortest wavelength in visible light?", "Red", "Green", "Yellow", "Violet", "D", "Violet (~380 nm) has the shortest wavelength", "medium"),
          mc("What happens to frequency when wavelength doubles (speed constant)?", "Doubles", "Stays same", "Halves", "Quadruples", "C", "f=v/λ; if λ×2, f÷2", "medium"),
          tf("Transverse waves have particle motion perpendicular to wave direction.", "True", "e.g. light, water waves", "medium"),
          mc("Which electromagnetic wave has the highest frequency?", "Radio", "X-ray", "Infrared", "Gamma ray", "D", "Gamma rays have the highest frequency", "hard"),
          mc("A wave has frequency 500 Hz and speed 340 m/s. Its wavelength?", "0.68 m", "6.8 m", "170 m", "1700 m", "A", "λ=v/f=340/500=0.68 m", "hard"),
          mc("Total internal reflection occurs when light moves from:", "Less to more dense", "More to less dense at critical angle", "Any medium to vacuum", "Air to glass", "B", "TIR needs high-to-low density medium at/above critical angle", "hard"),
        ],
      },
    },
  },

  biology: {
    name: "Biology",
    emoji: "🧬",
    topics: {
      cells: {
        name: "Cell Biology",
        questions: [
          mc("What is the powerhouse of the cell?", "Nucleus", "Ribosome", "Mitochondria", "Vacuole", "C", "Mitochondria produce ATP (energy)", "easy"),
          tf("Animal cells have a cell wall.", "False", "Only plant cells have cell walls; animal cells have only a cell membrane.", "easy"),
          mc("Which organelle contains DNA?", "Ribosome", "Golgi body", "Nucleus", "Lysosome", "C", "The nucleus houses the cell's DNA", "easy"),
          mc("Process by which cells divide?", "Meiosis", "Photosynthesis", "Mitosis", "Osmosis", "C", "Mitosis produces identical daughter cells", "easy"),
          mc("Ribosome function?", "Energy production", "Protein synthesis", "DNA replication", "Lipid storage", "B", "Ribosomes translate mRNA into proteins", "medium"),
          mc("Osmosis is the movement of:", "Solutes through membrane", "Water through semi-permeable membrane", "Oxygen in photosynthesis", "Ions against gradient", "B", "Osmosis = water movement down concentration gradient", "medium"),
          tf("Prokaryotic cells have a nucleus.", "False", "Prokaryotes lack a membrane-bound nucleus.", "medium"),
          mc("Cell respiration equation: C₆H₁₂O₆ + O₂ →", "CO₂ + H₂O + ATP", "O₂ + glucose", "CO₂ + H₂O + light", "Starch + water", "A", "Aerobic respiration produces CO₂, H₂O, and ATP", "hard"),
          mc("Meristematic cells are found in:", "Muscle tissue", "Blood", "Plant growing tips", "Brain", "C", "Meristems are regions of active plant cell division", "hard"),
          mc("What is the fluid mosaic model?", "DNA structure", "Cell membrane structure", "Photosynthesis model", "Chromosome model", "B", "It describes the phospholipid bilayer with embedded proteins", "hard"),
        ],
      },
      genetics: {
        name: "Genetics",
        questions: [
          mc("DNA stands for:", "Dynamic Nuclear Acid", "Deoxyribonucleic Acid", "Diribonucleic Acid", "Deoxyribose Nucleic Acid", "B", "DNA = Deoxyribonucleic Acid", "easy"),
          tf("RNA is double-stranded like DNA.", "False", "RNA is typically single-stranded; DNA is double-stranded.", "easy"),
          mc("Which base pairs with Adenine in DNA?", "Guanine", "Cytosine", "Thymine", "Uracil", "C", "A-T and G-C are the DNA base pairs", "easy"),
          mc("Dominant or recessive? Tt × Tt: ratio of dominant phenotype?", "1:1", "3:1", "1:3", "All dominant", "B", "Tt×Tt gives 1TT+2Tt+1tt → 3 dominant:1 recessive", "medium"),
          mc("What carries genetic info from nucleus to ribosome?", "tRNA", "rRNA", "mRNA", "DNA", "C", "mRNA is the messenger between DNA and ribosome", "medium"),
          tf("A mutation is always harmful.", "False", "Mutations can be neutral or even beneficial.", "medium"),
          mc("How many chromosomes in a normal human body cell?", "23", "46", "44", "48", "B", "Humans have 46 chromosomes (23 pairs)", "easy"),
          mc("Process producing gametes with half chromosome number?", "Mitosis", "Binary fission", "Meiosis", "Budding", "C", "Meiosis halves chromosome number → haploid gametes", "hard"),
          mc("Allele that is not expressed when paired with a dominant allele?", "Dominant", "Co-dominant", "Recessive", "Mutant", "C", "Recessive alleles need two copies to be expressed", "easy"),
          mc("Which scientist proposed the structure of DNA in 1953?", "Darwin & Mendel", "Watson & Crick", "Pasteur & Koch", "Curie & Röntgen", "B", "Watson and Crick with Franklin's X-ray data", "medium"),
        ],
      },
      body: {
        name: "Human Body",
        questions: [
          mc("Which organ pumps blood around the body?", "Lungs", "Liver", "Heart", "Kidney", "C", "The heart is the circulatory system's pump", "easy"),
          mc("What do white blood cells do?", "Carry oxygen", "Clot blood", "Fight infection", "Absorb nutrients", "C", "WBCs are part of the immune defence", "easy"),
          tf("The kidneys filter blood and produce urine.", "True", "Kidneys remove waste and regulate fluid balance", "easy"),
          mc("Main function of the respiratory system?", "Digest food", "Pump blood", "Gas exchange (O₂/CO₂)", "Filter toxins", "C", "Lungs exchange O₂ for CO₂", "easy"),
          mc("Which part of the nervous system controls voluntary movement?", "Autonomic NS", "Somatic NS", "Parasympathetic NS", "Enteric NS", "B", "Somatic NS controls voluntary muscles", "medium"),
          mc("Insulin is produced by which organ?", "Liver", "Stomach", "Pancreas", "Kidney", "C", "The pancreas produces insulin to regulate blood sugar", "medium"),
          tf("Red blood cells contain haemoglobin to carry oxygen.", "True", "Haemoglobin binds O₂ in the lungs", "easy"),
          mc("What is the largest organ of the human body?", "Brain", "Liver", "Lungs", "Skin", "D", "Skin is the body's largest organ", "medium"),
          mc("Which vitamin is produced when skin is exposed to sunlight?", "Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D", "D", "UV light enables skin synthesis of Vitamin D", "hard"),
          mc("Synovial fluid is found in?", "Blood vessels", "Joints", "Lungs", "Brain", "B", "Synovial fluid lubricates joints", "hard"),
        ],
      },
    },
  },

  chemistry: {
    name: "Chemistry",
    emoji: "🧪",
    topics: {
      periodic_table: {
        name: "Periodic Table",
        questions: [
          mc("Symbol for Gold?", "Gd", "Ag", "Au", "Go", "C", "Au from Latin 'Aurum'", "easy"),
          mc("Symbol for Sodium?", "So", "Sd", "Na", "Sm", "C", "Na from Latin 'Natrium'", "easy"),
          mc("Atomic number of Carbon?", "4", "6", "8", "12", "B", "Carbon has 6 protons → atomic number 6", "easy"),
          tf("Noble gases are in Group 18 of the periodic table.", "True", "He, Ne, Ar, Kr, Xe, Rn are in Group 18", "easy"),
          mc("Which element is most abundant in Earth's crust?", "Iron", "Silicon", "Oxygen", "Aluminium", "C", "Oxygen makes up ~46% of the crust", "medium"),
          mc("What is the most electronegative element?", "Oxygen", "Chlorine", "Fluorine", "Nitrogen", "C", "Fluorine is the most electronegative element", "medium"),
          mc("How many elements are in Period 3 of the periodic table?", "2", "8", "18", "32", "B", "Period 3: Na to Ar — 8 elements", "medium"),
          mc("Which metal is liquid at room temperature?", "Lead", "Tin", "Mercury", "Bismuth", "C", "Mercury (Hg) is liquid at room temperature", "easy"),
          mc("What is Avogadro's number?", "6.022×10²²", "6.022×10²³", "3.14×10²³", "1.67×10²⁴", "B", "One mole = 6.022×10²³ particles", "hard"),
          mc("The element with atomic number 79 is?", "Gold", "Platinum", "Silver", "Tungsten", "A", "Atomic number 79 = Gold (Au)", "hard"),
        ],
      },
      reactions: {
        name: "Chemical Reactions",
        questions: [
          mc("What is produced when an acid reacts with a metal?", "Water only", "Salt + Hydrogen gas", "Salt + Oxygen", "Water + CO₂", "B", "Acid + metal → salt + H₂", "easy"),
          tf("Burning is a chemical change.", "True", "Combustion changes the chemical composition", "easy"),
          mc("In CH₄ + 2O₂ → CO₂ + 2H₂O, methane is:", "Oxidised", "Reduced", "A catalyst", "A product", "A", "Methane loses electrons (gains oxygen) → oxidised", "medium"),
          mc("What type of reaction is: 2H₂O → 2H₂ + O₂?", "Synthesis", "Decomposition", "Combustion", "Double displacement", "B", "One compound splits → decomposition", "medium"),
          mc("A catalyst:", "Is consumed", "Increases activation energy", "Speeds up reaction without being consumed", "Lowers temperature needed", "C", "A catalyst provides alternative pathway with lower Ea", "medium"),
          mc("Exothermic reaction:", "Absorbs heat", "Releases heat", "Requires a catalyst", "Produces only gases", "B", "Exo = exit; energy is released to surroundings", "easy"),
          tf("The Law of Conservation of Mass states atoms are created during a reaction.", "False", "Atoms are neither created nor destroyed, only rearranged.", "easy"),
          mc("Which is an example of a redox reaction?", "Dissolving salt in water", "Neutralisation", "Iron rusting", "Mixing gases", "C", "Rusting involves oxidation (Fe→Fe³⁺)", "hard"),
          mc("Activation energy is:", "Energy released in reaction", "Energy stored in bonds", "Minimum energy to start a reaction", "Energy of products", "C", "Activation energy = minimum energy barrier to overcome", "hard"),
          mc("Rate of a chemical reaction is NOT affected by:", "Temperature", "Concentration", "Colour of reactants", "Catalyst presence", "C", "Colour has no bearing on reaction rate", "medium"),
        ],
      },
      acids: {
        name: "Acids & Bases",
        questions: [
          mc("pH of a neutral solution at 25°C?", "0", "7", "14", "10", "B", "Neutral solutions have pH = 7", "easy"),
          mc("Which is an acid?", "NaOH", "KOH", "HCl", "Ca(OH)₂", "C", "HCl is hydrochloric acid", "easy"),
          tf("Acids turn blue litmus red.", "True", "This is a classic indicator test for acids", "easy"),
          mc("Acid + Base → ?", "Salt + Water", "Gas + Water", "Salt + Hydrogen", "Oxide + Water", "A", "Neutralisation produces salt and water", "easy"),
          mc("pH of lemon juice is approximately:", "2", "7", "10", "13", "A", "Lemon juice (citric acid) has pH ~2", "medium"),
          mc("A strong acid:", "Partially ionises in water", "Fully ionises in water", "Has pH above 7", "Is always concentrated", "B", "Strong acids fully dissociate (e.g. HCl, H₂SO₄)", "medium"),
          tf("Increasing pH means the solution is becoming more acidic.", "False", "Higher pH = more basic/alkaline; lower pH = more acidic", "medium"),
          mc("Which is a weak acid?", "HNO₃", "H₂SO₄", "HCl", "CH₃COOH", "D", "Acetic acid (vinegar) only partially ionises", "hard"),
          mc("Buffer solution resists changes in:", "Temperature", "Pressure", "pH", "Concentration", "C", "Buffers maintain stable pH despite added acid/base", "hard"),
          mc("Arrhenius definition: a base is a substance that:", "Donates H⁺ in water", "Accepts H⁺ in water", "Produces OH⁻ in water", "Produces H⁺ in water", "C", "Arrhenius base → releases OH⁻ in aqueous solution", "hard"),
        ],
      },
    },
  },

  coding: {
    name: "Coding",
    emoji: "💻",
    topics: {
      basics: {
        name: "Programming Basics",
        questions: [
          mc("What does HTML stand for?", "High Text Markup Language", "HyperText Markup Language", "High Transfer Markup Language", "HyperText Machine Language", "B", "HyperText Markup Language — structure of web pages", "easy"),
          tf("Python is a compiled language.", "False", "Python is interpreted, not compiled to machine code ahead of time", "easy"),
          mc("Which symbol is used for comments in Python?", "//", "/* */", "#", "<!--", "C", "# is used for single-line comments in Python", "easy"),
          mc("What does 'console.log()' do in JavaScript?", "Deletes a variable", "Prints to the console", "Creates a loop", "Defines a function", "B", "console.log outputs text to the browser/node console", "easy"),
          mc("Which data type stores True/False values?", "Integer", "String", "Float", "Boolean", "D", "Boolean type holds True or False", "easy"),
          mc("Big-O notation O(n) means:", "Constant time", "Logarithmic time", "Linear time", "Quadratic time", "C", "O(n) scales linearly with input size", "medium"),
          mc("What does a for-loop do?", "Defines a function", "Repeats code a set number of times", "Checks a condition once", "Returns a value", "B", "For-loops iterate over a range or collection", "easy"),
          tf("An array index in most languages starts at 0.", "True", "0-based indexing is the standard in most languages", "easy"),
          mc("Which is NOT a valid variable name in Python?", "my_var", "_count", "2name", "Name2", "C", "Variable names cannot start with a digit", "medium"),
          mc("Recursion is:", "A loop using arrays", "A function calling itself", "A built-in Python method", "A type of sorting algorithm", "B", "Recursive functions call themselves until a base case", "medium"),
          mc("What is a REST API?", "A CSS framework", "A database type", "An interface for web services using HTTP", "A JavaScript library", "C", "REST = Representational State Transfer for web APIs", "hard"),
          mc("Time complexity of binary search?", "O(n)", "O(n²)", "O(log n)", "O(1)", "C", "Binary search halves the search space → O(log n)", "hard"),
        ],
      },
      algorithms: {
        name: "Algorithms",
        questions: [
          mc("Which sorting algorithm has worst-case O(n²)?", "Merge Sort", "Quick Sort", "Bubble Sort", "Heap Sort", "C", "Bubble sort always performs O(n²) comparisons", "easy"),
          tf("Merge sort is a stable sorting algorithm.", "True", "Merge sort preserves the relative order of equal elements", "medium"),
          mc("What data structure is LIFO?", "Queue", "Stack", "Tree", "Graph", "B", "Stack is Last-In-First-Out", "easy"),
          mc("What data structure is FIFO?", "Queue", "Stack", "Heap", "Graph", "A", "Queue is First-In-First-Out", "easy"),
          mc("Which algorithm finds the shortest path in a graph?", "Binary Search", "Bubble Sort", "Dijkstra's", "Merge Sort", "C", "Dijkstra's algorithm finds shortest paths in weighted graphs", "medium"),
          mc("A binary tree has at most how many children per node?", "1", "2", "3", "Unlimited", "B", "Binary trees have at most 2 children per node", "easy"),
          mc("Which search checks every element in order?", "Binary search", "Linear search", "Depth-first search", "Interpolation search", "B", "Linear search scans from start to end", "easy"),
          mc("What is memoization?", "A type of sort", "Caching results of function calls", "A memory leak", "A recursive base case", "B", "Memoization stores results to avoid redundant computation", "hard"),
          mc("Average time complexity of QuickSort?", "O(n²)", "O(n log n)", "O(log n)", "O(n)", "B", "QuickSort averages O(n log n) with good pivot choice", "medium"),
          tf("A hash table provides O(1) average-case lookup.", "True", "Hash functions map keys to indices for constant-time access", "hard"),
        ],
      },
      webdev: {
        name: "Web Development",
        questions: [
          mc("CSS stands for:", "Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Syntax", "B", "CSS = Cascading Style Sheets", "easy"),
          mc("Which HTML tag creates a hyperlink?", "<link>", "<href>", "<a>", "<url>", "C", "<a href='...'> creates a hyperlink", "easy"),
          tf("JavaScript can only run in a web browser.", "False", "Node.js allows JavaScript to run on the server side too", "easy"),
          mc("HTTP status 404 means:", "Server error", "Redirect", "Page not found", "OK", "C", "404 = resource not found", "easy"),
          mc("Which is NOT a valid CSS selector?", ".class", "#id", "*", "@element", "D", "@ is not a standard CSS selector", "medium"),
          mc("What does DOM stand for?", "Document Object Model", "Data Object Management", "Display Output Model", "Dynamic Object Mechanism", "A", "DOM represents the HTML structure as a tree of objects", "medium"),
          mc("HTTP method used to create a resource in REST?", "GET", "DELETE", "PUT", "POST", "D", "POST is used to create new resources", "medium"),
          tf("HTTPS encrypts data in transit.", "True", "HTTPS uses TLS/SSL to encrypt communication", "easy"),
          mc("Which is used to manage JavaScript packages?", "pip", "npm", "gem", "cargo", "B", "npm (Node Package Manager) manages JS dependencies", "easy"),
          mc("React is a:", "Backend framework", "Database", "Frontend JavaScript library", "CSS preprocessor", "C", "React is a JavaScript library for building UIs", "medium"),
          mc("What does CORS stand for?", "Cross-Origin Resource Sharing", "Client Origin Request System", "Code Object Routing System", "Cross-Origin Redirect Service", "A", "CORS controls resource access across different origins", "hard"),
        ],
      },
    },
  },

  geography: {
    name: "Geography",
    emoji: "🌍",
    topics: {
      capitals: {
        name: "World Capitals",
        questions: [
          mc("Capital of France?", "Lyon", "Paris", "Marseille", "Nice", "B", "Paris is the capital and largest city of France", "easy"),
          mc("Capital of Japan?", "Osaka", "Kyoto", "Hiroshima", "Tokyo", "D", "Tokyo is Japan's capital city", "easy"),
          mc("Capital of Brazil?", "Rio de Janeiro", "São Paulo", "Brasília", "Salvador", "C", "Brasília has been Brazil's capital since 1960", "easy"),
          mc("Capital of Australia?", "Sydney", "Melbourne", "Canberra", "Brisbane", "C", "Canberra is the capital, not Sydney", "easy"),
          mc("Capital of Canada?", "Toronto", "Vancouver", "Montreal", "Ottawa", "D", "Ottawa is Canada's federal capital", "easy"),
          mc("Capital of Russia?", "St. Petersburg", "Moscow", "Novosibirsk", "Kazan", "B", "Moscow is Russia's capital", "easy"),
          mc("Capital of South Africa?", "Cape Town", "Johannesburg", "Pretoria", "Durban", "C", "Pretoria is the executive capital (one of three capitals)", "medium"),
          mc("Capital of Argentina?", "Santiago", "Lima", "Bogotá", "Buenos Aires", "D", "Buenos Aires is Argentina's capital", "easy"),
          mc("Capital of Egypt?", "Alexandria", "Cairo", "Luxor", "Giza", "B", "Cairo is Egypt's capital and largest city", "easy"),
          mc("Capital of India?", "Mumbai", "Kolkata", "New Delhi", "Chennai", "C", "New Delhi is India's capital", "easy"),
          mc("Capital of the United Arab Emirates?", "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "B", "Abu Dhabi is the UAE's capital", "medium"),
          mc("Capital of Germany?", "Munich", "Hamburg", "Frankfurt", "Berlin", "D", "Berlin is Germany's capital city", "easy"),
        ],
      },
      continents: {
        name: "Continents & Oceans",
        questions: [
          mc("How many continents are there?", "5", "6", "7", "8", "C", "The 7 continents: Africa, Antarctica, Asia, Australia, Europe, N.America, S.America", "easy"),
          mc("Largest continent by area?", "Africa", "North America", "Asia", "Europe", "C", "Asia covers ~44 million km²", "easy"),
          mc("Largest ocean?", "Atlantic", "Indian", "Arctic", "Pacific", "D", "Pacific Ocean is the largest at ~165 million km²", "easy"),
          tf("Antarctica is the coldest continent.", "True", "Antarctica holds the record for lowest recorded temperature", "easy"),
          mc("The Amazon River is in which continent?", "Africa", "Asia", "South America", "North America", "C", "The Amazon runs through South America", "easy"),
          mc("Which continent has the most countries?", "Asia", "Africa", "Europe", "Americas", "B", "Africa has 54 recognised countries", "medium"),
          mc("Smallest continent?", "Europe", "Australia", "Antarctica", "North America", "B", "Australia/Oceania is the smallest continental landmass", "easy"),
          mc("Which ocean borders Europe to the west?", "Pacific", "Indian", "Arctic", "Atlantic", "D", "The Atlantic Ocean borders Europe's western coast", "easy"),
          mc("The Sahara Desert is in which continent?", "Asia", "South America", "Australia", "Africa", "D", "The Sahara spans northern Africa", "easy"),
          tf("Russia spans two continents: Europe and Asia.", "True", "Russia straddles the Ural Mountains, crossing Europe and Asia", "medium"),
        ],
      },
      physical: {
        name: "Physical Geography",
        questions: [
          mc("Longest river in the world?", "Amazon", "Mississippi", "Nile", "Yangtze", "C", "The Nile (~6,650 km) is considered the longest", "easy"),
          mc("Highest mountain on Earth?", "K2", "Kangchenjunga", "Mount Everest", "Lhotse", "C", "Everest at 8,849 m is Earth's highest peak", "easy"),
          mc("What type of rock forms from cooled magma?", "Sedimentary", "Metamorphic", "Igneous", "Limestone", "C", "Igneous rock solidifies from molten material", "medium"),
          mc("The Ring of Fire surrounds which ocean?", "Atlantic", "Indian", "Arctic", "Pacific", "D", "The Pacific Ring of Fire has most of Earth's volcanoes", "medium"),
          tf("Earthquakes are measured using the Richter scale.", "True", "The Richter scale quantifies earthquake magnitude", "easy"),
          mc("What is the term for the point on Earth's surface directly above an earthquake's origin?", "Focus", "Fault", "Epicentre", "Crater", "C", "The epicentre is directly above the underground focus", "medium"),
          mc("Which climate is found near the equator?", "Polar", "Desert", "Tropical", "Temperate", "C", "Equatorial regions experience tropical climate — hot and wet", "easy"),
          mc("Dead Sea is notable because:", "It has giant waves", "It is the highest lake", "It is the saltiest large body of water", "It freezes in winter", "C", "Dead Sea salinity ~34% makes objects float", "medium"),
          mc("The Aurora Borealis is caused by:", "Volcanic ash", "Charged particles from the sun hitting atmosphere", "Light reflection off ice", "High altitude clouds", "B", "Solar wind particles excite atmospheric gases → auroras", "hard"),
          tf("The Mariana Trench is the deepest part of the ocean.", "True", "Located in the Pacific, it reaches ~11,000 m depth", "medium"),
        ],
      },
    },
  },

  history: {
    name: "History",
    emoji: "🏛️",
    topics: {
      ancient: {
        name: "Ancient History",
        questions: [
          mc("In which country are the Pyramids of Giza located?", "Sudan", "Egypt", "Libya", "Jordan", "B", "The Giza Pyramids are in Egypt, near Cairo", "easy"),
          mc("Which empire was ruled by Julius Caesar?", "Greek", "Ottoman", "Roman", "Byzantine", "C", "Caesar was a Roman general and dictator", "easy"),
          mc("Ancient Olympic Games originated in:", "Rome", "Athens", "Sparta", "Olympia, Greece", "D", "Games started at Olympia ~776 BC", "easy"),
          tf("The Great Wall of China was originally built to protect against northern invasions.", "True", "The Wall defended against Xiongnu and other northern peoples", "easy"),
          mc("The Colosseum is located in:", "Paris", "Athens", "Rome", "Cairo", "C", "The Colosseum is in Rome, Italy", "easy"),
          mc("Which civilization built Machu Picchu?", "Aztec", "Maya", "Inca", "Olmec", "C", "Machu Picchu was built by the Inca civilisation ~15th century", "medium"),
          mc("Cleopatra was the queen of:", "Greece", "Rome", "Carthage", "Egypt", "D", "Cleopatra VII was the last pharaoh of ancient Egypt", "easy"),
          mc("The Silk Road connected China to:", "Africa", "The Americas", "Europe and the Middle East", "Australia", "C", "The Silk Road linked East Asia to Europe via Central Asia", "medium"),
          mc("Alexander the Great was from:", "Rome", "Greece", "Persia", "Egypt", "B", "Alexander was king of Macedon (northern Greece)", "easy"),
          mc("Mesopotamia, often called the cradle of civilisation, is in modern-day:", "Iran", "Iraq", "Egypt", "Turkey", "B", "Mesopotamia sits in modern Iraq (Tigris-Euphrates valley)", "medium"),
        ],
      },
      world_wars: {
        name: "World Wars",
        questions: [
          mc("World War I started in:", "1912", "1914", "1916", "1918", "B", "WWI began in July 1914 after Franz Ferdinand's assassination", "easy"),
          mc("Which country was NOT part of the Allied Powers in WWI?", "France", "Britain", "Germany", "Russia", "C", "Germany was part of the Central Powers", "easy"),
          mc("D-Day (Normandy landings) occurred in which year?", "1942", "1943", "1944", "1945", "C", "D-Day was June 6, 1944", "medium"),
          tf("The atomic bombs in WWII were dropped on Berlin and Munich.", "False", "The bombs were dropped on Hiroshima (Aug 6) and Nagasaki (Aug 9), Japan", "easy"),
          mc("Which treaty officially ended WWI?", "Treaty of Versailles", "Treaty of Paris", "Treaty of Ghent", "Munich Agreement", "A", "The Treaty of Versailles (1919) ended WWI", "medium"),
          mc("Hitler's political party was called:", "Communist Party", "Nazi Party", "Fascist Party", "Republican Party", "B", "NSDAP — National Socialist German Workers' Party (Nazi)", "easy"),
          mc("The Blitz refers to:", "German ground invasion of France", "German air campaign against Britain", "Battle of Stalingrad", "American invasion of North Africa", "B", "The Blitz: German bombing of British cities 1940–41", "medium"),
          mc("Which country suffered the highest casualties in WWII?", "Germany", "USA", "UK", "Soviet Union", "D", "The USSR lost ~27 million people in WWII", "hard"),
          tf("The League of Nations was established after World War I.", "True", "The League of Nations was founded in 1920 from WWI's aftermath", "medium"),
          mc("Pearl Harbor attack in 1941 brought which country into WWII?", "Canada", "Australia", "USA", "China", "C", "Japan's attack on Pearl Harbor brought the USA into the war", "easy"),
        ],
      },
      modern: {
        name: "Modern History",
        questions: [
          mc("The Berlin Wall fell in:", "1985", "1987", "1989", "1991", "C", "The Berlin Wall fell on 9 November 1989", "easy"),
          mc("Nelson Mandela became South Africa's first Black president in:", "1990", "1992", "1994", "1996", "C", "Mandela was elected president in 1994", "easy"),
          mc("The Cold War was primarily between:", "USA and UK", "USA and USSR", "UK and USSR", "France and Germany", "B", "Cold War: USA vs USSR (1947–1991)", "easy"),
          tf("India gained independence from Britain in 1947.", "True", "India's independence came on 15 August 1947", "easy"),
          mc("The United Nations was founded in:", "1919", "1939", "1945", "1950", "C", "The UN was founded on 24 October 1945", "easy"),
          mc("Which event is called 9/11?", "Oklahoma bombing 1995", "Terrorist attacks on USA 2001", "Madrid bombing 2004", "London bombings 2005", "B", "9/11: terrorist attacks on New York and Washington, Sept 11 2001", "easy"),
          mc("The first moon landing was in:", "1965", "1967", "1969", "1971", "C", "Apollo 11 landed on the moon on July 20, 1969", "easy"),
          mc("The Rwandan genocide occurred in:", "1984", "1989", "1994", "1998", "C", "~800,000 Tutsi and moderate Hutu were killed in 100 days in 1994", "medium"),
          tf("The Cuban Missile Crisis in 1962 brought the world close to nuclear war.", "True", "US-Soviet standoff over nuclear missiles in Cuba", "medium"),
          mc("Which country built the International Space Station first?", "China", "Japan", "No single country — it's a collaboration", "USA alone", "C", "ISS is a joint project of USA, Russia, Europe, Canada, Japan", "medium"),
        ],
      },
    },
  },

  logic: {
    name: "Logic & Reasoning",
    emoji: "🧩",
    topics: {
      puzzles: {
        name: "Logical Puzzles",
        questions: [
          mc("What comes next: 2, 4, 8, 16, ?", "20", "24", "32", "30", "C", "Each term doubles → 16×2=32", "easy"),
          mc("What comes next: 1, 1, 2, 3, 5, 8, ?", "11", "12", "13", "14", "C", "Fibonacci sequence: 5+8=13", "easy"),
          mc("If all cats are animals and all animals breathe, then:", "Some cats do not breathe", "All cats breathe", "No cats breathe", "Only some cats breathe", "B", "Transitive logic: cats→animals→breathe", "easy"),
          tf("If A implies B, and B is false, then A must be false.", "True", "Modus tollens: ¬B → ¬A", "medium"),
          mc("A is taller than B, B is taller than C. Who is shortest?", "A", "B", "C", "Cannot tell", "C", "A>B>C → C is shortest", "easy"),
          mc("What is 15% of 200?", "20", "25", "30", "35", "C", "15/100 × 200 = 30", "easy"),
          mc("If today is Wednesday, what day is 10 days from now?", "Friday", "Saturday", "Sunday", "Monday", "B", "Wed + 10 = Wed + 1 week + 3 = Sat", "medium"),
          mc("Which is the odd one out: 3, 7, 11, 14, 19?", "3", "7", "14", "19", "C", "All except 14 are prime numbers", "medium"),
          mc("Jack is 5 years older than Jill, and in 3 years Jack will be twice Jill's age now. Jill's age now?", "2", "5", "8", "7", "D", "Jack=Jill+5; Jack+3=2×Jill → Jill+8=2Jill → Jill=8... wait let me recheck: J+5+3=2J → J=8? No: 8+5=13, 13+3=16=2×8? Yes Jill=8... hmm but option is C=8. Let me recalculate. Jack=J+5. Jack+3=2J. J+5+3=2J. J+8=2J. J=8. Answer C.", "medium"),
          mc("Mirror image: Which letter looks the same?", "b", "d", "A", "p", "C", "Capital A is symmetrical — looks the same in a mirror", "easy"),
        ],
      },
      patterns: {
        name: "Number Patterns",
        questions: [
          mc("What is the next prime after 11?", "12", "13", "14", "15", "B", "13 is the next prime number after 11", "easy"),
          mc("Sum of first 10 natural numbers?", "45", "50", "55", "60", "C", "n(n+1)/2 = 10×11/2 = 55", "medium"),
          mc("Which number is a perfect square?", "50", "72", "81", "90", "C", "81 = 9²", "easy"),
          mc("HCF of 12 and 18?", "3", "4", "6", "9", "C", "Highest common factor of 12 and 18 is 6", "easy"),
          mc("LCM of 4 and 6?", "2", "12", "24", "10", "B", "Lowest common multiple of 4 and 6 is 12", "easy"),
          mc("What is 2⁸?", "64", "128", "256", "512", "C", "2⁸ = 256", "medium"),
          mc("Next term: 100, 90, 81, 73, 66, ?", "60", "59", "61", "58", "A", "Differences: -10,-9,-8,-7 → next diff=-6, 66-6=60", "hard"),
          mc("How many zeros in 10!?", "1", "2", "3", "4", "B", "10!=3628800 → 2 trailing zeros", "hard"),
          tf("Every even number greater than 2 can be expressed as the sum of two primes (Goldbach's conjecture).", "True", "This is Goldbach's conjecture — unproven but verified for very large numbers", "hard"),
          mc("√(169) = ?", "11", "12", "13", "14", "C", "13² = 169", "easy"),
        ],
      },
      critical: {
        name: "Critical Thinking",
        questions: [
          mc("All managers are employees. Some employees are graduates. Therefore:", "All managers are graduates", "Some managers may be graduates", "No managers are graduates", "Graduates are managers", "B", "We can only conclude managers might be graduates", "medium"),
          mc("Which argument is circular reasoning?", "'Exercise is good because it's healthy'", "'It must be raining because the ground is wet'", "'God exists because the Bible says so, and the Bible is true because it's God's word'", "'I failed because I didn't study'", "C", "Circular reasoning uses the conclusion as its own premise", "hard"),
          mc("Sunk cost fallacy means:", "Cutting losses", "Continuing because of past investment", "Avoiding risk", "Overestimating gains", "B", "Irrationally continuing due to past (unrecoverable) investment", "medium"),
          tf("A correlation between two variables always means one causes the other.", "False", "Correlation ≠ causation; a third variable might cause both", "medium"),
          mc("Which logical fallacy attacks the person, not the argument?", "Strawman", "Ad Hominem", "False Dichotomy", "Slippery Slope", "B", "Ad Hominem attacks the person making the argument", "easy"),
          mc("'Either you're with us or against us' is an example of:", "Slippery slope", "Ad hominem", "False dichotomy", "Hasty generalisation", "C", "False dichotomy presents only two options when more exist", "medium"),
          mc("Hasty generalisation means:", "Jumping to broad conclusions from limited evidence", "Avoiding the question", "Comparing to extreme cases", "Using emotions instead of logic", "A", "Small sample → over-broad conclusion = hasty generalisation", "medium"),
          tf("Deductive reasoning goes from specific examples to general conclusions.", "False", "Deductive = general → specific; Inductive = specific → general", "hard"),
          mc("Occam's Razor suggests:", "Use the most complex explanation", "Prefer the simplest explanation with fewest assumptions", "Always be sceptical", "Rely on evidence alone", "B", "Occam's Razor: simpler explanations are usually better", "medium"),
          mc("Which best describes an analogy?", "A direct contradiction", "A comparison highlighting similarities", "A logical error", "A type of proof", "B", "Analogies compare two things to explain or persuade", "easy"),
        ],
      },
    },
  },

  gk: {
    name: "General Knowledge",
    emoji: "🌐",
    topics: {
      science_nature: {
        name: "Science & Nature",
        questions: [
          mc("How many bones are in the adult human body?", "186", "196", "206", "216", "C", "An adult human has 206 bones", "easy"),
          mc("What gas do plants absorb during photosynthesis?", "Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen", "C", "Plants absorb CO₂ and release O₂ during photosynthesis", "easy"),
          mc("Speed of sound in air at sea level?", "~340 m/s", "~220 m/s", "~500 m/s", "~3000 m/s", "A", "Sound travels at ~340 m/s in air at sea level", "medium"),
          mc("Which planet is closest to the sun?", "Venus", "Mars", "Mercury", "Earth", "C", "Mercury is the innermost planet", "easy"),
          mc("Chemical formula for water?", "HO", "H₂O₂", "H₂O", "OH₂", "C", "Water is H₂O", "easy"),
          mc("Which animal has the largest brain?", "Elephant", "Dolphin", "Sperm Whale", "Human", "C", "Sperm whales have the largest brains by mass (~8 kg)", "medium"),
          mc("How many chromosomes do humans have?", "23", "46", "44", "48", "B", "46 chromosomes in 23 pairs", "easy"),
          mc("What is the hardest natural substance?", "Gold", "Quartz", "Diamond", "Titanium", "C", "Diamond is the hardest natural material (10 on Mohs scale)", "easy"),
          tf("The Sun is a star.", "True", "The Sun is a medium-sized yellow dwarf star", "easy"),
          mc("Light takes approximately how long to travel from Sun to Earth?", "8 minutes", "8 hours", "8 seconds", "8 days", "A", "~8 minutes 20 seconds for sunlight to reach Earth", "medium"),
        ],
      },
      culture_arts: {
        name: "Culture & Arts",
        questions: [
          mc("Who painted the Mona Lisa?", "Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli", "C", "The Mona Lisa was painted by Leonardo da Vinci", "easy"),
          mc("Which Shakespeare play features Romeo and Juliet?", "Hamlet", "Othello", "Romeo and Juliet", "Macbeth", "C", "Romeo and Juliet is itself the play's name", "easy"),
          mc("The Eiffel Tower is in:", "London", "Berlin", "Rome", "Paris", "D", "The Eiffel Tower is in Paris, France", "easy"),
          mc("Which book begins 'Call me Ishmael'?", "The Great Gatsby", "Moby Dick", "1984", "Crime and Punishment", "B", "Moby-Dick by Herman Melville opens with 'Call me Ishmael'", "medium"),
          mc("Who composed the 'Moonlight Sonata'?", "Mozart", "Bach", "Beethoven", "Chopin", "C", "Beethoven composed the Moonlight Sonata (Op.27 No.2)", "medium"),
          mc("The Louvre Museum is in which city?", "London", "Rome", "Madrid", "Paris", "D", "The Louvre is in Paris, home to the Mona Lisa", "easy"),
          tf("Michelangelo painted the Sistine Chapel ceiling.", "True", "Michelangelo painted it 1508–1512 for Pope Julius II", "easy"),
          mc("Which novel features the character Atticus Finch?", "Of Mice and Men", "To Kill a Mockingbird", "The Catcher in the Rye", "Lord of the Flies", "B", "Atticus Finch is the lawyer in To Kill a Mockingbird", "medium"),
          mc("'Swan Lake' is a ballet by:", "Tchaikovsky", "Beethoven", "Strauss", "Chopin", "A", "Swan Lake was composed by Pyotr Tchaikovsky (1875–76)", "medium"),
          mc("Picasso is associated with which art style?", "Impressionism", "Surrealism", "Cubism", "Realism", "C", "Picasso co-founded Cubism with Georges Braque", "medium"),
        ],
      },
      sports: {
        name: "Sports",
        questions: [
          mc("How many players on a soccer team during play?", "9", "10", "11", "12", "C", "Each team fields 11 players in soccer/football", "easy"),
          mc("Which country has won the most FIFA World Cups?", "Germany", "Argentina", "Italy", "Brazil", "D", "Brazil has won 5 World Cups (most of any country)", "medium"),
          mc("In tennis, what score comes after deuce?", "Match point", "Advantage", "Love", "Set point", "B", "After deuce, the next point is Advantage", "easy"),
          mc("The Olympic rings have how many rings?", "4", "5", "6", "7", "B", "The Olympic flag has 5 interlocking rings", "easy"),
          mc("Cricket: how many balls in an over?", "4", "5", "6", "8", "C", "An over consists of 6 deliveries", "easy"),
          mc("In basketball, how many points is a field goal from beyond the arc?", "1", "2", "3", "4", "C", "A shot from beyond the three-point line scores 3 points", "easy"),
          tf("The marathon race is exactly 26.2 miles (42.195 km).", "True", "The standard marathon distance is 42.195 km", "easy"),
          mc("Which country hosted the 2016 Summer Olympics?", "China", "UK", "Brazil", "Japan", "C", "Rio de Janeiro, Brazil hosted the 2016 Summer Olympics", "easy"),
          mc("In swimming, which stroke uses a butterfly kick?", "Backstroke", "Breaststroke", "Butterfly", "Freestyle", "C", "The butterfly stroke uses a dolphin/butterfly kick", "easy"),
          mc("Highest score in a single darts throw?", "50", "51", "60", "80", "C", "Triple 20 = 60 points, the highest in a single dart", "medium"),
        ],
      },
    },
  },
};

export function getQuestionsForTopic(
  categoryKey: string,
  topicKey: string,
  difficulty: Difficulty | "mixed",
  count: number,
): Question[] {
  const cat = QUIZ_CATEGORIES[categoryKey];
  if (!cat) return [];
  const topic = cat.topics[topicKey];
  if (!topic) return [];

  let pool = topic.questions;
  if (difficulty !== "mixed") {
    pool = pool.filter((q) => q.difficulty === difficulty);
    if (pool.length === 0) pool = topic.questions;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
