export type StepDirection = "next" | "back";

export interface StepperProps {
  steps: string[];
  currentStep: number;
}

export interface StepperControlProps extends StepperProps {
  handleClick: (direction: StepDirection) => void;
}


