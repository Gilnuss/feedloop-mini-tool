/**
 * Where feedback comes from and where tickets land.
 *
 * Names rather than logos on purpose: logos need asset licensing and a lot of
 * them imply partnerships that do not exist. Roadmap items carry a dim dot and a
 * "soon" tag — claiming an integration you do not have is the fastest way to
 * lose a technical buyer, and this audience checks.
 */

import type { WorkflowIntegration } from "@/content/full/workflowIntegrations";
import {
  FEEDBACK_INTAKE_INTEGRATIONS,
  TICKET_DESTINATION_INTEGRATIONS,
} from "@/content/full/workflowIntegrations";
import { FullSectionHead } from "./FullSectionHead";

function IntegrationChip({ integration }: { integration: WorkflowIntegration }) {
  if (!integration.isAvailable) {
    return (
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-line-subtle text-[12.5px] font-medium text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted opacity-50" />
        {integration.name}
        <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-ink-muted">
          soon
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-line bg-surface text-[12.5px] font-medium text-ink">
      <span className="w-1.5 h-1.5 rounded-full bg-signal" />
      {integration.name}
    </span>
  );
}

function IntegrationDirectionCard({
  heading,
  integrations,
}: {
  heading: string;
  integrations: WorkflowIntegration[];
}) {
  return (
    <div className="flex flex-col gap-3 bg-surface border border-line rounded-card shadow-card px-4.5 py-4">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {heading}
      </span>
      <div className="flex flex-wrap gap-2">
        {integrations.map((integration) => (
          <IntegrationChip key={integration.name} integration={integration} />
        ))}
      </div>
    </div>
  );
}

export function WorkflowIntegrations() {
  return (
    <section className="w-full">
      <FullSectionHead eyebrow="Integrations" title="Fits the stack you already have" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <IntegrationDirectionCard
          heading="Feedback comes in from"
          integrations={FEEDBACK_INTAKE_INTEGRATIONS}
        />
        <IntegrationDirectionCard
          heading="Tickets go out to"
          integrations={TICKET_DESTINATION_INTEGRATIONS}
        />
      </div>
    </section>
  );
}
