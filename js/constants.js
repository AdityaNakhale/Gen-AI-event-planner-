/**
 * EventGenie — Constants & Configuration
 * Central source of truth for event types, vendor lists, budget splits, and defaults.
 */

/** @type {Object.<string, EventTypeConfig>} */
export const EVENT_TYPES = {
  wedding: {
    label: 'Wedding',
    icon: '💍',
    emoji: '💍',
    color: '#CBB3E8',
    description: 'The most magical day of your life, perfectly planned.',
    vendors: [
      'Venue', 'Catering', 'Photography', 'Videography',
      'Florist', 'DJ / Band', 'Wedding Cake', 'Officiant',
      'Invitations & Stationery', 'Hair & Makeup',
      'Transportation', 'Decor & Lighting', 'Honeymoon Travel'
    ],
    /** Percentage of total budget per category */
    budgetSplit: {
      venue: 30,
      catering: 30,
      photography: 10,
      florist: 7,
      djBand: 5,
      cake: 3,
      hairMakeup: 3,
      stationery: 2,
      transportation: 3,
      decor: 5,
      officiant: 1,
      miscellaneous: 1
    },
    /** Months before event to start planning */
    timelineMonths: 12,
    /** Suggested timeline milestones (months before event) */
    milestones: [
      { monthsBefore: 12, tasks: ['Set a budget', 'Book venue', 'Set event date', 'Start guest list'] },
      { monthsBefore: 10, tasks: ['Hire caterer', 'Book photographer', 'Book videographer', 'Choose officiant'] },
      { monthsBefore: 9,  tasks: ['Book DJ or band', 'Research florists', 'Start wedding dress shopping'] },
      { monthsBefore: 8,  tasks: ['Send save-the-dates', 'Book hair & makeup artist', 'Plan honeymoon'] },
      { monthsBefore: 6,  tasks: ['Order wedding dress', 'Book transportation', 'Register for gifts', 'Plan rehearsal dinner'] },
      { monthsBefore: 5,  tasks: ['Finalize menu with caterer', 'Order wedding cake', 'Choose decor & lighting'] },
      { monthsBefore: 4,  tasks: ['Send formal invitations', 'Arrange hotel blocks for guests', 'Order stationery'] },
      { monthsBefore: 3,  tasks: ['Schedule dress fittings', 'Plan ceremony details', 'Confirm all vendors'] },
      { monthsBefore: 2,  tasks: ['Final headcount for caterer', 'Finalize seating chart', 'Prepare vows'] },
      { monthsBefore: 1,  tasks: ['Final dress fitting', 'Confirm transport logistics', 'Prepare payments for vendors'] },
      { monthsBefore: 0.5,tasks: ['Rehearsal & rehearsal dinner', 'Deliver décor items to venue', 'Final vendor confirmations'] },
      { monthsBefore: 0,  tasks: ['Enjoy your wedding day! 🎉'] }
    ]
  },

  birthday: {
    label: 'Birthday Party',
    icon: '🎂',
    emoji: '🎂',
    color: '#E34234',
    description: 'Celebrate another trip around the sun in style.',
    vendors: [
      'Venue', 'Catering / Food', 'Birthday Cake',
      'Entertainment / Activities', 'Decorations',
      'Invitations', 'Photographer', 'Party Favors', 'Music / DJ'
    ],
    budgetSplit: {
      venue: 25,
      catering: 30,
      cake: 10,
      entertainment: 20,
      decor: 8,
      photographer: 4,
      favors: 2,
      stationery: 1
    },
    timelineMonths: 2,
    milestones: [
      { monthsBefore: 2,  tasks: ['Set budget', 'Choose theme', 'Book venue', 'Create guest list'] },
      { monthsBefore: 1.5,tasks: ['Send invitations', 'Order cake', 'Book entertainment'] },
      { monthsBefore: 1,  tasks: ['Confirm guest RSVPs', 'Order decorations', 'Book photographer'] },
      { monthsBefore: 0.5,tasks: ['Buy party favors', 'Finalize catering', 'Create playlist'] },
      { monthsBefore: 0,  tasks: ['Set up venue', 'Confirm final guest count', 'Party time! 🎉'] }
    ]
  },

  community: {
    label: 'Community Event',
    icon: '🏘️',
    emoji: '🏘️',
    color: '#BFE23A',
    description: 'Bring people together for something meaningful.',
    vendors: [
      'Venue / Space', 'Permits & Insurance', 'Catering / Food Trucks',
      'Stage & AV Equipment', 'Marketing & Promotion',
      'Volunteers', 'Security', 'Cleanup Crew',
      'Portable Restrooms', 'First Aid'
    ],
    budgetSplit: {
      venue: 15,
      permits: 5,
      catering: 25,
      av: 20,
      marketing: 15,
      security: 8,
      logistics: 7,
      miscellaneous: 5
    },
    timelineMonths: 6,
    milestones: [
      { monthsBefore: 6,  tasks: ['Define event goals', 'Set budget', 'Secure venue', 'Form planning committee'] },
      { monthsBefore: 5,  tasks: ['Apply for permits', 'Get insurance', 'Start marketing plan'] },
      { monthsBefore: 4,  tasks: ['Recruit volunteers', 'Book vendors & food trucks', 'Set up ticketing'] },
      { monthsBefore: 3,  tasks: ['Launch marketing campaign', 'Book AV equipment', 'Confirm sponsors'] },
      { monthsBefore: 2,  tasks: ['Finalize event schedule', 'Confirm all vendors', 'Train volunteers'] },
      { monthsBefore: 1,  tasks: ['Final headcount estimate', 'Brief security team', 'Prepare signage'] },
      { monthsBefore: 0,  tasks: ['Day-of setup', 'Volunteer check-in', 'Event day! 🎉'] }
    ]
  }
};

/** Supported currencies */
export const CURRENCIES = {
  INR: { symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
  USD: { symbol: '$', label: 'US Dollar',    locale: 'en-US' },
  EUR: { symbol: '€', label: 'Euro',         locale: 'de-DE' },
  GBP: { symbol: '£', label: 'British Pound', locale: 'en-GB' }
};

/** Budget validation thresholds */
export const BUDGET_LIMITS = {
  min: 1000,
  max: 100000000,
  /** Minimum per-head cost warnings (INR) */
  perHeadWarning: {
    wedding:   5000,
    birthday:  500,
    community: 200
  }
};

/** localStorage keys */
export const STORAGE_KEYS = {
  plans:      'eventgenie_plans',
  activePlan: 'eventgenie_active_plan',
  settings:   'eventgenie_settings'
};

/** Task priority levels */
export const PRIORITY = {
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low'
};

/** Vendor booking status */
export const BOOKING_STATUS = {
  NOT_STARTED: 'not_started',
  RESEARCHING: 'researching',
  BOOKED:      'booked',
  PAID:        'paid'
};

/** Default app settings */
export const DEFAULT_SETTINGS = {
  currency: 'INR',
  theme:    'dark'
};
