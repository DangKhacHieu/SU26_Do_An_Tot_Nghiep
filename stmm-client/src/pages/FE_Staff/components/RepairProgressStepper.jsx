import { Check, Circle, XCircle } from 'lucide-react';
import { TASK_STATUS } from '../../../constants/taskEnums';

const STEPS = [
  { label: 'Assessment', description: 'Review the issue and prepare the work.' },
  { label: 'Awaiting Approval', description: 'Quotation is waiting for approval.' },
  { label: 'In Progress', description: 'Approved repair work is underway.' },
  { label: 'Completed', description: 'Repair evidence and results are submitted.' },
];

const ACTIVE_STEP = {
  [TASK_STATUS.PENDING]: 0,
  [TASK_STATUS.PENDING_APPROVAL]: 1,
  [TASK_STATUS.IN_PROGRESS]: 2,
};

export default function RepairProgressStepper({ status }) {
  const isCompleted = status === TASK_STATUS.COMPLETED;
  const isCancelled = status === TASK_STATUS.CANCELLED;
  const activeStep = ACTIVE_STEP[status] ?? 0;

  return (
    <section className="repair-stepper-panel" aria-label="Repair progress">
      <div className="repair-stepper-panel__header">
        <div><p>Repair Workflow</p><h3>Progress</h3></div>
        {isCancelled ? <span className="repair-stepper__cancelled"><XCircle size={15} /> Cancelled</span> : null}
      </div>
      <ol className={`repair-stepper ${isCancelled ? 'repair-stepper--cancelled' : ''}`}>
        {STEPS.map((step, index) => {
          const isDone = !isCancelled && (isCompleted || index < activeStep);
          const isActive = !isCancelled && !isCompleted && index === activeStep;
          return (
            <li className={isDone ? 'is-done' : isActive ? 'is-active' : ''} key={step.label}>
              <span className="repair-stepper__marker" aria-hidden="true">
                {isDone ? <Check size={15} /> : <Circle size={12} fill="currentColor" />}
              </span>
              <div><strong>{step.label}</strong><p>{step.description}</p></div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
