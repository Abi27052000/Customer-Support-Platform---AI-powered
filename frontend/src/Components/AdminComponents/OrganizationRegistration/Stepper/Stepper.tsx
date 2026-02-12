import { StepItem } from "./StepItem";

type Step = {
    label: string;
    description?: string;
};

type StepperProps = {
    steps: Step[];
    activeStep: number;
    submitted?: boolean;
    onStepClick: (index: number) => void;
};

export const Stepper: React.FC<StepperProps> = ({
                                                    steps,
                                                    activeStep,
                                                    submitted = false,
                                                    onStepClick,
                                                }) => {
    const progress = ((activeStep + 1) / steps.length) * 100;

    return (
        <aside className="p-6 border-r border-gray-100">
            {/* Progress */}
            <div className="mb-6">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-3 bg-indigo-600 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Step <b>{activeStep + 1}</b> of <b>{steps.length}</b>
                </p>
            </div>

            {/* Steps */}
            <nav className="space-y-3">
                {steps.map((step, i) => (
                    <StepItem
                        key={step.label}
                        index={i}
                        label={step.label}
                        description={step.description}
                        isActive={i === activeStep && !submitted}
                        isDone={i < activeStep || submitted}
                        isLast={i === steps.length - 1}
                        onClick={() => onStepClick(i)}
                    />
                ))}
            </nav>
        </aside>
    );
};
