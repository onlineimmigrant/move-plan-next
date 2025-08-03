import 'server-only';

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  created: number;
  ready?: number;
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  targets?: {
    production: {
      domain: string;
    };
  };
}

interface VercelEnvVar {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type: 'plain' | 'secret' | 'encrypted';
}

class VercelClient {
  private token: string;
  private teamId?: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${this.teamId ? `?teamId=${this.teamId}` : ''}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Vercel API Error: ${response.status} - ${error.error?.message || error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  // Create a new project
  async createProject(name: string, framework = 'nextjs'): Promise<VercelProject> {
    const projectData: any = {
      name,
      framework,
      publicSource: false, // Private repository
      // rootDirectory omitted - defaults to project root
    };

    // Don't link GitHub repository during creation - we'll do it separately
    // This avoids permission issues during project creation

    return this.request<VercelProject>('/v10/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // Deploy from GitHub repository
  async deployFromGitHub(
    projectName: string, 
    gitUrl: string, 
    branch = 'main',
    envVars: VercelEnvVar[] = []
  ): Promise<VercelDeployment> {
    // Extract owner and repo from GitHub URL
    const repoMatch = gitUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub URL format');
    }
    
    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present
    
    // Try different branch references if the specified one fails
    const branchesToTry = [branch];
    if (branch !== 'main') branchesToTry.push('main');
    if (branch !== 'master') branchesToTry.push('master');
    
    for (const branchName of branchesToTry) {
      try {
        return await this.request<VercelDeployment>('/v13/deployments', {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            gitSource: {
              type: 'github',
              repoId: `${owner}/${repoName}`,
              ref: branchName,
            },
            projectSettings: {
              framework: 'nextjs',
            },
            target: 'production',
          }),
        });
      } catch (error: any) {
        console.log(`Failed to deploy with branch ${branchName}:`, error.message);
        if (branchName === branchesToTry[branchesToTry.length - 1]) {
          throw error;
        }
      }
    }
    
    throw new Error('Failed to deploy with any available branch');
  }

  // Trigger a deployment for a project (simpler approach)
  async deployProject(projectId: string, projectName: string, target = 'production'): Promise<VercelDeployment> {
    // Try the redeploy endpoint first, then fallback to manual deployment
    try {
      return await this.request<VercelDeployment>(`/v9/projects/${projectId}/redeploy`, {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          target,
        }),
      });
    } catch (error) {
      // Fallback: Use the standard deployments endpoint with minimal parameters
      return this.request<VercelDeployment>('/v13/deployments', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          projectId: projectId,
          target,
          source: 'git',
        }),
      });
    }
  }

  // Set environment variables for a project
  async setEnvironmentVariables(
    projectId: string, 
    envVars: VercelEnvVar[]
  ): Promise<void> {
    await Promise.all(
      envVars.map(envVar =>
        this.request(`/v10/projects/${projectId}/env`, {
          method: 'POST',
          body: JSON.stringify(envVar),
        })
      )
    );
  }

  // Get deployment status
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request<VercelDeployment>(`/v13/deployments/${deploymentId}`);
  }

  // Get project details
  async getProject(projectId: string): Promise<VercelProject> {
    return this.request<VercelProject>(`/v10/projects/${projectId}`);
  }

  // List user projects
  async listProjects(): Promise<{ projects: VercelProject[] }> {
    return this.request<{ projects: VercelProject[] }>('/v10/projects');
  }

  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    await this.request(`/v10/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Generate a custom domain for the project
  async addDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`/v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    });
  }

  // Connect a GitHub repository to an existing project
  async connectGitRepository(projectId: string, gitRepository: string): Promise<void> {
    const repoMatch = gitRepository.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub URL format');
    }
    
    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present
    
    await this.request(`/v10/projects/${projectId}/link`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'github',
        repo: `${owner}/${repoName}`,
        gitSource: {
          type: 'github',
          repo: `${owner}/${repoName}`,
        },
      }),
    });
  }

  // Get Vercel dashboard URL for a project
  getProjectDashboardUrl(projectId: string): string {
    return `https://vercel.com/dashboard/projects/${projectId}`;
  }

  // Get project settings URL for manual Git connection
  getProjectSettingsUrl(projectId: string): string {
    return `https://vercel.com/dashboard/projects/${projectId}/settings/git`;
  }
}

// Factory function to create Vercel client
export function createVercelClient(token?: string, teamId?: string): VercelClient {
  const vercelToken = token || process.env.VERCEL_TOKEN;
  const vercelTeamId = teamId || process.env.VERCEL_TEAM_ID;

  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  return new VercelClient(vercelToken, vercelTeamId);
}

// Helper function to generate environment variables for a site
export function generateSiteEnvironmentVariables(
  organizationId: string,
  siteName: string,
  baseUrl: string
): VercelEnvVar[] {
  return [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_PROJECT_ID',
      value: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || '',
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      value: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      target: ['production', 'preview', 'development'],
      type: 'encrypted',
    },
    {
      key: 'NEXT_PUBLIC_TENANT_ID',
      value: organizationId,
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    {
      key: 'NEXT_PUBLIC_BASE_URL',
      value: baseUrl,
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    {
      key: 'NEXT_PUBLIC_SITE_NAME',
      value: siteName,
      target: ['production', 'preview', 'development'],
      type: 'plain',
    },
    // Optional environment variables - only include if they exist
    ...(process.env.TWILIO_ACCOUNT_SID ? [{
      key: 'TWILIO_ACCOUNT_SID',
      value: process.env.TWILIO_ACCOUNT_SID,
      target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
      type: 'encrypted' as const,
    }] : []),
    ...(process.env.TWILIO_AUTH_TOKEN ? [{
      key: 'TWILIO_AUTH_TOKEN',
      value: process.env.TWILIO_AUTH_TOKEN,
      target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
      type: 'encrypted' as const,
    }] : []),
    ...(process.env.MONGODB_URI ? [{
      key: 'MONGODB_URI',
      value: process.env.MONGODB_URI,
      target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
      type: 'encrypted' as const,
    }] : []),
    ...(process.env.STRIPE_SECRET_KEY ? [{
      key: 'STRIPE_SECRET_KEY',
      value: process.env.STRIPE_SECRET_KEY,
      target: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
      type: 'encrypted' as const,
    }] : []),
  ];
}

export type { VercelDeployment, VercelProject, VercelEnvVar };
