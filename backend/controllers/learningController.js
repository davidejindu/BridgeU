// backend/controllers/learningController.js
import { sql } from "../config/db.js";
import { body, validationResult } from "express-validator";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the main project directory (two levels up from controllers)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/* ========= Fallback Content ========= */
const getFallbackContent = (subcategoryId) => {
  const fallbackMap = {
    'campus-life': {
      title: 'Campus Life and Social Norms - Getting Started Guide',
      content: `Campus life in North America offers numerous opportunities for international students to engage, learn, and grow. Understanding the social dynamics, campus resources, and cultural norms will help you navigate your university experience successfully.

**Key Campus Resources:**
Most universities offer international student orientation programs, cultural organizations, and support services. The International Student Office is your primary resource for guidance on academic and social matters.

**Social Interactions:**
American campus culture tends to be informal and inclusive. Students often study in groups, participate in clubs, and engage in campus events. Don't hesitate to introduce yourself to classmates and join study groups.

**Academic Culture:**
Class participation is highly valued. Professors encourage questions and discussions. Office hours are available for additional help - using them shows initiative, not weakness.

**Campus Activities:**
Universities offer hundreds of student organizations, from academic clubs to cultural groups to recreational activities. Joining these is one of the best ways to meet people and integrate into campus life.

**Communication Styles:**
Direct but polite communication is the norm. "Please" and "thank you" are used frequently. Small talk about weather, classes, or weekend plans is common and helps build relationships.`,
      difficulty: 'Beginner'
    },
    'general-mannerisms': {
      title: 'General Mannerisms and Social Etiquette Guide',
      content: `Understanding North American social etiquette helps international students feel more confident in daily interactions and build meaningful relationships.

**Greetings and Introductions:**
A firm handshake, eye contact, and a smile are standard for formal introductions. Among peers, a simple "Hi" or "Hey" with a wave is common. First names are typically used, even with professors.

**Personal Space:**
Maintain about arm's length distance in conversations. Americans value personal space and may feel uncomfortable if you stand too close during casual conversations.

**Conversation Etiquette:**
Active listening is important - nod, maintain eye contact, and ask follow-up questions. Interrupting is generally considered rude. Wait for natural pauses to speak.

**Dining Etiquette:**
When eating in groups, it's polite to wait for everyone to be served before eating. Splitting bills ("going Dutch") is common among students. Tipping 15-20% at restaurants is expected.

**Time and Punctuality:**
Being on time is highly valued. Arriving 5-10 minutes early for appointments is ideal. If you're running late, text or call to inform others.

**Digital Etiquette:**
Respond to emails and messages within 24-48 hours when possible. Keep phones on silent in classrooms and meetings.`,
      difficulty: 'Beginner'
    },
    'banking': {
      title: 'Banking and Financial Management for Students',
      content: `Setting up banking services is essential for international students. Understanding the US banking system will help you manage your finances effectively and build credit history.

**Opening a Bank Account:**
Most banks require a Social Security Number or Individual Taxpayer Identification Number (ITIN), passport, I-20 form, and proof of enrollment. Many banks offer student accounts with no monthly fees.

**Types of Accounts:**
Checking accounts are for daily transactions, while savings accounts earn interest on stored money. Debit cards are linked to checking accounts for purchases and ATM access.

**Building Credit:**
Credit history is crucial in the US. Consider a secured credit card or student credit card to start building credit. Pay balances in full and on time to maintain good credit scores.

**Digital Banking:**
Most banking is done online or through mobile apps. Set up online banking to check balances, transfer money, and pay bills. Zelle and Venmo are popular for peer-to-peer payments.

**Important Fees to Avoid:**
Overdraft fees, ATM fees at other banks, and minimum balance fees. Read account terms carefully and monitor your balance regularly.

**Safety Tips:**
Never share your PIN or online banking passwords. Use ATMs at banks rather than standalone machines when possible.`,
      difficulty: 'Beginner'
    },
    'visa-status': {
      title: 'Maintaining Visa Status',
      content: `Maintaining your F-1 or J-1 visa status is crucial for your legal presence in the United States. Understanding the requirements and deadlines will help you stay compliant and avoid serious consequences.

**Full-Time Enrollment:**
You must maintain full-time enrollment (typically 12+ credit hours for undergraduates, 9+ for graduates) each semester. Dropping below full-time without authorization can jeopardize your status.

**Academic Progress:**
You must make satisfactory academic progress toward your degree. This means maintaining a minimum GPA and completing your program within the normal timeframe.

**SEVIS Reporting:**
Your school must report certain changes to SEVIS (Student and Exchange Visitor Information System), including address changes, program changes, and enrollment status changes.

**Employment Authorization:**
On-campus employment is generally allowed up to 20 hours per week during the academic year. Off-campus work requires specific authorization (CPT, OPT, or economic hardship).

**Travel Requirements:**
When traveling outside the US, you need a valid passport, visa, and I-20 (F-1) or DS-2019 (J-1) with a valid travel signature from your DSO.

**Grace Periods:**
F-1 students have a 60-day grace period after program completion to prepare for departure or apply for OPT. J-1 students have a 30-day grace period.

**Important Deadlines:**
Always check with your Designated School Official (DSO) before making any changes that could affect your status.`,
      difficulty: 'Advanced'
    },
    'campus-jobs': {
      title: 'Campus Employment for International Students',
      content: `Working on campus is a great way to gain experience, earn money, and build professional relationships while maintaining your visa status. Understanding the regulations and opportunities is essential.

**Work Authorization:**
F-1 students can work on-campus up to 20 hours per week during the academic year and full-time during breaks. J-1 students have similar but slightly different regulations.

**Types of Campus Jobs:**
- Library positions (circulation, research assistance)
- Dining services (cafeteria, food service)
- Administrative offices (reception, data entry)
- Research positions (lab assistants, research projects)
- Tutoring and academic support
- Campus recreation and facilities

**Finding Opportunities:**
Check your university's job board, career services office, and department websites. Many positions are posted at the beginning of each semester.

**Application Process:**
Most campus jobs require a resume, cover letter, and sometimes an interview. Highlight your language skills and international perspective as assets.

**Tax Implications:**
You'll need to file tax returns if you earn income. Most international students are exempt from Social Security and Medicare taxes but may owe federal and state taxes.

**Building Professional Skills:**
Campus jobs help develop communication, teamwork, and problem-solving skills that are valuable for future career opportunities.

**Networking Opportunities:**
Working on campus helps you meet faculty, staff, and other students, expanding your professional network.`,
      difficulty: 'Intermediate'
    },
    'laws': {
      title: 'Important Laws and Regulations for International Students',
      content: `Understanding US laws and regulations is crucial for international students. While most laws apply to everyone, some have specific implications for non-citizens.

**Immigration Law:**
Your visa status determines what you can and cannot do. Violations can result in deportation and future inadmissibility. Always consult with your DSO before making decisions that could affect your status.

**Criminal Law:**
US criminal laws apply to everyone, including international students. Even minor offenses can have serious immigration consequences. Avoid any illegal activities, including underage drinking and drug use.

**Traffic Laws:**
Driving laws vary by state. You may need to obtain a state driver's license and car insurance. International driving permits are typically valid for one year.

**Employment Law:**
Work only with proper authorization. Unauthorized employment is a serious violation that can result in deportation. Keep all employment authorization documents current.

**Housing Law:**
Understand your rights and responsibilities as a tenant. Read leases carefully before signing. Know your rights regarding security deposits, repairs, and eviction procedures.

**Academic Integrity:**
Plagiarism and cheating are serious academic violations that can result in expulsion and affect your visa status. Understand your school's academic integrity policies.

**Civil Rights:**
You have the right to equal treatment regardless of race, religion, national origin, or other protected characteristics. Report discrimination to appropriate authorities.

**Legal Resources:**
Know how to access legal help if needed. Many universities have legal aid services for students.`,
      difficulty: 'Advanced'
    },
    'student-office': {
      title: 'International Student Office Procedures and Requirements',
      content: `The International Student Office (ISO) is your primary resource for immigration-related questions and support. Understanding their services and procedures will help you navigate your academic journey successfully.

**Key Services:**
- Immigration advising and document processing
- SEVIS record maintenance and updates
- Travel signature requests for I-20/DS-2019
- Employment authorization guidance
- Cultural adjustment support and programming
- Academic and personal counseling referrals

**Required Check-ins:**
Most ISOs require periodic check-ins to ensure you're maintaining status and to update your records. These may be mandatory, so don't miss them.

**Document Requests:**
Common requests include travel signatures, enrollment verification letters, and program extension applications. Submit requests well in advance of deadlines.

**Program Changes:**
If you want to change your major, degree level, or add a minor, consult with your ISO first. Some changes require SEVIS updates and new documentation.

**Address Updates:**
You must report address changes within 10 days. This can usually be done online through your student portal or by visiting the ISO.

**Emergency Procedures:**
Know how to contact your ISO in case of emergencies, especially if you're traveling or if there are issues with your documents.

**Staying Informed:**
Subscribe to ISO newsletters and check their website regularly for updates on policy changes, deadlines, and important announcements.

**Building Relationships:**
Get to know your DSO (Designated School Official). They can be valuable advocates and resources throughout your academic career.`,
      difficulty: 'Intermediate'
    },
    'housing': {
      title: 'Housing and Accommodation - Finding Your Home Away From Home',
      content: `**Types of Student Housing:**
Most universities offer several housing options including residence halls, apartments, and shared houses. Each has different costs, amenities, and social environments.

**On-Campus Housing:**
- Usually more expensive but convenient
- Often includes meal plans
- Great for meeting other students
- May have strict rules and regulations

**Off-Campus Housing:**
- Generally more affordable
- More independence and privacy
- Requires more responsibility for utilities and maintenance
- May need transportation to campus

**Lease Agreements:**
Always read your lease carefully before signing. Understand your rights and responsibilities, including:
- Rent amount and due dates
- Security deposit terms
- Maintenance responsibilities
- Subletting policies
- Early termination clauses

**Roommate Considerations:**
- Discuss expectations about cleanliness, noise, guests, and shared expenses
- Consider cultural differences and communication styles
- Have a written agreement about shared responsibilities

**Housing Rights:**
Know your rights as a tenant, including:
- Right to a habitable living space
- Right to privacy
- Protection against discrimination
- Right to proper notice before entry

**Budgeting for Housing:**
Factor in all costs including rent, utilities, internet, and any additional fees. Don't forget about furniture and household items if moving into an unfurnished place.

**Finding Housing:**
- Start looking 2-3 months before you need housing
- Use university housing services and websites
- Check local classifieds and social media groups
- Visit properties in person when possible
- Ask current students for recommendations

**Safety Considerations:**
- Research the neighborhood safety
- Check building security features
- Consider proximity to campus and public transportation
- Ask about emergency procedures and contacts`,
      difficulty: 'Beginner'
    },
    'transportation': {
      title: 'Transportation Systems - Getting Around Campus and City',
      content: `**Public Transportation:**
Most cities offer buses, trains, and subways. Learn the routes, schedules, and payment methods. Many universities provide free or discounted transit passes for students.

**Campus Shuttles:**
Many universities run free shuttles between campus locations, nearby housing, and popular off-campus destinations. Check schedules and routes regularly.

**Ride-Sharing Services:**
Uber and Lyft are popular for longer distances or when public transit isn't convenient. Always verify driver information and share your trip details with friends.

**Walking and Biking:**
Walking is often the most convenient way to get around campus. Many cities have bike-sharing programs or bike lanes. Always wear a helmet and follow traffic laws.

**Driving:**
If you plan to drive, you'll need a valid driver's license and car insurance. International driving permits are typically valid for one year. Learn local traffic laws and parking regulations.

**Safety Tips:**
- Plan your route in advance
- Travel with friends when possible, especially at night
- Keep your phone charged and have emergency contacts ready
- Be aware of your surroundings
- Trust your instincts if something feels unsafe

**Cost Considerations:**
- Compare costs of different transportation methods
- Look for student discounts and passes
- Factor in time and convenience, not just money
- Consider the environmental impact of your choices

**Emergency Situations:**
Know how to contact emergency services (911 in the US) and have backup transportation plans. Keep some cash on hand in case digital payment systems fail.`,
      difficulty: 'Beginner'
    },
    'healthcare': {
      title: 'Healthcare and Insurance - Staying Healthy as a Student',
      content: `**Health Insurance Requirements:**
Most universities require international students to have health insurance. This can be through the university's plan or a private provider that meets specific requirements.

**Understanding Your Coverage:**
- What services are covered (doctor visits, emergency care, prescriptions)
- What your copays and deductibles are
- Which doctors and hospitals are in-network
- How to file claims and get reimbursements

**Finding Healthcare Providers:**
- Use your insurance company's provider directory
- Ask other students for recommendations
- Check if your university has a student health center
- Look for providers who speak your language if needed

**Student Health Centers:**
Most universities have on-campus health centers that offer:
- Primary care services
- Mental health counseling
- Immunizations and health screenings
- Prescription services
- Emergency care referrals

**Emergency Situations:**
- Know when to go to the emergency room vs urgent care
- Keep your insurance card with you at all times
- Have emergency contacts readily available
- Know the location of the nearest hospital

**Mental Health:**
- Many universities offer free or low-cost counseling services
- Don't hesitate to seek help for stress, anxiety, or depression
- Consider joining support groups for international students
- Practice self-care and maintain a healthy work-life balance

**Preventive Care:**
- Get regular check-ups and screenings
- Stay up to date on vaccinations
- Practice good hygiene and handwashing
- Maintain a healthy diet and exercise routine

**Prescription Medications:**
- Understand how to get prescriptions filled
- Know which pharmacies accept your insurance
- Keep a list of your medications and dosages
- Plan ahead for medication refills`,
      difficulty: 'Intermediate'
    },
    'terminology': {
      title: 'Modern Terminology and Slang - Understanding Gen Z Language',
      content: `**Internet Slang and Abbreviations:**
- "LOL" (Laugh Out Loud), "OMG" (Oh My God), "TBH" (To Be Honest)
- "FOMO" (Fear Of Missing Out), "YOLO" (You Only Live Once)
- "Savage," "Lit," "Fire," "Slay" (all mean something is really good)
- "Flex" (to show off), "Humble brag" (bragging while pretending to be modest)

**Social Media Terms:**
- "Viral" (content that spreads quickly), "Trending" (popular right now)
- "DM" (Direct Message), "Story" (temporary social media post)
- "Hashtag" (#), "Mention" (@), "Retweet" (sharing someone's post)
- "Influencer" (someone with many followers), "Content creator" (makes online content)

**Academic and Professional Terms:**
- "Office hours" (time when professors are available for questions)
- "Syllabus" (course outline and requirements)
- "Deadline" (due date), "Extension" (extra time to complete work)
- "Networking" (building professional relationships)
- "Internship" (temporary work experience), "Resume" (job application document)

**Campus and Social Life:**
- "Dorm" (residence hall), "Roomie" (roommate), "RA" (Resident Assistant)
- "Caf" (cafeteria), "Gym" (fitness center), "Library" (study building)
- "Study group" (students studying together), "All-nighter" (staying up all night to study)
- "Party" (social gathering), "Hang out" (spend time together casually)

**Technology and Digital Life:**
- "WiFi" (wireless internet), "App" (application), "Download" (get from internet)
- "Streaming" (watching videos online), "Podcast" (audio program)
- "Cloud" (online storage), "Backup" (copy of your data)
- "Update" (new version), "Bug" (problem with software)

**Understanding Context:**
- Slang changes quickly, so don't worry if you don't know everything
- Ask friends to explain terms you don't understand
- Use context clues to figure out meanings
- Don't be afraid to use formal language when appropriate

**Cultural Sensitivity:**
- Some slang terms might be inappropriate in certain contexts
- Be respectful of different communication styles
- Learn when to use formal vs informal language
- Understand that humor and sarcasm can be hard to interpret`,
      difficulty: 'Advanced'
    }
  };

  return fallbackMap[subcategoryId] || {
    title: 'International Student Guide',
    content: 'This section provides important information for international students. Content is being updated - please check back soon for detailed guidance on this topic.',
    difficulty: 'Beginner'
  };
};

const getFallbackQuestions = (subcategoryId) => {
  const fallbackQuestions = {
    'campus-life': [
      {
        question: "What is the best way to meet other students on campus?",
        options: ["Stay in your dorm room", "Join student organizations and clubs", "Only study alone", "Avoid campus events"],
        correctAnswer: "Join student organizations and clubs",
        explanation: "Student organizations are the primary way students connect and build friendships on campus.",
        difficulty: "Beginner"
      },
      {
        question: "When should you visit your professor's office hours?",
        options: ["Only when you're failing", "Never, it's bothering them", "Anytime you have questions or need help", "Only before exams"],
        correctAnswer: "Anytime you have questions or need help",
        explanation: "Office hours are specifically designed for student questions and academic support.",
        difficulty: "Beginner"
      },
      {
        question: "What is considered appropriate behavior in American classrooms?",
        options: ["Never ask questions", "Participate in discussions when appropriate", "Always stay silent", "Only speak when directly asked"],
        correctAnswer: "Participate in discussions when appropriate",
        explanation: "Class participation is valued and expected in most American university settings.",
        difficulty: "Beginner"
      },
      {
        question: "How should you address your professors?",
        options: ["By their first name only", "Professor [Last Name] unless told otherwise", "Sir or Madam", "Teacher"],
        correctAnswer: "Professor [Last Name] unless told otherwise",
        explanation: "Using formal titles shows respect, though many professors may invite you to use their first name.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you don't understand something in class?",
        options: ["Pretend you understand", "Ask for clarification politely", "Skip that topic", "Wait until someone else asks"],
        correctAnswer: "Ask for clarification politely",
        explanation: "Asking questions shows engagement and helps ensure you understand the material.",
        difficulty: "Beginner"
      }
    ],
    'visa-status': [
      {
        question: "How many credit hours must F-1 students typically take to maintain full-time status?",
        options: ["6 hours", "9 hours", "12+ hours", "15 hours"],
        correctAnswer: "12+ hours",
        explanation: "F-1 students usually must take at least 12 credit hours per semester to maintain full-time enrollment status.",
        difficulty: "Beginner"
      },
      {
        question: "How quickly must you report address changes to your school?",
        options: ["Within 30 days", "Within 10 days", "Within 60 days", "No time limit"],
        correctAnswer: "Within 10 days",
        explanation: "Address changes must be reported to your International Student Office within 10 days to maintain SEVIS compliance.",
        difficulty: "Beginner"
      },
      {
        question: "What do you need to re-enter the US after traveling?",
        options: ["Only a passport", "Passport, valid visa, and current I-20", "Just your student ID", "Only a driver's license"],
        correctAnswer: "Passport, valid visa, and current I-20",
        explanation: "You need all three documents - passport, valid F-1 visa, and I-20 with travel signature to re-enter the US.",
        difficulty: "Beginner"
      },
      {
        question: "What happens if you fall below full-time enrollment without authorization?",
        options: ["Nothing happens", "You get a warning", "It can violate your visa status", "You get extra time"],
        correctAnswer: "It can violate your visa status",
        explanation: "Falling below full-time enrollment without proper authorization can result in loss of legal status.",
        difficulty: "Beginner"
      },
      {
        question: "Who should you contact for visa and immigration questions?",
        options: ["Any professor", "Your roommate", "International Student Office", "Campus security"],
        correctAnswer: "International Student Office",
        explanation: "The International Student Office is your primary resource for all visa and immigration-related questions.",
        difficulty: "Beginner"
      }
    ],
    'housing': [
      {
        question: "What should you do before signing a lease?",
        options: ["Sign immediately", "Read the entire lease carefully", "Ask your friend to sign for you", "Skip reading the fine print"],
        correctAnswer: "Read the entire lease carefully",
        explanation: "Always read the entire lease before signing to understand your rights, responsibilities, and any hidden fees.",
        difficulty: "Beginner"
      },
      {
        question: "What is a security deposit typically used for?",
        options: ["Monthly rent payment", "Covering damages when you move out", "Utilities", "Furniture"],
        correctAnswer: "Covering damages when you move out",
        explanation: "A security deposit is held to cover any damages to the property when you move out, and should be returned if the property is in good condition.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you have a problem with your landlord?",
        options: ["Ignore it", "Document everything in writing", "Complain to neighbors", "Move out immediately"],
        correctAnswer: "Document everything in writing",
        explanation: "Always document landlord issues in writing and keep copies of all communications for legal protection.",
        difficulty: "Beginner"
      },
      {
        question: "What is typically included in rent for student housing?",
        options: ["Everything", "Just the room", "Room and utilities", "Room, utilities, and meals"],
        correctAnswer: "Room and utilities",
        explanation: "Most student housing includes the room and basic utilities, but meals and other services may be separate.",
        difficulty: "Beginner"
      },
      {
        question: "When should you start looking for housing for the next semester?",
        options: ["The day before classes start", "A few weeks before", "2-3 months before", "After graduation"],
        correctAnswer: "2-3 months before",
        explanation: "Start looking for housing 2-3 months before you need it, as good options fill up quickly, especially near campus.",
        difficulty: "Beginner"
      }
    ],
    'transportation': [
      {
        question: "What is the best way to get around campus?",
        options: ["Drive everywhere", "Walk or use campus shuttles", "Take taxis", "Ride a motorcycle"],
        correctAnswer: "Walk or use campus shuttles",
        explanation: "Walking is often the most convenient way to get around campus, and most universities provide free shuttles for students.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do before using ride-sharing services?",
        options: ["Nothing special", "Verify driver information and share trip details", "Pay extra for safety", "Only use during the day"],
        correctAnswer: "Verify driver information and share trip details",
        explanation: "Always verify the driver's information matches the app and share your trip details with friends for safety.",
        difficulty: "Beginner"
      },
      {
        question: "What do you need to drive in the US as an international student?",
        options: ["Just your passport", "Valid driver's license and car insurance", "Only a student ID", "Nothing special"],
        correctAnswer: "Valid driver's license and car insurance",
        explanation: "You need a valid driver's license (international driving permit is valid for one year) and car insurance to drive legally.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you get lost while using public transportation?",
        options: ["Panic and get off immediately", "Ask the driver or other passengers for help", "Keep riding until you recognize something", "Call 911"],
        correctAnswer: "Ask the driver or other passengers for help",
        explanation: "Don't be afraid to ask for help - most people are friendly and willing to assist with directions.",
        difficulty: "Beginner"
      },
      {
        question: "What is a good safety tip for using transportation?",
        options: ["Travel alone at night", "Keep your phone charged and have emergency contacts ready", "Don't plan your route", "Ignore your surroundings"],
        correctAnswer: "Keep your phone charged and have emergency contacts ready",
        explanation: "Always keep your phone charged and have emergency contacts readily available when using any form of transportation.",
        difficulty: "Beginner"
      }
    ],
    'healthcare': [
      {
        question: "What is required for most international students regarding health insurance?",
        options: ["No insurance needed", "Optional insurance", "Health insurance is required", "Only for emergencies"],
        correctAnswer: "Health insurance is required",
        explanation: "Most universities require international students to have health insurance, either through the university's plan or a private provider.",
        difficulty: "Intermediate"
      },
      {
        question: "What should you do if you have a medical emergency?",
        options: ["Wait until morning", "Go to the emergency room immediately", "Call your parents first", "Search online for solutions"],
        correctAnswer: "Go to the emergency room immediately",
        explanation: "For medical emergencies, go to the emergency room immediately or call 911. Don't delay seeking help.",
        difficulty: "Intermediate"
      },
      {
        question: "Where can you usually find free or low-cost mental health services?",
        options: ["Only private clinics", "University counseling centers", "Emergency rooms only", "Nowhere"],
        correctAnswer: "University counseling centers",
        explanation: "Most universities offer free or low-cost counseling services for students, including mental health support.",
        difficulty: "Intermediate"
      },
      {
        question: "What should you keep with you at all times regarding healthcare?",
        options: ["Your passport", "Your insurance card", "Cash only", "Nothing special"],
        correctAnswer: "Your insurance card",
        explanation: "Always keep your insurance card with you so you can receive medical care when needed.",
        difficulty: "Intermediate"
      },
      {
        question: "What is preventive care?",
        options: ["Only treating serious illnesses", "Regular check-ups and screenings to prevent problems", "Emergency care only", "Alternative medicine"],
        correctAnswer: "Regular check-ups and screenings to prevent problems",
        explanation: "Preventive care includes regular check-ups, screenings, and maintaining healthy habits to prevent health problems.",
        difficulty: "Intermediate"
      }
    ],
    'terminology': [
      {
        question: "What does 'LOL' mean?",
        options: ["Lots of Love", "Laugh Out Loud", "Lots of Luck", "Love of Life"],
        correctAnswer: "Laugh Out Loud",
        explanation: "LOL stands for 'Laugh Out Loud' and is used to indicate something is funny.",
        difficulty: "Advanced"
      },
      {
        question: "What does 'FOMO' stand for?",
        options: ["Fear of Missing Out", "Friends of My Own", "First on My Own", "Famous on My Own"],
        correctAnswer: "Fear of Missing Out",
        explanation: "FOMO stands for 'Fear of Missing Out' and refers to anxiety about missing social events or experiences.",
        difficulty: "Advanced"
      },
      {
        question: "What does 'savage' mean in modern slang?",
        options: ["Wild animal", "Really good or impressive", "Mean person", "Dangerous"],
        correctAnswer: "Really good or impressive",
        explanation: "In modern slang, 'savage' often means something is really good, impressive, or cool.",
        difficulty: "Advanced"
      },
      {
        question: "What is a 'humble brag'?",
        options: ["Being modest", "Bragging while pretending to be modest", "Complaining", "Asking for help"],
        correctAnswer: "Bragging while pretending to be modest",
        explanation: "A 'humble brag' is when someone brags about something while pretending to be modest or humble about it.",
        difficulty: "Advanced"
      },
      {
        question: "What does 'viral' mean in social media context?",
        options: ["Dangerous", "Content that spreads quickly online", "Old content", "Private content"],
        correctAnswer: "Content that spreads quickly online",
        explanation: "In social media, 'viral' refers to content that spreads quickly and widely across the internet.",
        difficulty: "Advanced"
      }
    ]
  };

  return fallbackQuestions[subcategoryId] || [
    {
      question: "What is the most important resource for international students?",
      options: ["The library", "International Student Office", "Cafeteria", "Bookstore"],
      correctAnswer: "International Student Office",
      explanation: "The International Student Office provides specialized support and guidance for international students.",
      difficulty: "Beginner"
    },
    {
      question: "When should you seek help if you're struggling academically?",
      options: ["After failing a test", "As soon as you notice difficulties", "At the end of the semester", "Never"],
      correctAnswer: "As soon as you notice difficulties",
      explanation: "Early intervention is key to academic success and there are many resources available to help.",
      difficulty: "Beginner"
    },
    {
      question: "What is expected behavior in group projects?",
      options: ["Let others do all the work", "Contribute equally and communicate regularly", "Only work alone", "Take over completely"],
      correctAnswer: "Contribute equally and communicate regularly",
      explanation: "Teamwork and communication are essential skills valued in academic and professional settings.",
      difficulty: "Beginner"
    },
    {
      question: "How should you handle cultural differences you encounter?",
      options: ["Ignore them", "Ask respectful questions and be open to learning", "Criticize different practices", "Avoid people from other cultures"],
      correctAnswer: "Ask respectful questions and be open to learning",
      explanation: "Cultural curiosity and respect help build understanding and meaningful relationships.",
      difficulty: "Beginner"
    },
    {
      question: "What should you do if you're feeling homesick?",
      options: ["Isolate yourself", "Reach out to support services and friends", "Immediately go home", "Ignore the feelings"],
      correctAnswer: "Reach out to support services and friends",
      explanation: "Homesickness is normal, and universities have counseling services and support groups to help.",
      difficulty: "Beginner"
    }
  ];
};

/* ========= Enhanced Error Logging ========= */
const logError = (context, error, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...additionalInfo
  };
  
  console.error(`=== ERROR LOG [${context}] ===`);
  console.error('Timestamp:', timestamp);
  console.error('Context:', context);
  console.error('Error Message:', error.message);
  console.error('Error Type:', error.name);
  console.error('Stack Trace:', error.stack);
  
  if (Object.keys(additionalInfo).length > 0) {
    console.error('Additional Info:', JSON.stringify(additionalInfo, null, 2));
  }
  
  // Check for specific error types
  if (error.message.includes('quota') || error.message.includes('429')) {
    console.error('ERROR TYPE: API Quota Exceeded');
  } else if (error.message.includes('network') || error.message.includes('timeout')) {
    console.error('ERROR TYPE: Network/Timeout Issue');
  } else if (error.message.includes('parse') || error.message.includes('JSON')) {
    console.error('ERROR TYPE: JSON Parsing Error');
  } else if (error.message.includes('validation')) {
    console.error('ERROR TYPE: Validation Error');
  }
  
  console.error('=== END ERROR LOG ===\n');
  
  return errorInfo;
};

/* ========= Validation ========= */
export const validateLearningRequest = [
  body("subcategoryId").notEmpty().withMessage("Subcategory ID is required"),
  body("userId").isUUID().withMessage("Valid user ID is required"),
];

export const validateQuizRequest = [
  body("subcategoryId").notEmpty().withMessage("Subcategory ID is required"),
  body("userId").isUUID().withMessage("Valid user ID is required"),
  body("answers").isArray().withMessage("Answers must be an array"),
];

/* ========= Learning Content Controllers ========= */

// Get or generate learning content for a subcategory
export const getLearningContent = async (req, res) => {
  try {
    console.log('=== GET LEARNING CONTENT STARTED ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logError('VALIDATION', new Error('Validation failed'), { errors: errors.array() });
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId } = req.body;
    console.log('Request params:', { subcategoryId, userId });

    // For culture subcategories, get user's university information and check for user-specific content
    let universityInfo = null;
    let content = [];
    
    try {
      if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
        // Get user's university information
        const userInfo = await sql`
          SELECT university FROM users WHERE id = ${userId}
        `;
        universityInfo = userInfo.length > 0 ? userInfo[0].university : null;
        console.log('University info for culture content:', universityInfo);
        
        // For culture subcategories, check if user-specific content exists
        content = await sql`
          SELECT content_id, title, content, difficulty, created_at
          FROM learning_content 
          WHERE subcategory_id = ${subcategoryId} AND user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
      } else {
        // For non-culture subcategories, use global content
        content = await sql`
          SELECT content_id, title, content, difficulty, created_at
          FROM learning_content 
          WHERE subcategory_id = ${subcategoryId} AND user_id IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `;
      }
    } catch (dbError) {
      logError('DATABASE_QUERY', dbError, { subcategoryId, userId, operation: 'fetch_existing_content' });
      // Continue with fallback content
      content = [];
    }

    // STEP 1: Always try to generate fresh content first
    console.log('STEP 1: Attempting fresh content generation...');
    let contentGenerated = false;
    
    try {
      const generatedContent = await generateLearningContent(subcategoryId, universityInfo);
      console.log('Fresh content generated successfully');
      
      try {
        const newContent = await sql`
          INSERT INTO learning_content (subcategory_id, title, content, difficulty, user_id)
          VALUES (${subcategoryId}, ${generatedContent.title}, ${generatedContent.content}, ${generatedContent.difficulty}, ${subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms' ? userId : null})
          RETURNING content_id, title, content, difficulty, created_at
        `;
        content = newContent;
        contentGenerated = true;
        console.log('SUCCESS: Fresh content generated and stored');
      } catch (dbError) {
        logError('DATABASE_INSERT', dbError, { subcategoryId, userId, operation: 'insert_generated_content' });
        // Use the generated content without storing it
        content = [{
          content_id: 'temp-' + Date.now(),
          title: generatedContent.title,
          content: generatedContent.content,
          difficulty: generatedContent.difficulty,
          created_at: new Date().toISOString()
        }];
        contentGenerated = true;
        console.log('SUCCESS: Fresh content generated (not stored due to DB error)');
      }
    } catch (genError) {
      logError('CONTENT_GENERATION', genError, { subcategoryId, userId, universityInfo });
      console.log('STEP 1 FAILED: Fresh generation failed, proceeding to step 2...');
    }

    // STEP 2: If fresh generation failed, try to use existing content from database
    if (!contentGenerated) {
      console.log('STEP 2: Attempting to use existing content from database...');
      
      if (content.length > 0) {
        console.log('SUCCESS: Using existing content from database');
        // Check if the existing content is old placeholder content and replace it
        if (content[0] && content[0].content && 
            (content[0].content.includes('Content for this topic is being generated') || 
             content[0].content.includes('Please try again in a moment'))) {
          console.log('Found old placeholder content, replacing with fallback content');
          const fallback = getFallbackContent(subcategoryId);
          content = [{
            content_id: content[0].content_id, // Keep the same ID
            title: fallback.title,
            content: fallback.content,
            difficulty: fallback.difficulty,
            created_at: content[0].created_at
          }];
          
          // Update the database with the new content
          try {
            await sql`
              UPDATE learning_content 
              SET title = ${fallback.title}, content = ${fallback.content}, difficulty = ${fallback.difficulty}
              WHERE content_id = ${content[0].content_id}
            `;
            console.log('Updated database with fallback content');
          } catch (updateError) {
            console.log('Failed to update database, using fallback content in memory only');
          }
        }
      } else {
        console.log('STEP 2 FAILED: No existing content found, proceeding to step 3...');
      }
    }

    // STEP 3: If no existing content, use hardcoded fallback content
    if (!contentGenerated && content.length === 0) {
      console.log('STEP 3: Using hardcoded fallback content as last resort');
      const fallback = getFallbackContent(subcategoryId);
      content = [{
        content_id: 'fallback-' + Date.now(),
        title: fallback.title,
        content: fallback.content,
        difficulty: fallback.difficulty,
        created_at: new Date().toISOString()
      }];
      console.log('SUCCESS: Using hardcoded fallback content');
    }

    // Try to record learning progress (non-critical)
    try {
      if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
        await sql`
          INSERT INTO user_learning_progress (user_id, subcategory_id, content_id)
          VALUES (${userId}, ${subcategoryId}, ${content[0].content_id})
          ON CONFLICT (user_id, content_id) DO UPDATE SET content_id = ${content[0].content_id}
        `;
      } else {
        await sql`
          INSERT INTO user_learning_progress (user_id, subcategory_id, content_id)
          VALUES (${userId}, ${subcategoryId}, ${content[0].content_id})
          ON CONFLICT (user_id, content_id) DO NOTHING
        `;
      }
    } catch (progressError) {
      logError('PROGRESS_TRACKING', progressError, { subcategoryId, userId, contentId: content[0].content_id });
      // Continue without progress tracking - not critical
    }

    console.log('=== GET LEARNING CONTENT COMPLETED SUCCESSFULLY ===');
    return res.status(200).json({
      success: true,
      content: content[0]
    });

  } catch (error) {
    logError('GENERAL_ERROR', error, { endpoint: 'getLearningContent' });
    
    // Return fallback content even in case of complete failure
    const fallback = getFallbackContent(req.body?.subcategoryId || 'general');
    return res.status(200).json({
      success: true,
      content: {
        content_id: 'emergency-fallback-' + Date.now(),
        title: fallback.title,
        content: fallback.content,
        difficulty: fallback.difficulty,
        created_at: new Date().toISOString()
      },
      warning: "Using fallback content due to technical issues"
    });
  }
};

// Generate quiz questions for a subcategory
export const generateQuiz = async (req, res) => {
  try {
    console.log('=== QUIZ GENERATION STARTED ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId } = req.body;
    console.log('Quiz generation params:', { subcategoryId, userId });

    // Get user's university information for culture subcategories
    let universityInfo = null;
    if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      const userInfo = await sql`SELECT university FROM users WHERE id = ${userId}`;
      universityInfo = userInfo.length > 0 ? userInfo[0].university : null;
    }

    // Check learning progress
    let learningProgress = [];
    try {
      learningProgress = await sql`
        SELECT ulp.*, lc.content
        FROM user_learning_progress ulp
        JOIN learning_content lc ON ulp.content_id = lc.content_id
        WHERE ulp.user_id = ${userId} AND ulp.subcategory_id = ${subcategoryId}
        AND (lc.user_id = ${userId} OR lc.user_id IS NULL)
      `;
    } catch (dbError) {
      // Continue without learning progress
    }

    let questions = [];
    
    // Try to generate questions
    try {
      if (learningProgress.length > 0) {
        questions = await generateQuestionsFromContent(subcategoryId, learningProgress[0].content, universityInfo);
      } else {
        questions = await generateGeneralQuestions(subcategoryId, universityInfo);
      }
      
      // Validate questions
      questions = questions.filter(q => validateQuestionStructure(q));
      
    } catch (genError) {
      console.log('Question generation failed, using fallback');
      questions = [];
    }

    // If generation failed or insufficient questions, use fallback
    if (questions.length < 5) {
      console.log(`Using fallback questions for ${subcategoryId}. Generated: ${questions.length}, need: 5`);
      questions = getFallbackQuestions(subcategoryId);
      console.log(`Fallback questions count: ${questions.length}`);
    }

    // Ensure we have exactly 5 questions
    questions = questions.slice(0, 5);
    
    // Clear existing questions and store new ones
    await sql`DELETE FROM quiz_questions WHERE subcategory_id = ${subcategoryId}`;
    
    // Store questions in database
    console.log(`Storing ${questions.length} questions for subcategory: ${subcategoryId}`);
    const storedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Storing question ${i + 1}: ${question.question?.substring(0, 50)}...`);
      const stored = await sql`
        INSERT INTO quiz_questions (
          subcategory_id, content_id, question, options, 
          correct_answer, explanation, difficulty
        )
        VALUES (
          ${subcategoryId}, ${question.contentId || null}, ${question.question}, 
          ${JSON.stringify(question.options)}, ${question.correctAnswer}, 
          ${question.explanation || null}, ${question.difficulty || 'Beginner'}
        )
        RETURNING question_id, question, options, correct_answer, explanation, difficulty
      `;
      storedQuestions.push(stored[0]);
      console.log(`Successfully stored question ${i + 1} with ID: ${stored[0].question_id}`);
    }
    
    console.log('=== QUIZ GENERATION COMPLETED ===');
    console.log('Returning', storedQuestions.length, 'questions to frontend');
    
    return res.status(200).json({
      success: true,
      questions: storedQuestions
    });
    
  } catch (error) {
    logError('QUIZ_GENERATION_CRITICAL', error, { endpoint: 'generateQuiz' });
    
    // Emergency fallback - always return some questions
    const fallbackQuestions = getFallbackQuestions(req.body?.subcategoryId || 'general');
    return res.status(200).json({
      success: true,
      questions: fallbackQuestions.map((q, index) => ({
        question_id: `emergency-${Date.now()}-${index}`,
        ...q
      })),
      warning: "Using emergency fallback questions due to technical issues"
    });
  }
};

// Basic structure validation (keeping existing logic)
function validateQuestionStructure(question) {
  try {
    // Check basic structure
    if (!question.question || !question.options || !Array.isArray(question.options) || 
        question.options.length !== 4 || !question.correctAnswer) {
      return false;
    }
    
    // Check question length
    if (question.question.length < 10 || question.question.length > 300) {
      return false;
    }
    
    // Check that options are distinct
    const uniqueOptions = new Set(question.options.map(o => o.toLowerCase().trim()));
    if (uniqueOptions.size !== 4) {
      return false;
    }
    
    // Check that options have reasonable length
    for (let option of question.options) {
      if (!option || option.length < 2 || option.length > 200) {
        return false;
      }
    }
    
    // Ensure correct answer is in options
    const normalizedCorrectAnswer = question.correctAnswer.toLowerCase().trim();
    const normalizedOptions = question.options.map(o => o.toLowerCase().trim());
    
    if (!normalizedOptions.includes(normalizedCorrectAnswer)) {
      // Try removing letter prefixes
      const cleanAnswer = question.correctAnswer.replace(/^[a-dA-D][\.\)]\s*/i, '').trim();
      const matchingOption = question.options.find(o => 
        o.replace(/^[a-dA-D][\.\)]\s*/i, '').trim().toLowerCase() === cleanAnswer.toLowerCase()
      );
      
      if (matchingOption) {
        question.correctAnswer = matchingOption;
      } else {
        return false;
      }
    }
    
    // Reject "all/none of the above" style answers
    const invalidPhrases = ['all of the above', 'none of the above', 'both a and b', 'a and b', 'all of these', 'none of these'];
    if (invalidPhrases.some(phrase => normalizedCorrectAnswer.includes(phrase))) {
      return false;
    }
    
    return true;
  } catch (error) {
    logError('QUESTION_VALIDATION', error, { question });
    return false;
  }
}

// Keep existing submit quiz and progress functions unchanged...
export const submitQuiz = async (req, res) => {
  try {
    console.log('=== QUIZ SUBMISSION STARTED ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation failed:', errors.array());
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId, answers } = req.body;
    console.log('Quiz submission params:', { subcategoryId, userId, answersLength: answers?.length });

    // Get the correct answers for the questions
    const questions = await sql`
      SELECT question_id, correct_answer, explanation
      FROM quiz_questions 
      WHERE subcategory_id = ${subcategoryId}
      ORDER BY created_at ASC
      LIMIT 5
    `;

    console.log(`Found ${questions.length} questions in database for subcategory: ${subcategoryId}`);
    console.log('Question IDs:', questions.map(q => q.question_id));
    console.log('Questions retrieved:', questions.map(q => ({ id: q.question_id, correct: q.correct_answer })));

    if (questions.length === 0) {
      console.log('No questions found for subcategory:', subcategoryId);
      return res.status(400).json({ 
        success: false, 
        message: "No quiz questions found for this subcategory. Please try generating the quiz again." 
      });
    }

    if (!answers || answers.length !== questions.length) {
      console.log('Answer count mismatch:', { expected: questions.length, received: answers?.length });
      return res.status(400).json({ 
        success: false, 
        message: `Expected ${questions.length} answers but received ${answers ? answers.length : 0}` 
      });
    }

    let score = 0;
    const results = [];

    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      const normalizedUserAnswer = userAnswer ? userAnswer.trim() : '';
      const normalizedCorrectAnswer = q.correct_answer ? q.correct_answer.trim() : '';
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      if (isCorrect) score++;
      
      results.push({
        questionId: q.question_id,
        userAnswer: normalizedUserAnswer,
        correctAnswer: normalizedCorrectAnswer,
        isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = Math.round((score / questions.length) * 100);

    // Store quiz attempt
    try {
      await sql`
        INSERT INTO user_quiz_attempts (user_id, subcategory_id, score, total_questions, answers)
        VALUES (${userId}, ${subcategoryId}, ${score}, ${questions.length}, ${JSON.stringify(answers)})
      `;
    } catch (dbError) {
      logError('QUIZ_ATTEMPT_STORAGE', dbError, { userId, subcategoryId, score });
      // Continue without storing - not critical for user experience
    }

    console.log('=== QUIZ SUBMISSION COMPLETED SUCCESSFULLY ===');
    console.log('Final score:', score, 'out of', questions.length);
    
    return res.status(200).json({
      success: true,
      score,
      totalQuestions: questions.length,
      percentage,
      results
    });

  } catch (error) {
    console.log('=== QUIZ SUBMISSION FAILED ===');
    logError('SUBMIT_QUIZ', error, { subcategoryId: req.body?.subcategoryId, userId: req.body?.userId });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const progress = await sql`
      SELECT 
        ulp.subcategory_id,
        lc.title,
        ulp.completed_at,
        ulp.time_spent
      FROM user_learning_progress ulp
      JOIN learning_content lc ON ulp.content_id = lc.content_id
      WHERE ulp.user_id = ${userId}
      ORDER BY ulp.completed_at DESC
    `;

    const quizAttempts = await sql`
      SELECT 
        subcategory_id,
        score,
        total_questions,
        completed_at
      FROM user_quiz_attempts
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
    `;

    return res.status(200).json({
      success: true,
      learningProgress: progress,
      quizAttempts
    });

  } catch (error) {
    logError('GET_USER_PROGRESS', error, { userId: req.params.userId });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    const recentQuizAttempts = await sql`
      SELECT 
        uqa.subcategory_id,
        uqa.score,
        uqa.total_questions,
        uqa.completed_at,
        CASE 
          WHEN uqa.subcategory_id = 'campus-life' THEN 'Campus Life'
          WHEN uqa.subcategory_id = 'general-mannerisms' THEN 'General Mannerisms'
          WHEN uqa.subcategory_id = 'banking' THEN 'Banking'
          WHEN uqa.subcategory_id = 'transportation' THEN 'Transportation'
          WHEN uqa.subcategory_id = 'housing' THEN 'Housing'
          WHEN uqa.subcategory_id = 'healthcare' THEN 'Healthcare'
          WHEN uqa.subcategory_id = 'terminology' THEN 'Terminology'
          WHEN uqa.subcategory_id = 'visa-status' THEN 'Visa Status'
          WHEN uqa.subcategory_id = 'campus-jobs' THEN 'Campus Jobs'
          WHEN uqa.subcategory_id = 'laws' THEN 'Laws'
          WHEN uqa.subcategory_id = 'student-office' THEN 'Student Office'
          ELSE uqa.subcategory_id
        END as subcategory_name,
        CASE 
          WHEN uqa.subcategory_id IN ('campus-life', 'general-mannerisms') THEN 'culture'
          WHEN uqa.subcategory_id IN ('banking', 'transportation', 'housing', 'healthcare') THEN 'practical-skills'
          WHEN uqa.subcategory_id = 'terminology' THEN 'language'
          WHEN uqa.subcategory_id IN ('visa-status', 'campus-jobs', 'laws', 'student-office') THEN 'legal-immigration'
          ELSE 'general'
        END as category_type
      FROM user_quiz_attempts uqa
      WHERE uqa.user_id = ${userId}
      ORDER BY uqa.completed_at DESC
      LIMIT 5
    `;

    return res.status(200).json({
      success: true,
      recentActivity: recentQuizAttempts
    });

  } catch (error) {
    logError('GET_RECENT_ACTIVITY', error, { userId: req.params.userId });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ========= Helper Functions ========= */

// Generate learning content using Google Gemini (with enhanced error handling)
async function generateLearningContent(subcategoryId, universityInfo = null) {
  try {
    console.log('=== GENERATING LEARNING CONTENT ===');
    console.log('Subcategory:', subcategoryId);
    console.log('University info:', universityInfo);
    
    const subcategoryMap = {
      'campus-life': 'Campus Life and Social Norms - Understanding campus culture, social interactions, and general mannerisms for international students',
      'general-mannerisms': 'General Mannerisms and Social Etiquette - Understanding social norms, communication styles, cultural behaviors, and proper etiquette for international students',
      'banking': 'Banking and Financial Management - Setting up bank accounts, understanding credit, managing finances, and financial literacy',
      'transportation': 'Transportation Systems - Using public transport, campus shuttles, ride-sharing services, and getting around the city',
      'housing': 'Housing and Accommodation - Finding housing, understanding leases, roommate dynamics, and accommodation options',
      'healthcare': 'Healthcare and Insurance - Understanding health insurance, finding doctors, emergency procedures, and healthcare systems',
      'terminology': 'Modern Terminology and Slang - Gen Z slang, academic terminology, cultural references, and modern language usage',
      'visa-status': 'Maintaining Visa Status - Visa requirements, compliance, reporting obligations, and maintaining legal status',
      'campus-jobs': 'Campus Employment - Work authorization, job opportunities, tax implications, and employment regulations',
      'laws': 'Important Laws and Regulations - Legal requirements, rights and responsibilities, compliance, and legal awareness',
      'student-office': 'International Student Office Updates - Staying updated with requirements, paperwork, deadlines, and administrative processes'
    };

    let topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      topic += ` at ${universityInfo}`;
    }
    
    let prompt = `Create comprehensive learning content for international students about: ${topic}

REQUIREMENTS:
- Write 800-1200 words of educational content
- Make it practical and actionable for international students
- Include specific facts, procedures, and requirements
- Use clear, simple language
- Include real-world examples and scenarios
- Cover common challenges and solutions
- Provide cultural context and considerations`;

    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural norms and practices specific to ${universityInfo}
- Include campus-specific traditions, events, and social customs
- Mention university-specific resources, organizations, and support services
- Include examples of how social interactions work at ${universityInfo}
- Cover any unique cultural aspects or expectations at this university
- Include information about campus life, student organizations, and social activities specific to ${universityInfo}`;
    }

    prompt += `

CONTENT STRUCTURE:
1. Introduction to the topic
2. Key concepts and important information
3. Step-by-step procedures or guidelines
4. Common challenges and how to overcome them
5. Cultural considerations and best practices
6. Practical tips and real-world examples
7. Important requirements or regulations (if applicable)

FORMAT: Return as JSON with these exact keys:
{
  "title": "Clear, engaging title here",
  "content": "Detailed educational content here (800-1200 words)",
  "difficulty": "Beginner"
}

Make the content specific, factual, and directly applicable to international students' experiences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Received LLM response, length:', text.length);
    
    try {
      let cleanText = text.trim();
      
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields in LLM response');
      }
      
      console.log('Successfully parsed generated content');
      return {
        title: parsed.title,
        content: parsed.content,
        difficulty: parsed.difficulty || 'Beginner'
      };
    } catch (parseError) {
      logError('CONTENT_PARSING', parseError, { subcategoryId, responseLength: text.length });
      
      // Try to extract content manually
      const titleMatch = text.match(/"title":\s*"([^"]+)"/);
      const contentMatch = text.match(/"content":\s*"([^"]+)"/);
      
      if (titleMatch && contentMatch) {
        console.log('Extracted content manually from malformed JSON');
        return {
          title: titleMatch[1],
          content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          difficulty: 'Beginner'
        };
      }
      
      throw new Error('Could not parse or extract content from LLM response');
    }
  } catch (error) {
    logError('GENERATE_LEARNING_CONTENT', error, { subcategoryId, universityInfo });
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    throw error;
  }
}

// Generate questions based on learned content using Gemini (with enhanced error handling)
async function generateQuestionsFromContent(subcategoryId, content, universityInfo = null) {
  try {
    console.log('=== GENERATING QUESTIONS FROM CONTENT ===');
    
    let prompt = `Based on the following learning content, generate exactly 5 multiple-choice quiz questions.

CONTENT TO BASE QUESTIONS ON:
${content}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 5 questions
2. Each question MUST have EXACTLY 4 answer options
3. The correct answer MUST be one of the 4 options
4. Questions must be directly based on information from the content
5. Each correct answer must logically answer its question`;

    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural aspects and practices specific to ${universityInfo}
- Include questions about campus-specific traditions, events, and social customs`;
    }

    prompt += `

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "Beginner"
    }
  ]
}

IMPORTANT: The correctAnswer field must contain the EXACT text of one of the options.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Received questions response, length:', text.length);
    
    try {
      let cleanText = text.trim();
      
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure: questions array not found');
      }
      
      console.log('Parsed', parsed.questions.length, 'questions from content');
      
      const processedQuestions = parsed.questions.map(q => {
        if (!q.explanation) {
          q.explanation = "This is the correct answer based on the learning content.";
        }
        if (!q.difficulty) {
          q.difficulty = "Beginner";
        }
        return q;
      });
      
      return processedQuestions;
      
    } catch (parseError) {
      logError('QUESTIONS_PARSING', parseError, { subcategoryId, responseLength: text.length });
      throw new Error('Failed to parse questions from LLM response');
    }
  } catch (error) {
    logError('GENERATE_QUESTIONS_FROM_CONTENT', error, { subcategoryId, universityInfo });
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    throw error;
  }
}

// Generate general questions for subcategory (with enhanced error handling)
async function generateGeneralQuestions(subcategoryId, universityInfo = null) {
  try {
    console.log('=== GENERATING GENERAL QUESTIONS ===');
    
    const subcategoryMap = {
      'campus-life': 'Campus Life and Social Norms for international students',
      'general-mannerisms': 'General Mannerisms and Social Etiquette in North America',
      'banking': 'Banking and Financial Management for students',
      'transportation': 'Transportation Systems and getting around campus/city',
      'housing': 'Housing and Accommodation for international students',
      'healthcare': 'Healthcare and Insurance systems for students',
      'terminology': 'Modern Terminology, Slang, and Academic Language',
      'visa-status': 'Maintaining Visa Status and immigration compliance',
      'campus-jobs': 'Campus Employment and work authorization',
      'laws': 'Important Laws and Regulations for international students',
      'student-office': 'International Student Office procedures and requirements'
    };

    let topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      topic += ` at ${universityInfo}`;
    }
    
    let prompt = `Generate exactly 5 multiple-choice quiz questions about "${topic}".

REQUIREMENTS:
1. Generate EXACTLY 5 questions
2. Each question MUST have EXACTLY 4 answer options
3. Questions should test practical knowledge that international students need
4. Each correct answer must directly answer its question
5. Base questions on common knowledge about this topic`;

    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural aspects and practices specific to ${universityInfo}`;
    }

    prompt += `

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Brief explanation",
      "difficulty": "Beginner"
    }
  ]
}

IMPORTANT: 
- The correctAnswer must be the EXACT text of one of the options
- Do NOT use "All of the above" or "None of the above" as options
- Make questions specific and factual`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure');
      }
      
      console.log('Parsed', parsed.questions.length, 'general questions');
      
      const processedQuestions = parsed.questions.map(q => {
        if (!q.explanation) {
          q.explanation = "This is the correct answer for this topic.";
        }
        if (!q.difficulty) {
          q.difficulty = "Beginner";
        }
        return q;
      });
      
      return processedQuestions;
      
    } catch (parseError) {
      logError('GENERAL_QUESTIONS_PARSING', parseError, { subcategoryId, responseLength: text.length });
      throw new Error('Failed to parse general questions from LLM response');
    }
  } catch (error) {
    logError('GENERATE_GENERAL_QUESTIONS', error, { subcategoryId, universityInfo });
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    throw error;
  }
}