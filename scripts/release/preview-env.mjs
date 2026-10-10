export function assertPreviewVariables(variables) {
  for (const variable of variables) {
    if (!variable.target?.includes('preview')) continue;
    const credentialName = /SECRET|TOKEN|PASSWORD|(?:^|_)API_KEY$|PRIVATE_KEY|DATABASE_URL|CREDENTIALS/i.test(variable.key);
    const publicConfig = variable.key.startsWith('PUBLIC_') || ['plain', 'config', 'system'].includes(variable.type);
    if (credentialName || !publicConfig) throw new Error('Preview deployments may share public Config variables only. Keep service credentials in Production; disconnected Git projects cannot rely on branch-specific secret isolation.');
  }
}
