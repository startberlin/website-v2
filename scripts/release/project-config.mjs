export function assertVercelProject(project, { projectId, projectName, orgId }) {
  if (project.id !== projectId || project.name !== projectName || project.accountId !== orgId) {
    throw new Error('Vercel project identity does not match the reviewed release configuration.');
  }
  if (project.link) throw new Error('Website V2 deploys uploaded source through GitHub Actions. Remove its Vercel Git connection; never link a personal GitHub login to the shared START account.');
  if (project.autoAssignCustomDomains !== false) throw new Error('Disable automatic production domain assignment before enabling the pipeline.');
  if (project.ssoProtection?.deploymentType !== 'all_except_custom_domains') throw new Error('Keep Vercel Authentication enabled for individual deployment URLs; only the fixed staging alias has a public exception.');
  if (project.autoExposeSystemEnvs !== false) throw new Error('Disable automatic system environment exposure so the automation bypass credential cannot enter PR application code.');
}
