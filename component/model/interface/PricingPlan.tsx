export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}
