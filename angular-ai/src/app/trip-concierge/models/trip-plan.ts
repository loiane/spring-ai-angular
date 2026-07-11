export interface FlightOption {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
}

export interface DayPlan {
  date: string;
  weatherSummary: string;
  suggestedActivities: string;
}

export interface BudgetBreakdown {
  currency: string;
  flightCost: number;
  lodgingEstimate: number;
  activitiesEstimate: number;
  foodEstimate: number;
  remaining: number;
  notes: string;
}

export interface TripPlanRequest {
  origin: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  budgetCurrency: string;
  travelers: number;
  interests: string;
}

export interface TripPlanResult {
  request: TripPlanRequest;
  selectedFlight: FlightOption | null;
  itinerary: DayPlan[];
  budget: BudgetBreakdown | null;
  docsNotes: string;
  summary: string;
}

export type TripPlanStage = 'flight' | 'itinerary' | 'budget' | 'docs' | 'done';

export interface TripPlanStreamEvent {
  stage: TripPlanStage;
  flight: FlightOption | null;
  itinerary: DayPlan[] | null;
  budget: BudgetBreakdown | null;
  docsNotes: string | null;
  result: TripPlanResult | null;
}
