import { createPortal } from 'react-dom';
import { useStudioExperience } from '../context/StudioExperienceContext';

export function StudioHelpButton() {
  const { onboardingEnabled, setOnboardingOpen } = useStudioExperience();
  if (!onboardingEnabled) return null;
  return (
    <button type="button" className="action-circle-btn" title="Ajuda e primeiros passos" aria-label="Ajuda e primeiros passos" onClick={() => setOnboardingOpen(true)}>
      <span className="studio-help-symbol">?</span>
    </button>
  );
}

export function StudioOnboardingCard() {
  const { onboardingEnabled, loading, completion, onboardingSteps, preferences, setOnboardingOpen, restartOnboarding } = useStudioExperience();
  if (!onboardingEnabled || loading) return null;
  const completed = onboardingSteps.filter(step => preferences.onboarding_steps.includes(step.id)).length;
  const isComplete = completion >= 100;
  return (
    <section className={`studio-onboarding-card ${isComplete ? 'is-complete' : ''}`}>
      <div className="studio-onboarding-card-icon" aria-hidden="true">{isComplete ? '✓' : '✦'}</div>
      <div className="studio-onboarding-card-copy">
        <span>{isComplete ? 'Ambiente preparado' : 'Primeiros passos'}</span>
        <strong>{isComplete ? 'Configuração inicial concluída' : `${completed} de ${onboardingSteps.length} etapas concluídas`}</strong>
        <div className="studio-progress-track"><span style={{ width: `${completion}%` }} /></div>
      </div>
      <button type="button" onClick={() => isComplete ? restartOnboarding() : setOnboardingOpen(true)}>
        {isComplete ? 'Revisar configuração' : 'Continuar configuração'}
      </button>
    </section>
  );
}

export function StudioOnboardingModal() {
  const {
    onboardingEnabled, onboardingOpen, setOnboardingOpen, preferences, onboardingSteps,
    completion, setStepCompleted, dismissOnboarding, navigate
  } = useStudioExperience();
  if (!onboardingEnabled || !onboardingOpen) return null;
  const completed = onboardingSteps.filter(step => preferences.onboarding_steps.includes(step.id)).length;
  return createPortal(
    <div className="studio-onboarding-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setOnboardingOpen(false)}>
      <section className="studio-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="studio-onboarding-title">
        <header className="studio-onboarding-header">
          <div>
            <span>Onboarding do Studio</span>
            <h2 id="studio-onboarding-title">Vamos preparar sua experiência</h2>
            <p>Conclua no seu ritmo. O progresso fica salvo para você continuar de qualquer dispositivo.</p>
          </div>
          <button type="button" aria-label="Fechar onboarding" onClick={() => setOnboardingOpen(false)}>×</button>
        </header>

        <div className="studio-onboarding-progress">
          <div><strong>{completion}%</strong><span>{completed} de {onboardingSteps.length} etapas</span></div>
          <div className="studio-progress-track"><span style={{ width: `${completion}%` }} /></div>
        </div>

        <div className="studio-onboarding-steps">
          {onboardingSteps.map((step, index) => {
            const done = preferences.onboarding_steps.includes(step.id);
            return (
              <article key={step.id} className={`studio-onboarding-step ${done ? 'is-done' : ''}`}>
                <button type="button" className="studio-step-check" onClick={() => setStepCompleted(step.id, !done)} aria-label={done ? `Marcar ${step.title} como pendente` : `Concluir ${step.title}`}>
                  {done ? '✓' : index + 1}
                </button>
                <div><strong>{step.title}</strong><p>{step.description}</p></div>
                <button type="button" className="studio-step-action" onClick={() => { navigate(step.tab); setOnboardingOpen(false); }}>{step.actionLabel} →</button>
              </article>
            );
          })}
        </div>

        <footer className="studio-onboarding-footer">
          <button type="button" className="studio-onboarding-later" onClick={dismissOnboarding}>Explorar sozinho por enquanto</button>
          <button type="button" className="btn-primary" onClick={() => {
            const next = onboardingSteps.find(step => !preferences.onboarding_steps.includes(step.id));
            if (next) navigate(next.tab);
            setOnboardingOpen(false);
          }}>{completion >= 100 ? 'Concluir' : 'Continuar pela próxima etapa'}</button>
        </footer>
      </section>
    </div>, document.body
  );
}
