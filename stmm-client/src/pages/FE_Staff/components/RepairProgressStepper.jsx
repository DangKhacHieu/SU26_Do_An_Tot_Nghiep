import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Check, Circle, XCircle } from 'lucide-react';
import { TASK_STATUS } from '../../../constants/taskEnums';

const ACTIVE_STEP = {
  [TASK_STATUS.PENDING]: 0,
  [TASK_STATUS.PENDING_APPROVAL]: 1,
  [TASK_STATUS.IN_PROGRESS]: 2,
};

export default function RepairProgressStepper({ status }) {
  const { t } = useTranslation();

  const STEPS = useMemo(() => [
    { label: t('repairprogressstepper.assessment'), description: t('repairprogressstepper.review_the_issue_and') },
    { label: t('repairprogressstepper.awaiting_approval'), description: t('repairprogressstepper.quotation_is_waiting_for') },
    { label: t('repairprogressstepper.in_progress'), description: t('repairprogressstepper.approved_repair_work_is') },
    { label: t('repairprogressstepper.completed'), description: t('repairprogressstepper.repair_evidence_and_results') },
  ], [t]);

  const isCompleted = status === TASK_STATUS.COMPLETED;
  const isCancelled = status === TASK_STATUS.CANCELLED;
  const activeStep = ACTIVE_STEP[status] ?? 0;

  return (
    <section className="repair-stepper-panel" aria-label={t('repairprogressstepper.repair_progress')}>
      <div className="repair-stepper-panel__header">
        <div><p>{t('repairprogressstepper.repair_workflow')}</p><h3>{t('repairprogressstepper.progress')}</h3></div>
        {isCancelled ? <span className="repair-stepper__cancelled"><XCircle size={15} /> {t('repairprogressstepper.cancelled')}</span> : null}
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
