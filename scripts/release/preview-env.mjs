export function assertPreviewVariables(variables) {
  for (const variable of variables) {
    if (!variable.target?.includes('preview') || variable.gitBranch === 'main') continue;
    const credentialName = /SECRET|TOKEN|PASSWORD|(?:^|_)API_KEY$|PRIVATE_KEY|DATABASE_URL|CREDENTIALS/i.test(variable.key);
    const publicConfig = variable.key.startsWith('PUBLIC_') || ['plain', 'config', 'system'].includes(variable.type);
    if (credentialName || !publicConfig) throw new Error('PR previews may share public Config variables only. Scope service secrets to main.');
  }
}
