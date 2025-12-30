import React, {
    useState,
    Children,
    useRef,
    useLayoutEffect,
    HTMLAttributes,
    ReactNode,
    useImperativeHandle,
    forwardRef,
} from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface StepperProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    initialStep?: number;
    onStepChange?: (step: number) => void;
    onFinalStepCompleted?: () => void;
    showStepIndicators?: boolean;
    showStepLabels?: boolean;
    stepLabels?: string[];
    containerClassName?: string;
    contentClassName?: string;
    backButtonText?: string;
    nextButtonText?: string;
    completeButtonText?: string;
    disableStepClick?: boolean;
    hideNavigationButtons?: boolean;
}

export interface StepperRef {
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    getCurrentStep: () => number;
}

interface StepIndicatorProps {
    stepNumber: number;
    isActive: boolean;
    isCompleted: boolean;
    disableStepClick: boolean;
    onStepClick: (step: number) => void;
}

interface StepConnectorProps {
    isCompleted: boolean;
}

interface StepLabelProps {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
    getStepLabel: (stepIndex: number) => string;
}

interface StepNavigationProps {
    currentStep: number;
    isLastStep: boolean;
    backButtonText: string;
    nextButtonText: string;
    completeButtonText: string;
    onBack: () => void;
    onNext: () => void;
    onComplete: () => void;
}

interface StepContentProps {
    isCompleted: boolean;
    currentStep: number;
    direction: number;
    children: ReactNode;
    className?: string;
}

// Step Indicator Component
function StepIndicator({
    stepNumber,
    isActive,
    isCompleted,
    disableStepClick,
    onStepClick,
}: StepIndicatorProps) {
    return (
        <motion.div
            onClick={() => onStepClick(stepNumber)}
            className={cn(
                "relative",
                !disableStepClick ? "cursor-pointer" : ""
            )}
            whileHover={!disableStepClick ? { scale: 1.05 } : {}}
            whileTap={!disableStepClick ? { scale: 0.95 } : {}}
        >
            <motion.div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm border-2 transition-all duration-300",
                    isActive
                        ? "bg-violet-500 border-violet-200 text-violet-100 shadow-lg"
                        : isCompleted
                            ? "bg-violet-500 border-violet-200 text-violet-100"
                            : "bg-slate-700 border-slate-300 text-slate-300 hover:border-slate-200 hover:text-slate-200"
                )}
                animate={{
                    scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
            >
                {isCompleted ? (
                    <CheckIcon className="h-5 w-5" />
                ) : (
                    stepNumber
                )}
            </motion.div>
        </motion.div>
    );
}

// Step Connector Component
function StepConnector({ isCompleted }: StepConnectorProps) {
    return (
        <div className="flex-1 mx-4 h-0.5 bg-gray-400 relative overflow-hidden rounded">
            <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-300 to-violet-600"
                initial={{ width: 0 }}
                animate={{
                    width: isCompleted ? "100%" : "0%"
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>
    );
}

// Step Label Component
function StepLabel({
    currentStep,
    totalSteps,
    getStepLabel,
}: StepLabelProps) {
    return (
        <div className="text-center">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
            >
                {getStepLabel(currentStep) && (
                    <>
                        <h2 className="text-lg font-semibold mb-1">
                            {getStepLabel(currentStep)}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Step {currentStep} of {totalSteps}
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

// Step Navigation Component
function StepNavigation({
    currentStep,
    isLastStep,
    backButtonText,
    nextButtonText,
    completeButtonText,
    onBack,
    onNext,
    onComplete,
}: StepNavigationProps) {
    return (
        <>
            {/* Back Button */}
            {currentStep > 1 && (
                <div className="mb-6">
                    <motion.button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {backButtonText}
                    </motion.button>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-end gap-3">
                <motion.button
                    onClick={isLastStep ? onComplete : onNext}
                    className={cn(
                        "px-6 py-3 rounded-lg font-medium text-white transition-all duration-200",
                        isLastStep
                            ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25"
                            : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                    )}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isLastStep ? completeButtonText : nextButtonText}
                </motion.button>
            </div>
        </>
    );
}

// Step Completion Component
function StepCompletion() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
        >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All steps completed!
            </h3>
            <p className="text-gray-600">
                You have successfully completed all the steps.
            </p>
        </motion.div>
    );
}

// Step Content Wrapper Component
function StepContentWrapper({
    isCompleted,
    currentStep,
    direction,
    children,
    className = "",
}: StepContentProps) {
    const [parentHeight, setParentHeight] = useState<number>(0);

    return (
        <motion.div
            style={{ position: "relative", overflow: "visible" }}
            animate={{ height: isCompleted ? 0 : parentHeight || 'auto' }}
            transition={{ type: "spring", duration: 0.4, stiffness: 300, damping: 30 }}
            className={className}
        >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
                {!isCompleted && (
                    <SlideTransition
                        key={currentStep}
                        direction={direction}
                        onHeightReady={(h) => setParentHeight(h)}
                    >
                        {children}
                    </SlideTransition>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Slide Transition Component
interface SlideTransitionProps {
    children: ReactNode;
    direction: number;
    onHeightReady: (height: number) => void;
}

function SlideTransition({
    children,
    direction,
    onHeightReady,
}: SlideTransitionProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (containerRef.current) {
            onHeightReady(containerRef.current.offsetHeight);
        }
    }, [children, onHeightReady]);

    return (
        <motion.div
            ref={containerRef}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
            }}
            style={{ width: "100%" }}
        >
            {children}
        </motion.div>
    );
}

// Animation variants
const slideVariants: Variants = {
    enter: (dir: number) => ({
        x: dir >= 0 ? "100%" : "-100%",
        opacity: 0,
    }),
    center: {
        x: "0%",
        opacity: 1,
    },
    exit: (dir: number) => ({
        x: dir >= 0 ? "-100%" : "100%",
        opacity: 0,
    }),
};

// Main Stepper Component
const Stepper = forwardRef<StepperRef, StepperProps>(({
    children,
    initialStep = 1,
    onStepChange = () => { },
    onFinalStepCompleted = () => { },
    showStepIndicators = true,
    showStepLabels = true,
    stepLabels = [],
    containerClassName = "",
    contentClassName = "",
    backButtonText = "Back",
    nextButtonText = "Next",
    completeButtonText = "Complete",
    disableStepClick = false,
    hideNavigationButtons = false,
    ...rest
}, ref) => {
    const [currentStep, setCurrentStep] = useState<number>(initialStep);
    const [direction, setDirection] = useState<number>(0);
    const stepsArray = Children.toArray(children);
    const totalSteps = stepsArray.length;
    const isCompleted = currentStep > totalSteps;
    const isLastStep = currentStep === totalSteps;

    const updateStep = (newStep: number) => {
        if (newStep < 1 || newStep > totalSteps) return;

        setDirection(newStep > currentStep ? 1 : -1);
        setCurrentStep(newStep);

        if (newStep > totalSteps) {
            onFinalStepCompleted();
        } else {
            onStepChange(newStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            updateStep(currentStep - 1);
        }
    };

    const handleNext = () => {
        if (!isLastStep) {
            updateStep(currentStep + 1);
        }
    };

    const handleComplete = () => {
        onFinalStepCompleted();
    };

    const handleStepClick = (step: number) => {
        if (!disableStepClick && step !== currentStep) {
            updateStep(step);
        }
    };

    const getStepLabel = (stepIndex: number) => {
        if (stepLabels.length >= stepIndex) {
            return stepLabels[stepIndex - 1];
        }
        return '';
    };

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
        goToStep: updateStep,
        nextStep: handleNext,
        prevStep: handleBack,
        getCurrentStep: () => currentStep,
    }));

    return (
        <div className={cn("w-full", containerClassName)} {...rest}>
            {/* Step Indicators */}
            {showStepIndicators && (
                <div className="mb-8">
                    {/* Step Progress Bar */}
                    <div className="flex items-center justify-center mb-6">
                        {stepsArray.map((_, index) => {
                            const stepNumber = index + 1;
                            const isActive = stepNumber === currentStep;
                            const isCompleted = stepNumber < currentStep;
                            const isNotLastStep = index < totalSteps - 1;

                            return (
                                <React.Fragment key={stepNumber}>
                                    <StepIndicator
                                        stepNumber={stepNumber}
                                        isActive={isActive}
                                        isCompleted={isCompleted}
                                        disableStepClick={disableStepClick}
                                        onStepClick={handleStepClick}
                                    />

                                    {isNotLastStep && (
                                        <StepConnector isCompleted={isCompleted} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Step Labels */}
                    {showStepLabels && (
                        <StepLabel
                            currentStep={currentStep}
                            totalSteps={totalSteps}
                            stepLabels={stepLabels}
                            getStepLabel={getStepLabel}
                        />
                    )}
                </div>
            )}

            {/* Navigation */}
            {!hideNavigationButtons && (
                <StepNavigation
                    currentStep={currentStep}
                    isLastStep={isLastStep}
                    backButtonText={backButtonText}
                    nextButtonText={nextButtonText}
                    completeButtonText={completeButtonText}
                    onBack={handleBack}
                    onNext={handleNext}
                    onComplete={handleComplete}
                />
            )}

            {/* Content Area */}
            <div className={cn("relative", contentClassName)}>
                <StepContentWrapper
                    isCompleted={isCompleted}
                    currentStep={currentStep}
                    direction={direction}
                >
                    {!isCompleted && stepsArray[currentStep - 1]}
                </StepContentWrapper>
            </div>

            {/* Completion State */}
            {isCompleted && (
                <StepCompletion />
            )}
        </div>
    );
});

Stepper.displayName = 'Stepper';

// Step Component
interface StepProps {
    children: ReactNode;
    className?: string;
}

export function Step({ children, className = "" }: StepProps) {
    return <div className={cn("w-full", className)}>{children}</div>;
}

// Check Icon Component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
        >
            <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    delay: 0.1,
                    type: "tween",
                    ease: "easeOut",
                    duration: 0.4,
                }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}

// Export individual components for reuse
export {
    StepIndicator,
    StepConnector,
    StepLabel,
    StepNavigation,
    StepCompletion,
    StepContentWrapper,
    type StepIndicatorProps,
    type StepConnectorProps,
    type StepLabelProps,
    type StepNavigationProps,
    type StepContentProps,
};

export default Stepper;
