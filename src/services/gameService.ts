export interface DialogItem {
  id: string
  question: string
  expectedAnswers: string[]
  explanation: string
  scene?: string
}

export interface UserAnswerRecord {
  dialogId: string
  userAnswer: string
  score: number
  scoreLevel: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface GameState {
  currentDialogIndex: number
  score: number
  totalDialogs: number
  userAnswers: UserAnswerRecord[]
  gameStatus: 'menu' | 'playing' | 'finished'
  resultMessage: string
  currentScore?: number
  currentScoreLevel?: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface StudyLine {
  id: string
  speaker: string
  text: string
  translation: string
  keywords: { word: string; meaning: string }[]
  grammarNote?: string
}

export interface SceneConfig {
  id: string
  name: string
  icon: string
  color: string
  bgGradient: string
  description: string
  role: string
  isCustom?: boolean
}

export const builtinSceneConfigs: SceneConfig[] = [
  {
    id: 'hospital',
    name: 'Hospital',
    icon: '🏥',
    color: '#e74c3c',
    bgGradient: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    description: 'Medical English conversations',
    role: 'Doctor',
  },
  {
    id: 'airport',
    name: 'Airport',
    icon: '✈️',
    color: '#3498db',
    bgGradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    description: 'Travel & flight English',
    role: 'Customs Officer',
  },
  {
    id: 'hotel',
    name: 'Hotel',
    icon: '🏨',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    description: 'Hotel check-in & services',
    role: 'Receptionist',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    description: 'Dining & ordering food',
    role: 'Waiter',
  },
]

// ─── Custom Scene Persistence ───

const CUSTOM_SCENES_KEY = 'angrytutor-custom-scenes'

function loadCustomScenes(): SceneConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SCENES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomScenes(scenes: SceneConfig[]): void {
  localStorage.setItem(CUSTOM_SCENES_KEY, JSON.stringify(scenes))
}

export function getAllSceneConfigs(): SceneConfig[] {
  return [...builtinSceneConfigs, ...loadCustomScenes()]
}

export function addCustomScene(scene: Omit<SceneConfig, 'id' | 'isCustom'>): SceneConfig {
  const customs = loadCustomScenes()
  const newScene: SceneConfig = {
    ...scene,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isCustom: true,
  }
  customs.push(newScene)
  saveCustomScenes(customs)
  return newScene
}

export function removeCustomScene(id: string): void {
  const customs = loadCustomScenes().filter(s => s.id !== id)
  saveCustomScenes(customs)
}

export function getSceneConfig(sceneId: string): SceneConfig | undefined {
  return getAllSceneConfigs().find(s => s.id === sceneId)
}

// Keep legacy export for components that import it directly
export const sceneConfigs = builtinSceneConfigs

// ─── Practice Dialog Data ───

const hospitalDialogs: DialogItem[] = [
  {
    id: 'hospital-1',
    question: 'Good morning, what brings you to the hospital today?',
    expectedAnswers: [
      'I have a terrible headache',
      'I have a bad headache',
      'I have a headache',
      'My head hurts',
    ],
    explanation: 'When visiting a doctor, clearly state your main complaint.',
    scene: 'hospital',
  },
  {
    id: 'hospital-2',
    question: 'How long have you had this problem?',
    expectedAnswers: [
      'For three days',
      'For about three days',
      'Since three days ago',
      'It started three days ago',
    ],
    explanation: 'Tell the doctor how long you have had your symptoms.',
    scene: 'hospital',
  },
  {
    id: 'hospital-3',
    question: 'Have you taken any medication for this?',
    expectedAnswers: [
      'Yes, I took some aspirin',
      'I took aspirin',
      'Yes, I have taken some pain medicine',
    ],
    explanation: 'Tell the doctor about medications you have already tried.',
    scene: 'hospital',
  },
  {
    id: 'hospital-4',
    question: 'Do you have any allergies to medication?',
    expectedAnswers: [
      'No, I do not have any allergies',
      'No allergies',
      "I don't have any allergies",
      'I am not allergic to anything',
    ],
    explanation: 'It is very important to inform the doctor about medication allergies.',
    scene: 'hospital',
  },
  {
    id: 'hospital-5',
    question: 'When did you last eat?',
    expectedAnswers: [
      'I ate breakfast three hours ago',
      'Three hours ago',
      'I had breakfast this morning',
      'About three hours ago',
    ],
    explanation: 'The doctor may ask this for fasting requirements or medication timing.',
    scene: 'hospital',
  },
  {
    id: 'hospital-6',
    question: 'Do you have any existing medical conditions?',
    expectedAnswers: [
      'Yes, I have high blood pressure',
      'I have hypertension',
      'I have diabetes',
      'Yes, I have a heart condition',
    ],
    explanation: 'Let the doctor know about any chronic conditions.',
    scene: 'hospital',
  },
  {
    id: 'hospital-7',
    question: 'Are you currently taking any regular medications?',
    expectedAnswers: [
      'Yes, I take insulin daily',
      'I take blood pressure medication',
      'Yes, I take daily medication',
    ],
    explanation: 'Always inform the doctor about all regular medications.',
    scene: 'hospital',
  },
  {
    id: 'hospital-8',
    question: 'Have you ever had surgery before?',
    expectedAnswers: [
      'Yes, I had appendix surgery five years ago',
      'I had surgery before',
      'Yes, I had an operation',
    ],
    explanation: 'Previous surgery helps the doctor understand your medical history.',
    scene: 'hospital',
  },
  {
    id: 'hospital-9',
    question: 'Do you smoke or drink alcohol?',
    expectedAnswers: [
      'No, I do not smoke or drink',
      'No, I do not smoke',
      'No, I quit smoking',
      'No, neither',
    ],
    explanation: 'Your lifestyle habits are important for the doctor to know about.',
    scene: 'hospital',
  },
  {
    id: 'hospital-10',
    question: 'Is there anything else you would like me to know?',
    expectedAnswers: [
      'No, I think that is everything',
      'No, thank you',
      'I think that covers everything',
      'No, that is all',
    ],
    explanation: 'This gives you a chance to mention anything important.',
    scene: 'hospital',
  },
]

const airportDialogs: DialogItem[] = [
  {
    id: 'airport-1',
    question: 'Good morning. May I see your passport and ticket, please?',
    expectedAnswers: [
      'Here you go',
      'Sure, here is my passport and ticket',
      'Yes, here they are',
      'Of course, here you are',
    ],
    explanation: 'At check-in, hand over your passport and ticket politely.',
    scene: 'airport',
  },
  {
    id: 'airport-2',
    question: 'Would you like a window seat or an aisle seat?',
    expectedAnswers: [
      'A window seat, please',
      'I would like a window seat',
      'An aisle seat, please',
      'I prefer a window seat',
    ],
    explanation: 'State your seating preference clearly when asked.',
    scene: 'airport',
  },
  {
    id: 'airport-3',
    question: 'How many bags are you checking in today?',
    expectedAnswers: [
      'Just one suitcase',
      'I have one bag to check in',
      'Two bags, please',
      'One checked bag and one carry-on',
    ],
    explanation: 'Tell the agent how many bags you are checking.',
    scene: 'airport',
  },
  {
    id: 'airport-4',
    question: 'Do you have any liquids or sharp objects in your carry-on?',
    expectedAnswers: [
      'No, I do not',
      'No, nothing like that',
      'No, I have already removed them',
      'No sharp objects or liquids',
    ],
    explanation: 'Security will ask about prohibited items.',
    scene: 'airport',
  },
  {
    id: 'airport-5',
    question: 'Your flight is delayed by two hours. Would you like to wait or rebook?',
    expectedAnswers: [
      'I will wait, thank you',
      'Can I rebook to the next available flight?',
      'I would like to wait',
      'I prefer to wait here',
    ],
    explanation: 'When flights are delayed, you may need to make decisions.',
    scene: 'airport',
  },
  {
    id: 'airport-6',
    question: 'What is the purpose of your visit?',
    expectedAnswers: [
      'I am here for vacation',
      'I am traveling for business',
      'I am visiting family',
      'Tourism',
    ],
    explanation: 'Immigration officers ask the purpose of your visit.',
    scene: 'airport',
  },
  {
    id: 'airport-7',
    question: 'How long do you plan to stay?',
    expectedAnswers: [
      'About two weeks',
      'I will stay for ten days',
      'For one week',
      'Two weeks',
    ],
    explanation: 'Be clear about the length of your stay.',
    scene: 'airport',
  },
  {
    id: 'airport-8',
    question: 'Where will you be staying during your visit?',
    expectedAnswers: [
      'I will be staying at a hotel downtown',
      'At the Hilton Hotel',
      'With my family',
      'I booked a hotel near the city center',
    ],
    explanation: 'Provide your accommodation details when asked.',
    scene: 'airport',
  },
  {
    id: 'airport-9',
    question: 'Excuse me, could you tell me where Gate 15 is?',
    expectedAnswers: [
      'I am not sure, let me check the signs',
      'I think it is down that hallway',
      'Sorry, I am also looking for it',
      'Could you check the departure board?',
    ],
    explanation: 'Navigating airports often requires asking for directions.',
    scene: 'airport',
  },
  {
    id: 'airport-10',
    question: 'My luggage did not arrive. Can you help me?',
    expectedAnswers: [
      'Yes, please fill out this lost baggage form',
      'I need to report my missing luggage',
      'My suitcase is missing from the carousel',
      'Can you help me find my lost bag?',
    ],
    explanation: 'If your luggage is lost, report it at the baggage claim counter.',
    scene: 'airport',
  },
]

const hotelDialogs: DialogItem[] = [
  {
    id: 'hotel-1',
    question: 'Welcome! Do you have a reservation?',
    expectedAnswers: [
      'Yes, I have a reservation under the name Smith',
      'Yes, the reservation is under my name',
      'Yes, I booked a room online',
      'I have a booking for tonight',
    ],
    explanation: 'When checking in, confirm your reservation details.',
    scene: 'hotel',
  },
  {
    id: 'hotel-2',
    question: 'How many nights will you be staying?',
    expectedAnswers: [
      'Three nights',
      'I will be staying for three nights',
      'We are here for three nights',
      'Until Thursday',
    ],
    explanation: 'Confirm the length of your stay at check-in.',
    scene: 'hotel',
  },
  {
    id: 'hotel-3',
    question: 'Would you like a room with a king bed or two queen beds?',
    expectedAnswers: [
      'A king bed, please',
      'I would like a room with a king bed',
      'Two queen beds would be great',
      'A king bed room, please',
    ],
    explanation: 'Choose the bed type that suits your needs.',
    scene: 'hotel',
  },
  {
    id: 'hotel-4',
    question: 'What time is breakfast served?',
    expectedAnswers: [
      'What time does breakfast start?',
      'Could you tell me the breakfast hours?',
      'When is breakfast available?',
      'Is breakfast included?',
    ],
    explanation: 'Ask about meal schedules at your hotel.',
    scene: 'hotel',
  },
  {
    id: 'hotel-5',
    question: 'Is there anything else you need for your room?',
    expectedAnswers: [
      'Could I get some extra towels?',
      'I need an extra pillow, please',
      'No, everything is fine, thank you',
      'Could I have extra blankets?',
    ],
    explanation: 'Request additional amenities if needed.',
    scene: 'hotel',
  },
  {
    id: 'hotel-6',
    question: 'The air conditioning in my room is not working. Can you help?',
    expectedAnswers: [
      'I am sorry about that. I will send maintenance right away',
      'My air conditioning is broken',
      'The AC does not seem to work',
      'Could you send someone to fix it?',
    ],
    explanation: 'Report room issues to the front desk promptly.',
    scene: 'hotel',
  },
  {
    id: 'hotel-7',
    question: 'Would you like to order room service?',
    expectedAnswers: [
      'Yes, I would like a club sandwich and coffee',
      'Yes, please. Can I see the menu?',
      'I would like to order some food',
      'Yes, could I get a salad and juice?',
    ],
    explanation: 'Room service is convenient for meals in your room.',
    scene: 'hotel',
  },
  {
    id: 'hotel-8',
    question: 'Could you recommend any nearby attractions?',
    expectedAnswers: [
      'Are there any good restaurants nearby?',
      'What tourist spots do you recommend?',
      'Is there a museum close to the hotel?',
      'What can I do around here?',
    ],
    explanation: 'Hotel staff can help with local recommendations.',
    scene: 'hotel',
  },
  {
    id: 'hotel-9',
    question: 'I would like to check out. Can I have my bill?',
    expectedAnswers: [
      'Sure, here is your bill',
      'I would like to check out, please',
      'Could I see the final bill?',
      'I am ready to check out',
    ],
    explanation: 'Review your bill carefully when checking out.',
    scene: 'hotel',
  },
  {
    id: 'hotel-10',
    question: 'Could you arrange a taxi to the airport for me?',
    expectedAnswers: [
      'Yes, I need a taxi to the airport',
      'Could you call a taxi for me?',
      'I need a ride to the airport at 8 AM',
      'Please book a taxi for tomorrow morning',
    ],
    explanation: 'Hotels can help arrange transportation.',
    scene: 'hotel',
  },
]

const restaurantDialogs: DialogItem[] = [
  {
    id: 'restaurant-1',
    question: 'Good evening! Do you have a reservation?',
    expectedAnswers: [
      'Yes, I have a reservation for two',
      'Yes, under the name Smith',
      'No, but do you have a table available?',
      'I made a reservation for seven o\'clock',
    ],
    explanation: 'Confirm your reservation or ask for a table when arriving.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-2',
    question: 'Here is the menu. Would you like something to drink first?',
    expectedAnswers: [
      'Yes, I will have a glass of water, please',
      'Could I get some orange juice?',
      'Just water for now, thank you',
      'I would like a cup of coffee, please',
    ],
    explanation: 'Ordering drinks first is common at restaurants.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-3',
    question: 'Are you ready to order?',
    expectedAnswers: [
      'Yes, I would like the grilled chicken, please',
      'I will have the pasta with tomato sauce',
      'Could I get the steak, medium rare?',
      'I would like to try the fish and chips',
    ],
    explanation: 'Order your food clearly and politely.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-4',
    question: 'Do you have any food allergies we should know about?',
    expectedAnswers: [
      'I am allergic to peanuts',
      'No, I do not have any allergies',
      'I cannot eat shellfish',
      'I am lactose intolerant',
    ],
    explanation: 'Always inform the staff about food allergies.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-5',
    question: 'How would you like your steak cooked?',
    expectedAnswers: [
      'Medium rare, please',
      'Well done, please',
      'I would like it medium',
      'Rare, please',
    ],
    explanation: 'Know how to express your preferred doneness.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-6',
    question: 'Would you like any side dishes with that?',
    expectedAnswers: [
      'I will have a salad on the side',
      'French fries, please',
      'Could I get some mashed potatoes?',
      'A side of vegetables, please',
    ],
    explanation: 'Choose side dishes to complement your main course.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-7',
    question: 'Is everything okay with your meal?',
    expectedAnswers: [
      'Yes, it is delicious, thank you',
      'Everything is great, thank you',
      'Actually, this is a bit too salty',
      'The food is wonderful',
    ],
    explanation: 'Provide feedback about your meal when asked.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-8',
    question: 'Would you like to see the dessert menu?',
    expectedAnswers: [
      'Yes, please!',
      'I would love to see it',
      'No, thank you. I am full',
      'Sure, what do you recommend?',
    ],
    explanation: 'Decide if you want dessert after your main course.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-9',
    question: 'Could I have the bill, please?',
    expectedAnswers: [
      'Sure, I will bring it right away',
      'Can I get the check, please?',
      'I would like to pay the bill',
      'Could we have the bill when you are ready?',
    ],
    explanation: 'Ask for the bill politely when you are ready to pay.',
    scene: 'restaurant',
  },
  {
    id: 'restaurant-10',
    question: 'Would you like to pay by cash or card?',
    expectedAnswers: [
      'I will pay by card, please',
      'Cash, please',
      'Can I pay with a credit card?',
      'By card, thank you',
    ],
    explanation: 'Choose your preferred payment method.',
    scene: 'restaurant',
  },
]

export const sceneDialogs: Record<string, DialogItem[]> = {
  hospital: hospitalDialogs,
  airport: airportDialogs,
  hotel: hotelDialogs,
  restaurant: restaurantDialogs,
}

// Legacy export for backward compatibility
export const dialogData = hospitalDialogs

export function getDialogsForScene(sceneId: string): DialogItem[] {
  if (sceneDialogs[sceneId]) return sceneDialogs[sceneId]
  // For custom scenes, generate generic practice dialogs based on the scene's role
  const cfg = getSceneConfig(sceneId)
  if (cfg?.isCustom) {
    return [
      { id: `${sceneId}-1`, question: `Hello! Welcome. How can I help you today?`, expectedAnswers: ['I need some help', 'I have a question', 'I would like some assistance'], explanation: 'Greet and state your purpose.', scene: sceneId },
      { id: `${sceneId}-2`, question: `Could you tell me your name, please?`, expectedAnswers: ['My name is...', 'I am...', 'Sure, my name is John'], explanation: 'Introduce yourself clearly.', scene: sceneId },
      { id: `${sceneId}-3`, question: `Is this your first time here?`, expectedAnswers: ['Yes, this is my first time', 'No, I have been here before', 'Yes, it is'], explanation: 'Answer yes/no questions naturally.', scene: sceneId },
      { id: `${sceneId}-4`, question: `Do you have any questions for me?`, expectedAnswers: ['Yes, I have a question', 'No, I think I understand', 'Could you explain that again?'], explanation: 'Ask clarifying questions when needed.', scene: sceneId },
      { id: `${sceneId}-5`, question: `Thank you for coming. Is there anything else?`, expectedAnswers: ['No, that is all. Thank you', 'No, thank you for your help', 'I think that covers everything'], explanation: 'End the conversation politely.', scene: sceneId },
    ]
  }
  return hospitalDialogs
}

// ─── Study Mode Data ───

const hospitalStudyLines: StudyLine[] = [
  {
    id: 'hs-1', speaker: 'Doctor', text: 'Good morning. What brings you to the hospital today?',
    translation: '早上好。今天是什么原因来医院的？',
    keywords: [{ word: 'brings', meaning: '带来（这里指什么原因）' }],
    grammarNote: '"What brings you..." is a polite way to ask "Why are you here?"',
  },
  {
    id: 'hs-2', speaker: 'Patient', text: 'I have a terrible headache that started three days ago.',
    translation: '我头痛得厉害，三天前开始的。',
    keywords: [{ word: 'terrible', meaning: '非常严重的' }, { word: 'headache', meaning: '头痛' }],
    grammarNote: '"that started..." is a relative clause modifying "headache".',
  },
  {
    id: 'hs-3', speaker: 'Doctor', text: 'I see. Have you taken any medication for it?',
    translation: '我明白了。你有吃过什么药吗？',
    keywords: [{ word: 'medication', meaning: '药物' }],
    grammarNote: '"Have you taken" uses present perfect to ask about past-to-present actions.',
  },
  {
    id: 'hs-4', speaker: 'Patient', text: 'Yes, I took some aspirin, but it did not help much.',
    translation: '是的，我吃了一些阿司匹林，但没什么效果。',
    keywords: [{ word: 'aspirin', meaning: '阿司匹林' }],
  },
  {
    id: 'hs-5', speaker: 'Doctor', text: 'Do you have any allergies to medication?',
    translation: '你对什么药物过敏吗？',
    keywords: [{ word: 'allergies', meaning: '过敏' }],
    grammarNote: '"allergies to..." — the preposition "to" follows "allergies".',
  },
  {
    id: 'hs-6', speaker: 'Patient', text: 'No, I am not allergic to anything as far as I know.',
    translation: '据我所知，我对任何东西都不过敏。',
    keywords: [{ word: 'allergic', meaning: '过敏的' }],
    grammarNote: '"as far as I know" means "to my knowledge".',
  },
  {
    id: 'hs-7', speaker: 'Doctor', text: 'I would like to run some tests. Please follow me.',
    translation: '我想做一些检查。请跟我来。',
    keywords: [{ word: 'run some tests', meaning: '做检查' }],
    grammarNote: '"I would like to..." is a polite expression of intention.',
  },
  {
    id: 'hs-8', speaker: 'Patient', text: 'Of course. Thank you, Doctor.',
    translation: '当然。谢谢你，医生。',
    keywords: [{ word: 'of course', meaning: '当然' }],
  },
]

const airportStudyLines: StudyLine[] = [
  {
    id: 'as-1', speaker: 'Agent', text: 'Good morning. May I see your passport and boarding pass?',
    translation: '早上好。请出示您的护照和登机牌。',
    keywords: [{ word: 'passport', meaning: '护照' }, { word: 'boarding pass', meaning: '登机牌' }],
    grammarNote: '"May I see..." is a polite request form.',
  },
  {
    id: 'as-2', speaker: 'Passenger', text: 'Here you go. I am flying to London today.',
    translation: '给你。我今天飞伦敦。',
    keywords: [{ word: 'flying to', meaning: '飞往' }],
    grammarNote: '"I am flying" uses present continuous for a planned future action.',
  },
  {
    id: 'as-3', speaker: 'Agent', text: 'Would you prefer a window seat or an aisle seat?',
    translation: '您想要靠窗的座位还是靠过道的座位？',
    keywords: [{ word: 'window seat', meaning: '靠窗座位' }, { word: 'aisle seat', meaning: '靠过道座位' }],
    grammarNote: '"Would you prefer... or..." is used for offering two choices.',
  },
  {
    id: 'as-4', speaker: 'Passenger', text: 'A window seat, please. And could I get an exit row?',
    translation: '请给我靠窗的座位。我能坐紧急出口那排吗？',
    keywords: [{ word: 'exit row', meaning: '紧急出口排' }],
    grammarNote: '"Could I get..." is a polite way to make a request.',
  },
  {
    id: 'as-5', speaker: 'Agent', text: 'How many bags are you checking in?',
    translation: '您要托运几件行李？',
    keywords: [{ word: 'checking in', meaning: '托运' }, { word: 'bags', meaning: '行李' }],
  },
  {
    id: 'as-6', speaker: 'Passenger', text: 'Just one suitcase. Is there a weight limit?',
    translation: '只有一个箱子。有重量限制吗？',
    keywords: [{ word: 'suitcase', meaning: '行李箱' }, { word: 'weight limit', meaning: '重量限制' }],
  },
  {
    id: 'as-7', speaker: 'Agent', text: 'Your boarding gate is B12. Boarding starts at 10:30.',
    translation: '您的登机口是B12。10:30开始登机。',
    keywords: [{ word: 'boarding gate', meaning: '登机口' }],
    grammarNote: '"Boarding starts at..." uses simple present for scheduled events.',
  },
  {
    id: 'as-8', speaker: 'Passenger', text: 'Thank you. Where is the security checkpoint?',
    translation: '谢谢。安检在哪里？',
    keywords: [{ word: 'security checkpoint', meaning: '安检点' }],
    grammarNote: '"Where is..." is a basic question for asking directions.',
  },
]

const hotelStudyLines: StudyLine[] = [
  {
    id: 'hts-1', speaker: 'Receptionist', text: 'Welcome to the Grand Hotel. Do you have a reservation?',
    translation: '欢迎来到格兰酒店。您有预订吗？',
    keywords: [{ word: 'reservation', meaning: '预订' }],
  },
  {
    id: 'hts-2', speaker: 'Guest', text: 'Yes, I booked a room online. The reservation is under Li Wei.',
    translation: '是的，我在网上订了房间。预订人是李伟。',
    keywords: [{ word: 'booked', meaning: '预订了' }],
    grammarNote: '"under" here means "in the name of".',
  },
  {
    id: 'hts-3', speaker: 'Receptionist', text: 'Let me check. You have a deluxe room for three nights. Is that correct?',
    translation: '我查一下。您预订了豪华房住三晚。对吗？',
    keywords: [{ word: 'deluxe room', meaning: '豪华房' }],
    grammarNote: '"Is that correct?" is a confirmation question.',
  },
  {
    id: 'hts-4', speaker: 'Guest', text: 'That is correct. Is breakfast included?',
    translation: '没错。包含早餐吗？',
    keywords: [{ word: 'included', meaning: '包含的' }],
    grammarNote: '"Is ... included?" uses passive voice to ask about what\'s covered.',
  },
  {
    id: 'hts-5', speaker: 'Receptionist', text: 'Yes, breakfast is served from 7 to 10 AM in the dining area.',
    translation: '是的，早餐7点到10点在餐厅供应。',
    keywords: [{ word: 'served', meaning: '供应' }, { word: 'dining area', meaning: '用餐区' }],
  },
  {
    id: 'hts-6', speaker: 'Guest', text: 'Great. Is there a gym or swimming pool in the hotel?',
    translation: '好的。酒店有健身房或游泳池吗？',
    keywords: [{ word: 'gym', meaning: '健身房' }, { word: 'swimming pool', meaning: '游泳池' }],
  },
  {
    id: 'hts-7', speaker: 'Receptionist', text: 'Yes, the gym is on the second floor and the pool is on the rooftop.',
    translation: '有的，健身房在二楼，游泳池在楼顶。',
    keywords: [{ word: 'rooftop', meaning: '楼顶' }],
    grammarNote: 'Ordinal numbers: "second floor", "third floor", etc.',
  },
  {
    id: 'hts-8', speaker: 'Guest', text: 'Wonderful. Could I also get a wake-up call at 7 AM tomorrow?',
    translation: '太好了。明天早上7点能叫醒我吗？',
    keywords: [{ word: 'wake-up call', meaning: '叫醒服务' }],
    grammarNote: '"Could I also get..." adds a polite additional request.',
  },
]

const restaurantStudyLines: StudyLine[] = [
  {
    id: 'rs-1', speaker: 'Waiter', text: 'Good evening. Table for two?',
    translation: '晚上好。两位吗？',
    keywords: [{ word: 'table for two', meaning: '两人桌' }],
  },
  {
    id: 'rs-2', speaker: 'Customer', text: 'Yes, please. Could we sit by the window?',
    translation: '是的。我们能坐窗边吗？',
    keywords: [{ word: 'by the window', meaning: '在窗边' }],
    grammarNote: '"Could we..." is a polite request. "by" means "next to".',
  },
  {
    id: 'rs-3', speaker: 'Waiter', text: 'Of course. Here is your menu. Can I get you something to drink?',
    translation: '当然可以。这是菜单。要点些喝的吗？',
    keywords: [{ word: 'menu', meaning: '菜单' }],
    grammarNote: '"Can I get you..." is commonly used by servers when offering.',
  },
  {
    id: 'rs-4', speaker: 'Customer', text: 'I will have a glass of iced tea, please.',
    translation: '我要一杯冰茶。',
    keywords: [{ word: 'iced tea', meaning: '冰茶' }, { word: 'a glass of', meaning: '一杯' }],
    grammarNote: '"I will have..." is the standard way to order in English.',
  },
  {
    id: 'rs-5', speaker: 'Waiter', text: 'Are you ready to order, or do you need a few more minutes?',
    translation: '您准备好点餐了吗，还是需要再看看？',
    keywords: [{ word: 'ready to order', meaning: '准备好点餐' }],
    grammarNote: '"or do you need..." gives the guest an option to wait.',
  },
  {
    id: 'rs-6', speaker: 'Customer', text: 'I would like the grilled salmon with a side salad.',
    translation: '我要烤三文鱼配沙拉。',
    keywords: [{ word: 'grilled salmon', meaning: '烤三文鱼' }, { word: 'side salad', meaning: '配菜沙拉' }],
    grammarNote: '"I would like..." is more polite than "I want...".',
  },
  {
    id: 'rs-7', speaker: 'Waiter', text: 'Excellent choice. How would you like your salmon cooked?',
    translation: '很好的选择。三文鱼要几分熟？',
    keywords: [{ word: 'cooked', meaning: '烹饪/做熟' }],
  },
  {
    id: 'rs-8', speaker: 'Customer', text: 'Medium, please. And could we get the bill when we are done?',
    translation: '五分熟。吃完后能给我们账单吗？',
    keywords: [{ word: 'the bill', meaning: '账单' }, { word: 'when we are done', meaning: '我们吃完的时候' }],
    grammarNote: '"when we are done" uses present tense in a time clause about the future.',
  },
]

export const sceneStudyLines: Record<string, StudyLine[]> = {
  hospital: hospitalStudyLines,
  airport: airportStudyLines,
  hotel: hotelStudyLines,
  restaurant: restaurantStudyLines,
}

export function getStudyLinesForScene(sceneId: string): StudyLine[] {
  if (sceneStudyLines[sceneId]) return sceneStudyLines[sceneId]
  const cfg = getSceneConfig(sceneId)
  const role = cfg?.role || 'Staff'
  const user = 'Visitor'
  return [
    { id: `${sceneId}-s1`, speaker: role, text: 'Hello, welcome! How can I help you today?', translation: '你好，欢迎！今天我能帮你什么？', keywords: [{ word: 'welcome', meaning: '欢迎' }], grammarNote: '"How can I help you?" is a common service greeting.' },
    { id: `${sceneId}-s2`, speaker: user, text: 'Hi, I would like some information, please.', translation: '你好，我想了解一些信息。', keywords: [{ word: 'information', meaning: '信息' }], grammarNote: '"I would like..." is polite for "I want...".' },
    { id: `${sceneId}-s3`, speaker: role, text: 'Of course! Let me explain everything for you.', translation: '当然！让我为你解释一切。', keywords: [{ word: 'explain', meaning: '解释' }] },
    { id: `${sceneId}-s4`, speaker: user, text: 'Thank you very much. That is very helpful.', translation: '非常感谢。这很有帮助。', keywords: [{ word: 'helpful', meaning: '有帮助的' }] },
  ]
}

// ─── Game State Helpers ───

export const createInitialGameState = (sceneId?: string): GameState => {
  const dialogs = sceneId ? getDialogsForScene(sceneId) : hospitalDialogs
  return {
    currentDialogIndex: 0,
    score: 0,
    totalDialogs: dialogs.length,
    userAnswers: [],
    gameStatus: 'menu',
    resultMessage: '',
  }
}

export const getPointsForScore = (
  scoreLevel: 'excellent' | 'good' | 'fair' | 'poor'
): number => {
  switch (scoreLevel) {
    case 'excellent': return 10
    case 'good': return 8
    case 'fair': return 5
    case 'poor': return 0
  }
}

export const calculateResult = (finalScore: number, totalDialogs?: number): { passed: boolean; message: string } => {
  const total = totalDialogs || 10
  const maxScore = total * 10
  const percentage = Math.round((finalScore / maxScore) * 100)

  if (finalScore >= maxScore * 0.7) {
    return {
      passed: true,
      message: `Excellent! You scored ${finalScore}/${maxScore} (${percentage}%)! Outstanding!`,
    }
  } else if (finalScore >= maxScore * 0.5) {
    return {
      passed: true,
      message: `Good job! You scored ${finalScore}/${maxScore} (${percentage}%)! Keep practicing!`,
    }
  } else {
    return {
      passed: false,
      message: `Keep practicing! You scored ${finalScore}/${maxScore} (${percentage}%).`,
    }
  }
}
