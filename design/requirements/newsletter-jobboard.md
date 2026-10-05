# Required: newsletter and jobboard integration

Confirmed by Jannik on 28 September 2026. Both integrations are required parts of the website relaunch. They are not optional ideas and are not implemented by this planning update.

## Website experience

The newsletter needs a visible signup entry in the website layout, connected to the existing newsletter workflow. Show a real success or error state. Keep the signup usable on mobile. The exact page placement and any issue archive can be decided during implementation.

The jobboard needs a clear navigation entry and a usable listing view connected to the existing jobboard project. Visitors should be able to open a job and reach its intended application destination. Agree useful filters from the available listing data. Decide the public/member access model before implementing it.

## Integration and ownership

Reuse the existing newsletter and jobboard work. Connect the website to their maintained data and submission flows, including the planned Cockpit integration. Avoid creating a second independent subscriber list or an unrelated job database in the website project.

Operations handles the technical integration. Growth supplies newsletter content; Partnerships provides the job and company inputs. Confirm the operational owner for each ongoing workflow when implementing it.

Related local projects, to inspect before wiring anything:

- `/Users/jannik/Developer/start_newsletter`
- `/Users/jannik/Developer/start_jobboard`
- `/Users/jannik/Developer/start_jobboard_public`

These folder links identify existing work. Their current branches and integration contracts were not audited in this planning update. Confirm the intended active implementation before reuse.

## Acceptance

A newsletter signup must reach the intended subscriber workflow. Job listings must come from the intended maintained source, with working application links and a defined approach to closed jobs. Verify the complete selected flow after implementation. Adding navigation labels or a preview-only success message is not completion.

The exact routes, service interfaces and credentials remain implementation details to confirm from the existing projects. No production forms were submitted and no application code was changed by recording this requirement.
