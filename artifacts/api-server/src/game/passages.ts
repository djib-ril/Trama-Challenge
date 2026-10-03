export interface Category {
  name: string;
  emoji: string;
  passages: string[];
}

export const CATEGORIES: Record<string, Category> = {
  random: {
    name: "Random Mix",
    emoji: "🎲",
    passages: [],
  },
  technology: {
    name: "Technology",
    emoji: "💻",
    passages: [
      "Artificial Intelligence is transforming society through healthcare, logistics, automation, and technology innovation. Ethical concerns like privacy, bias, and regulation must be carefully managed to ensure equitable outcomes.",
      "Blockchain technology enables secure, decentralized record-keeping without a central authority. Cryptocurrencies, smart contracts, and decentralized finance are reshaping banking, ownership, and digital transactions globally.",
      "Quantum computing harnesses quantum mechanics to process information exponentially faster than classical computers. It promises breakthroughs in cryptography, drug discovery, climate modeling, and optimization problems that are currently unsolvable.",
      "The rise of 5G networks delivers ultra-fast wireless speeds, low latency, and massive device connectivity. It enables autonomous vehicles, smart cities, remote surgery, and industrial automation at an unprecedented scale.",
      "Augmented reality overlays digital information onto the real world through smartphones and wearable devices. Industries use it for training, navigation, retail experiences, and collaborative design across engineering and architecture.",
      "Cybersecurity threats have grown dramatically as organizations increasingly rely on digital infrastructure. Ransomware, phishing, and state-sponsored attacks demand robust encryption, zero-trust architectures, and continuous monitoring strategies.",
    ],
  },
  history: {
    name: "History",
    emoji: "🏛️",
    passages: [
      "The Roman Empire dominated Europe, North Africa, and the Middle East for centuries through military conquest, law, and engineering. Its decline involved economic troubles, political instability, and pressure from migrating peoples along its borders.",
      "The Industrial Revolution began in Britain during the 18th century, transforming agrarian societies into industrialized economies. Steam power, mechanized factories, and railway networks reshaped labor, urbanization, and global trade patterns.",
      "World War I was triggered by the assassination of Archduke Franz Ferdinand and escalated through complex alliances across Europe. Trench warfare, chemical weapons, and massive casualties redefined modern conflict and reshaped national boundaries worldwide.",
      "The Renaissance was a cultural and intellectual movement in 14th to 17th century Europe that revived classical learning. Art, science, philosophy, and literature flourished as thinkers like Leonardo da Vinci and Galileo questioned traditional authorities.",
      "The transatlantic slave trade forcibly transported millions of Africans to the Americas between the 16th and 19th centuries. Its legacy deeply shaped economies, cultures, racial hierarchies, and political systems across the Atlantic world.",
      "Ancient Egypt built one of history's longest-lasting civilizations along the Nile River over three thousand years. Pharaohs, hieroglyphics, monumental architecture, and sophisticated agriculture defined a culture that still captivates modern scholars.",
    ],
  },
  science: {
    name: "Science",
    emoji: "🔬",
    passages: [
      "DNA carries the genetic instructions for all living organisms and many viruses. James Watson and Francis Crick's discovery of its double-helix structure in 1953 revolutionized biology, medicine, and our understanding of heredity and evolution.",
      "The theory of relativity, developed by Albert Einstein, describes how space, time, gravity, and energy are interconnected. It predicted phenomena like black holes, gravitational waves, and the bending of light that have all since been confirmed.",
      "CRISPR-Cas9 is a gene-editing tool that allows scientists to precisely modify DNA sequences in living organisms. Its applications span medicine, agriculture, and basic research, raising significant ethical questions about genetic modification.",
      "Vaccines work by training the immune system to recognize and fight specific pathogens without causing disease. They have eradicated smallpox, nearly eliminated polio, and dramatically reduced deaths from measles, influenza, and COVID-19.",
      "Photosynthesis is the process by which plants, algae, and some bacteria convert sunlight, water, and carbon dioxide into glucose and oxygen. It forms the foundation of almost all food chains and regulates Earth's atmospheric composition.",
      "Nuclear fusion powers the sun by combining hydrogen atoms at extreme temperatures to form helium and release enormous energy. Scientists are working to replicate this process on Earth as a clean, virtually limitless energy source.",
    ],
  },
  space: {
    name: "Space & Astronomy",
    emoji: "🚀",
    passages: [
      "Space exploration has expanded our understanding of the universe through missions to Mars, the International Space Station, and deep-space telescopes revealing distant galaxies and exoplanets with potentially habitable conditions.",
      "Black holes are regions of spacetime where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse and have been detected through gravitational waves and direct imaging by the Event Horizon Telescope.",
      "The James Webb Space Telescope peers deeper into the universe than any instrument before it, capturing infrared light from the earliest galaxies. Its observations are reshaping our understanding of star formation, galaxy evolution, and cosmic origins.",
      "Mars exploration missions have revealed evidence of ancient riverbeds, subsurface ice, and seasonal methane, suggesting the planet may once have harbored life. Rovers like Perseverance collect rock samples for eventual return to Earth.",
      "The Big Bang theory describes the origin of the universe approximately 13.8 billion years ago from an extremely hot, dense state. Cosmic microwave background radiation, galactic redshift, and the abundance of light elements all support this model.",
      "Exoplanets are planets orbiting stars beyond our solar system, with thousands confirmed by missions like Kepler and TESS. Astronomers study their atmospheres for biosignatures like oxygen, water, and methane that might indicate extraterrestrial life.",
    ],
  },
  environment: {
    name: "Environment & Climate",
    emoji: "🌿",
    passages: [
      "Climate change represents one of the greatest challenges facing humanity. Rising temperatures, melting ice caps, and extreme weather events demand urgent global cooperation, renewable energy adoption, and significant reductions in carbon emissions.",
      "Deforestation destroys critical habitats, accelerates biodiversity loss, and releases stored carbon into the atmosphere. Tropical rainforests like the Amazon produce oxygen, regulate rainfall, and support millions of species found nowhere else on Earth.",
      "Ocean acidification occurs when seawater absorbs excess atmospheric carbon dioxide, lowering its pH. This threatens coral reefs, shellfish, and the marine food webs that billions of people depend on for nutrition and economic livelihoods.",
      "Renewable energy sources like solar, wind, and hydropower produce electricity without emitting greenhouse gases. Falling technology costs and improved battery storage are accelerating their adoption globally as replacements for coal, oil, and natural gas.",
      "Plastic pollution contaminates oceans, rivers, and soil worldwide, harming wildlife and entering food chains as microplastics. Reducing single-use plastics, improving waste management, and developing biodegradable alternatives are essential solutions.",
      "Biodiversity loss is occurring at rates far exceeding natural background levels due to habitat destruction, pollution, and climate change. Healthy ecosystems provide pollination, water purification, flood control, and other services essential to human survival.",
    ],
  },
  health: {
    name: "Health & Medicine",
    emoji: "🏥",
    passages: [
      "The human immune system defends the body against pathogens through a complex network of cells, tissues, and proteins. Autoimmune disorders occur when this system mistakenly attacks the body's own healthy tissues and organs.",
      "Mental health encompasses emotional, psychological, and social wellbeing and affects how people think, feel, and act. Conditions like depression and anxiety are among the leading causes of disability globally, yet treatment remains widely inaccessible.",
      "Antibiotic resistance is emerging as a critical public health threat as bacteria evolve mechanisms to survive drug treatment. Overuse in medicine and agriculture accelerates resistance, jeopardizing the ability to treat common infections and surgical procedures.",
      "Sleep is essential for cognitive function, immune health, emotional regulation, and physical repair. Chronic sleep deprivation is linked to increased risks of obesity, diabetes, cardiovascular disease, and mental health disorders.",
      "Personalized medicine uses genetic information to tailor treatments to individual patients rather than relying on one-size-fits-all approaches. Advances in genomics, proteomics, and data science are making targeted cancer therapies and precision diagnostics possible.",
      "Nutrition profoundly influences long-term health outcomes, including risk of chronic diseases like diabetes, heart disease, and certain cancers. Diets rich in whole foods, vegetables, fiber, and healthy fats are consistently associated with improved longevity.",
    ],
  },
  psychology: {
    name: "Psychology & Mind",
    emoji: "🧠",
    passages: [
      "The human brain contains approximately 86 billion neurons forming trillions of connections. Neuroscientists study cognition, memory, emotion, and behavior to unlock the mysteries of consciousness and treat mental health disorders.",
      "Cognitive biases are systematic errors in thinking that affect judgments and decisions. Confirmation bias, anchoring, and the availability heuristic are among the most common and can distort reasoning in medicine, finance, and everyday life.",
      "Emotional intelligence refers to the ability to recognize, understand, and manage one's own emotions and those of others. Research suggests it is a stronger predictor of professional success and healthy relationships than traditional IQ measures.",
      "Memory is not a passive recording but an active reconstructive process susceptible to distortion and false recollection. Eyewitness testimony can be unreliable because stress, suggestion, and the passage of time all alter how memories are stored.",
      "Neuroplasticity is the brain's ability to reorganize itself by forming new neural connections throughout life. It enables recovery from injury, underlies learning and habit formation, and is influenced by sleep, exercise, stress, and mental stimulation.",
      "Stress activates the body's fight-or-flight response, releasing cortisol and adrenaline to prepare for threats. Chronic stress damages the immune system, impairs memory, increases cardiovascular risk, and contributes to anxiety and depression.",
    ],
  },
  geography: {
    name: "Geography",
    emoji: "🌍",
    passages: [
      "The Amazon River basin covers roughly 40 percent of South America and is home to the world's largest tropical rainforest. It sustains extraordinary biodiversity, regulates regional climate, and supports indigenous communities with deep cultural ties to the land.",
      "The Himalayas were formed by the collision of the Indian and Eurasian tectonic plates over millions of years. They include Mount Everest, the world's tallest peak, and supply freshwater to billions of people through major river systems.",
      "Desertification is the process by which fertile land becomes desert due to drought, deforestation, and unsustainable agriculture. The Sahel region of Africa is one of the most affected areas, threatening food security for millions of people.",
      "Tectonic plate movement shapes Earth's continents, mountain ranges, and ocean floors over geological time. It causes earthquakes, volcanic eruptions, and tsunamis, concentrating hazards in regions along plate boundaries like the Pacific Ring of Fire.",
      "The world's oceans cover over 70 percent of Earth's surface and regulate temperature, weather patterns, and the global carbon cycle. Ocean currents like the Gulf Stream distribute heat across hemispheres and profoundly influence regional climates.",
      "Urbanization is accelerating globally, with more than half of humanity now living in cities. Megacities like Tokyo, Delhi, and Lagos face challenges of infrastructure, housing, pollution, and inequality as rural populations continue migrating for economic opportunities.",
    ],
  },
  sports: {
    name: "Sports & Fitness",
    emoji: "🏃",
    passages: [
      "The Olympic Games unite athletes from around the world every four years in a celebration of sport, culture, and international friendship. They originated in ancient Greece and were revived in 1896 to promote peace and excellence through athletic competition.",
      "Regular physical exercise reduces the risk of chronic diseases including heart disease, type 2 diabetes, and certain cancers. Aerobic activity strengthens the cardiovascular system, while resistance training builds muscle, improves bone density, and boosts metabolism.",
      "Soccer is the world's most popular sport with an estimated four billion fans across every continent. The FIFA World Cup is the most watched sporting event globally, drawing billions of television viewers and uniting nations through shared passion.",
      "Sports psychology studies how mental factors affect athletic performance and how participation in sport affects psychological wellbeing. Focus, motivation, confidence, and the ability to handle pressure are now considered critical components of elite athletic training.",
      "The science of nutrition has transformed elite sport, with athletes following precisely calculated diets to maximize endurance, strength, and recovery. Carbohydrate loading, hydration strategies, and protein timing all influence competitive performance significantly.",
      "Esports has grown into a multibillion-dollar industry with professional leagues, sponsorships, and tournaments broadcast to millions worldwide. Competitive gaming demands strategic thinking, rapid reflexes, teamwork, and intensive practice schedules comparable to traditional sports.",
    ],
  },
  arts: {
    name: "Arts & Culture",
    emoji: "🎨",
    passages: [
      "The Renaissance was a period of extraordinary artistic achievement in Europe from the 14th to 17th century. Artists like Leonardo da Vinci, Michelangelo, and Raphael mastered perspective, anatomy, and light to create enduring masterpieces still celebrated today.",
      "Film is a powerful medium combining visual storytelling, performance, music, and technology to create emotional experiences. The global film industry shapes cultural values, influences public opinion, and reflects the social concerns of each era it portrays.",
      "Architecture shapes human experience by designing spaces that influence how people move, interact, feel, and work. Iconic structures like the Colosseum, Eiffel Tower, and Sagrada Família reflect the engineering capabilities and cultural values of their times.",
      "Literature preserves human experience across time, capturing emotions, values, and worldviews that transcend cultural and generational boundaries. Great novels, poems, and plays explore moral complexity and help readers develop empathy and critical understanding.",
      "Street art and graffiti have evolved from acts of rebellion to recognized art forms exhibited in galleries worldwide. Artists like Banksy use public spaces to challenge political systems, consumerism, and inequality through bold imagery and provocative messages.",
      "Photography democratized image-making and visual storytelling since its invention in the 19th century. Documentary photography has exposed injustice, shaped public opinion on war and poverty, and preserved cultural heritage across communities around the world.",
    ],
  },
  music: {
    name: "Music",
    emoji: "🎵",
    passages: [
      "Music is a universal human phenomenon found in every known culture and across all of recorded history. It serves social, ceremonial, and emotional functions, and research shows it profoundly affects mood, memory, motivation, and cognitive performance.",
      "Jazz emerged from African American communities in New Orleans in the late 19th century, blending blues, ragtime, and gospel traditions. Its emphasis on improvisation, rhythm, and individual expression made it a foundational influence on virtually all popular music.",
      "Classical music compositions by composers like Bach, Mozart, and Beethoven continue to be performed and studied centuries after their creation. Orchestral music requires extraordinary technical skill, ensemble coordination, and interpretive depth from performers.",
      "Hip-hop culture originated in the South Bronx during the 1970s as a creative outlet for marginalized communities. Rapping, DJing, breakdancing, and graffiti art together formed a movement that grew into one of the world's most commercially dominant musical genres.",
      "Music streaming has fundamentally disrupted the recorded music industry by making vast catalogs instantly available for a monthly subscription. Artists now earn revenue through streams, live performances, merchandise, and brand partnerships rather than album sales alone.",
      "Music therapy uses structured musical experiences to support physical, emotional, cognitive, and social wellbeing. Research demonstrates its effectiveness in reducing anxiety, managing chronic pain, improving communication in autism, and supporting dementia care.",
    ],
  },
  literature: {
    name: "Literature & Language",
    emoji: "📚",
    passages: [
      "Language is the foundation of human communication, culture, and identity, with over seven thousand distinct languages spoken worldwide. Many languages are endangered as globalization pressures smaller communities to shift toward dominant regional or national languages.",
      "Shakespeare's works written in the late 16th and early 17th centuries remain the most performed and studied in the English language. His plays explore themes of power, love, jealousy, and mortality with psychological depth that resonates across centuries.",
      "Magical realism blends realistic narratives with fantastical elements presented matter-of-factly by authors like Gabriel García Márquez. The genre reflects Latin American cultural realities and has influenced writers across the world to explore myth and memory.",
      "The development of the printing press by Johannes Gutenberg in the 15th century democratized knowledge by making books affordable and widely available. It accelerated the Renaissance, the Reformation, and scientific progress by enabling rapid dissemination of ideas.",
      "Dystopian literature imagines societies shaped by totalitarianism, surveillance, or environmental collapse to critique present political realities. Works like Nineteen Eighty-Four, Brave New World, and The Handmaid's Tale remain urgently relevant to contemporary debates.",
      "Translation is a complex intellectual and creative act requiring mastery of both language and cultural context. Great translators preserve not only meaning but also tone, rhythm, and cultural nuance, making literature accessible across linguistic boundaries.",
    ],
  },
  economics: {
    name: "Economics & Business",
    emoji: "💰",
    passages: [
      "Globalization has interconnected economies worldwide through trade, investment, and technology, creating enormous wealth while also displacing workers and widening inequality. Supply chain disruptions, tariffs, and geopolitical tensions regularly expose its vulnerabilities.",
      "Inflation occurs when the general price level rises over time, reducing the purchasing power of money. Central banks manage inflation through interest rate adjustments, influencing borrowing, spending, investment, and overall economic growth.",
      "Entrepreneurship drives innovation by introducing new products, services, and business models that disrupt existing markets. Startups fueled by venture capital have transformed industries including transportation, hospitality, finance, and retail over recent decades.",
      "Income inequality has grown in many countries as returns to capital outpace wage growth and technological change shifts labor demand. Economists debate whether redistribution through taxation, education investment, or basic income can address these structural trends.",
      "Supply and demand are the fundamental forces determining prices in market economies. When supply decreases or demand increases, prices rise, signaling producers to expand output or consumers to find substitutes, naturally balancing markets over time.",
      "The gig economy has grown as digital platforms connect freelancers directly with customers for tasks like ride-sharing, delivery, and skilled services. It offers workers flexibility but raises concerns about job security, benefits, and the future of traditional employment.",
    ],
  },
  philosophy: {
    name: "Philosophy & Ethics",
    emoji: "⚖️",
    passages: [
      "Philosophy explores fundamental questions about existence, knowledge, morality, reason, and the nature of reality. Its branches—metaphysics, epistemology, ethics, and logic—inform science, politics, religion, and everyday reasoning without offering definitive answers.",
      "Utilitarianism holds that the morally right action is the one that produces the greatest happiness for the greatest number of people. Developed by Jeremy Bentham and John Stuart Mill, it is influential in economics, public policy, and medical ethics.",
      "Free will is the philosophical question of whether humans genuinely choose their actions or whether behavior is determined by prior causes. This debate has implications for moral responsibility, criminal justice, and how we understand human agency and identity.",
      "Existentialism emphasizes individual freedom, responsibility, and the creation of personal meaning in an indifferent universe. Philosophers like Jean-Paul Sartre and Simone de Beauvoir argued that we define ourselves through choices rather than through fixed essences.",
      "The ethics of artificial intelligence raises urgent questions about accountability, bias, privacy, and the moral status of intelligent machines. As AI systems make consequential decisions in healthcare, law, and finance, society must determine who is responsible for their errors.",
      "Environmental ethics asks what moral obligations humans have toward nature, other species, and future generations. Deep ecology argues that nature has intrinsic value independent of human interests, challenging purely utilitarian approaches to conservation and resource use.",
    ],
  },
  food: {
    name: "Food & Nutrition",
    emoji: "🍎",
    passages: [
      "The Mediterranean diet, rich in vegetables, legumes, whole grains, olive oil, and fish, is consistently associated with reduced risk of heart disease, diabetes, and cognitive decline. Its emphasis on plant-based foods and healthy fats makes it a global nutrition benchmark.",
      "Fermentation is one of humanity's oldest food preservation methods, producing yogurt, cheese, bread, kimchi, and alcoholic beverages. Beyond preservation, fermentation enhances flavor, improves digestibility, and creates probiotics beneficial to gut microbiome health.",
      "Food insecurity affects hundreds of millions of people globally due to poverty, conflict, drought, and supply chain failures. Climate change threatens crop yields in vulnerable regions, and reducing food waste is increasingly recognized as essential to global food security.",
      "Processed foods high in sugar, salt, and refined carbohydrates have been linked to rising rates of obesity, type 2 diabetes, and cardiovascular disease. Ultra-processing removes fiber and micronutrients while adding additives, preservatives, and calories of low nutritional value.",
      "Culinary traditions are central to cultural identity, passing down history, values, and community bonds through shared meals and recipes. Globalization has spread food cultures worldwide while also threatening the survival of traditional regional cuisines and agricultural knowledge.",
      "Sustainable agriculture seeks to produce food in ways that preserve soil health, conserve water, protect biodiversity, and minimize greenhouse gas emissions. Practices like crop rotation, reduced tillage, and agroforestry can maintain productivity while reducing environmental damage.",
    ],
  },
  animals: {
    name: "Animals & Wildlife",
    emoji: "🦁",
    passages: [
      "Wolves are apex predators that play a critical ecological role by regulating prey populations and preventing overgrazing. Their reintroduction to Yellowstone National Park triggered a cascade of ecosystem recovery known as a trophic cascade.",
      "Insects represent over half of all known animal species and perform essential ecological services including pollination, decomposition, and soil aeration. Alarming global declines in insect populations threaten agriculture, biodiversity, and the stability of ecosystems worldwide.",
      "Elephants are highly intelligent social animals that live in matriarchal herds and display behaviors including grief, cooperation, and tool use. They are keystone species, shaping landscapes by knocking down trees and digging water holes that benefit other wildlife.",
      "Coral reefs cover less than one percent of the ocean floor but support approximately 25 percent of all marine species. Warming ocean temperatures, ocean acidification, and pollution are devastating these ecosystems at an accelerating rate globally.",
      "Migratory birds travel thousands of miles between breeding and wintering grounds, navigating using magnetic fields, stars, and landmarks. Habitat loss, climate change, and light pollution are disrupting migration patterns and causing significant population declines.",
      "Octopuses are extraordinarily intelligent invertebrates capable of problem-solving, camouflage, and tool use despite having no centralized brain structure. Their distributed nervous system, with two-thirds of neurons in their arms, represents a unique form of biological intelligence.",
    ],
  },
  society: {
    name: "Society & Politics",
    emoji: "🌐",
    passages: [
      "Democracy is a system of government in which citizens participate in decision-making through elections, representation, and civic engagement. It faces growing threats from misinformation, political polarization, voter suppression, and authoritarian erosion in many countries.",
      "Social media has transformed political communication, enabling direct engagement between leaders and citizens while also spreading misinformation, amplifying extremism, and enabling foreign interference in democratic elections worldwide.",
      "Human rights are universal moral and legal entitlements held by every person regardless of nationality, ethnicity, gender, or religion. International institutions and NGOs work to document abuses, hold governments accountable, and advocate for legal protections globally.",
      "Immigration shapes economies, cultures, and demographics in profound ways. Migrants contribute labor, innovation, and cultural diversity to receiving countries, while debates over integration, national identity, and economic impact continue to drive political conflict.",
      "Education is widely recognized as the most powerful tool for reducing poverty, improving health, and enabling economic mobility. Disparities in access to quality education between rich and poor communities perpetuate inequality across generations.",
      "Criminal justice reform movements advocate for alternatives to incarceration, reduced mandatory sentencing, and addressing the racial and economic disparities embedded in policing, prosecution, and imprisonment systems around the world.",
    ],
  },
  mathematics: {
    name: "Mathematics & Logic",
    emoji: "🔢",
    passages: [
      "Mathematics is the language through which scientists describe the physical world, from quantum mechanics to cosmology. Pure mathematics explores abstract structures that often find unexpected practical applications in physics, engineering, cryptography, and computing.",
      "Statistics allows researchers to draw meaningful conclusions from data by measuring uncertainty, identifying patterns, and testing hypotheses. Misuse of statistics through selective reporting, small samples, or flawed methodology can lead to false scientific conclusions.",
      "Game theory analyzes strategic interactions between rational agents making decisions that affect each other. It has applications in economics, political science, evolutionary biology, and artificial intelligence, explaining behavior in competition, cooperation, and negotiation.",
      "Prime numbers are integers greater than one that have no divisors other than one and themselves. They are the building blocks of all whole numbers and form the mathematical foundation of modern encryption systems that secure digital communications.",
      "Chaos theory studies how small changes in initial conditions can lead to dramatically different outcomes in complex systems. It applies to weather forecasting, ecosystems, economics, and fluid dynamics, explaining why long-term prediction is fundamentally limited.",
      "Artificial neural networks are mathematical models loosely inspired by the structure of the human brain. Composed of layers of interconnected nodes trained on data, they power image recognition, language translation, and the large language models behind modern AI.",
    ],
  },
  internet: {
    name: "Internet & Digital Life",
    emoji: "📱",
    passages: [
      "The internet has revolutionized communication, commerce, and culture by connecting billions of people worldwide, enabling instant information sharing, remote work, e-commerce, and entirely new forms of social interaction and creative expression.",
      "Social media platforms have transformed how people form identities, relationships, and political opinions. Algorithms designed to maximize engagement can create filter bubbles, amplify outrage, and contribute to declining mental health, particularly among young people.",
      "Data privacy has become a critical issue as corporations and governments collect vast quantities of personal information. Surveillance capitalism, targeted advertising, and data breaches raise urgent questions about consent, digital rights, and the regulation of technology companies.",
      "The digital divide describes unequal access to the internet, computers, and digital literacy skills between wealthy and low-income populations globally. Bridging it is seen as essential to educational equity, economic opportunity, and civic participation in modern societies.",
      "Misinformation spreads faster online than accurate information because emotional content drives more engagement. Deepfakes, coordinated inauthentic behavior, and algorithmic amplification make distinguishing truth from falsehood increasingly difficult for digital citizens.",
      "E-commerce has fundamentally disrupted retail, enabling consumers to purchase goods globally while decimating local shops. The rise of logistics networks, same-day delivery, and recommendation algorithms have concentrated enormous economic power in a small number of platforms.",
    ],
  },
  popculture: {
    name: "Pop Culture",
    emoji: "🎬",
    passages: [
      "Superhero films have dominated global box offices for two decades, driven largely by Marvel and DC adaptations. Their success reflects audience appetite for spectacular effects, franchise storytelling, and themes of heroism, identity, and moral responsibility.",
      "Reality television emerged as a dominant format in the late 1990s, offering low-cost entertainment centered on competition, celebrity, and human drama. Critics argue it prioritizes spectacle over substance, while supporters see it as authentic storytelling.",
      "The Korean Wave, or Hallyu, has spread South Korean music, film, drama, and fashion globally. BTS, Squid Game, and Parasite demonstrate that non-English language content can achieve massive worldwide audiences and cultural influence.",
      "Video gaming has grown into a cultural force larger than Hollywood, combining storytelling, art, music, and social interaction. Open-world games, narrative-driven titles, and online multiplayer experiences blur boundaries between entertainment and social connection.",
      "Celebrity culture shapes fashion, beauty standards, consumer behavior, and social values through media saturation and social platforms. Critics argue it distracts from systemic issues, while others note that celebrities can leverage platforms to drive social change.",
      "Podcasts have democratized audio storytelling and information, enabling niche audiences to follow detailed journalism, true crime, comedy, and education. Their rise reflects growing demand for long-form content that respects listener intelligence and time.",
    ],
  },
};

// Flatten all non-random passages into the random category
CATEGORIES["random"].passages = Object.entries(CATEGORIES)
  .filter(([key]) => key !== "random")
  .flatMap(([, cat]) => cat.passages);

export const CATEGORY_KEYS = Object.keys(CATEGORIES);
