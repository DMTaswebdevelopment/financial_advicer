export interface PricingPlan {
  name: string;
  name2: string;
  priceId: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}
