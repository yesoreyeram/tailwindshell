/**
 * IF, ElseIf, Else Examples
 *
 * Demonstrates declarative conditional rendering with chained conditions.
 */

import { Shell, IF, ElseIf, Else, ShellPipeline } from 'tailwindshell';
import { useState } from 'react';

/**
 * Example 1: Simple IF/Else based on environment
 */
export function EnvironmentBasedDeployment() {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <IF condition={isProduction}>
      <Shell
        className="npm-run-deploy:production"
        sudo={true}
        onComplete={() => console.log('Deployed to production')}
      />
      <Else>
        <Shell
          className="npm-run-deploy:development"
          onComplete={() => console.log('Deployed to development')}
        />
      </Else>
    </IF>
  );
}

/**
 * Example 2: IF/ElseIf/Else chain for multiple environments
 */
export function MultiEnvironmentDeployment() {
  const env = process.env.DEPLOY_ENV || 'dev';

  return (
    <IF condition={env === 'production'}>
      <Shell className="npm-run-deploy:prod" sudo={true} />
      <Shell className="npm-run-notify:slack--channel-deploys" />

      <ElseIf condition={env === 'staging'}>
        <Shell className="npm-run-deploy:staging" />
        <Shell className="npm-run-test:smoke" />
      </ElseIf>

      <ElseIf condition={env === 'qa'}>
        <Shell className="npm-run-deploy:qa" />
      </ElseIf>

      <Else>
        <Shell className="npm-run-deploy:dev" />
        <Shell className="echo-Deployed-to-development" />
      </Else>
    </IF>
  );
}

/**
 * Example 3: Async condition with file existence check
 */
export function ConditionalFileProcessing() {
  const checkFileExists = async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/files/exists?name=${filename}`);
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  };

  return (
    <IF condition={() => checkFileExists('data.csv')}>
      <ShellPipeline
        steps={[
          'cat-data.csv',
          'grep-2024',
          'wc--l'
        ]}
        onComplete={(results) => {
          console.log('Processing complete:', results[results.length - 1].stdout);
        }}
      />

      <Else>
        <Shell className="echo-Data-file-not-found" />
        <Shell className="exit-1" />
      </Else>
    </IF>
  );
}

/**
 * Example 4: Build system with fallback options
 */
export function SmartBuildSystem() {
  const [buildTool, setBuildTool] = useState<string>('');

  const hasCommand = async (cmd: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/check-command?cmd=${cmd}`);
      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <IF condition={() => hasCommand('turbo')}>
      <Shell
        className="turbo-run-build"
        onComplete={() => {
          setBuildTool('turbo');
          console.log('Built with Turbo');
        }}
      />

      <ElseIf condition={() => hasCommand('nx')}>
        <Shell
          className="nx-run-build"
          onComplete={() => {
            setBuildTool('nx');
            console.log('Built with Nx');
          }}
        />
      </ElseIf>

      <ElseIf condition={() => hasCommand('lerna')}>
        <Shell
          className="lerna-run-build"
          onComplete={() => {
            setBuildTool('lerna');
            console.log('Built with Lerna');
          }}
        />
      </ElseIf>

      <Else>
        <Shell
          className="npm-run-build"
          onComplete={() => {
            setBuildTool('npm');
            console.log('Built with npm');
          }}
        />
      </Else>
    </IF>
  );
}

/**
 * Example 5: Database migration with version checks
 */
export function DatabaseMigration() {
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const targetVersion = 5;

  return (
    <>
      {/* Check current version */}
      <Shell
        className="psql-db--command-SELECT-version-FROM-schema_version"
        onComplete={(result) => {
          const version = parseInt(result.stdout.trim(), 10);
          setCurrentVersion(version);
        }}
      />

      {/* Run appropriate migrations */}
      <IF condition={currentVersion === targetVersion}>
        <Shell className="echo-Database-is-up-to-date" />

        <ElseIf condition={currentVersion < targetVersion}>
          <Shell className={`migrate-up-from-${currentVersion}-to-${targetVersion}`} />
          <Shell className="echo-Migration-completed" />
        </ElseIf>

        <ElseIf condition={currentVersion > targetVersion}>
          <Shell className="echo-WARNING:-Database-version-is-newer-than-target" />
          <Shell className="exit-1" />
        </ElseIf>

        <Else>
          <Shell className="echo-Unable-to-determine-database-version" />
          <Shell className="exit-1" />
        </Else>
      </IF>
    </>
  );
}

/**
 * Example 6: Feature flag-based execution
 */
export function FeatureFlagWorkflow() {
  const [features, setFeatures] = useState({
    newAuth: false,
    betaUI: false,
    experimentalCache: false
  });

  const isFeatureEnabled = (feature: keyof typeof features) => features[feature];

  return (
    <>
      <IF condition={() => isFeatureEnabled('newAuth')}>
        <Shell className="npm-run-build:auth-v2" />
        <Else>
          <Shell className="npm-run-build:auth-v1" />
        </Else>
      </IF>

      <IF condition={() => isFeatureEnabled('betaUI')}>
        <Shell className="npm-run-build:ui-beta" />
        <Else>
          <Shell className="npm-run-build:ui-stable" />
        </Else>
      </IF>

      <IF condition={() => isFeatureEnabled('experimentalCache')}>
        <Shell
          className="npm-run-build:cache-redis"
          env={{ CACHE_ENABLED: 'true' }}
        />
        <Else>
          <Shell className="npm-run-build:cache-memory" />
        </Else>
      </IF>
    </>
  );
}

/**
 * Example 7: Platform-specific builds
 */
export function PlatformSpecificBuild() {
  const platform = process.platform;

  return (
    <IF condition={platform === 'darwin'}>
      <Shell className="npm-run-build:macos" />
      <Shell className="npm-run-package:dmg" />

      <ElseIf condition={platform === 'win32'}>
        <Shell className="npm-run-build:windows" />
        <Shell className="npm-run-package:exe" />
      </ElseIf>

      <ElseIf condition={platform === 'linux'}>
        <Shell className="npm-run-build:linux" />
        <Shell className="npm-run-package:appimage" />
      </ElseIf>

      <Else>
        <Shell className="echo-Unsupported-platform:-${platform}" />
        <Shell className="exit-1" />
      </Else>
    </IF>
  );
}

/**
 * Example 8: Nested conditionals for complex logic
 */
export function NestedConditionalWorkflow() {
  const isProd = process.env.NODE_ENV === 'production';
  const hasTests = true;

  return (
    <IF condition={isProd}>
      {/* Production path */}
      <Shell className="npm-run-lint" />

      <IF condition={hasTests}>
        <Shell className="npm-test" />
        <Shell className="npm-run-build" />
        <Shell className="npm-run-deploy:prod" sudo={true} />

        <Else>
          <Shell className="echo-WARNING:-No-tests-in-production-build" />
          <Shell className="npm-run-build" />
        </Else>
      </IF>

      <Else>
        {/* Development path */}
        <Shell className="npm-run-dev" />
      </Else>
    </IF>
  );
}

/**
 * Example 9: Time-based execution
 */
export function TimeBasedBackup() {
  const hour = new Date().getHours();
  const isBusinessHours = hour >= 9 && hour <= 17;
  const isNightTime = hour >= 22 || hour <= 6;

  return (
    <IF condition={isNightTime}>
      {/* Full backup during night */}
      <Shell className="pg_dump-full-db_redirect_backup.sql" />
      <Shell className="tar--czf-backup.tar.gz-data/" />

      <ElseIf condition={!isBusinessHours}>
        {/* Incremental backup outside business hours */}
        <Shell className="pg_dump-incremental-db_redirect_backup-inc.sql" />
      </ElseIf>

      <Else>
        {/* Minimal backup during business hours */}
        <Shell className="echo-Skipping-backup-during-business-hours" />
      </Else>
    </IF>
  );
}

/**
 * Example 10: Testing with conditional test suites
 */
export function ConditionalTestExecution() {
  const runFullTests = process.env.FULL_TEST === 'true';
  const isCIEnvironment = process.env.CI === 'true';

  return (
    <IF condition={runFullTests}>
      <Shell className="npm-run-test:all" timeout={600000} />
      <Shell className="npm-run-test:e2e" timeout={900000} />
      <Shell className="npm-run-test:visual" timeout={300000} />

      <ElseIf condition={isCIEnvironment}>
        <Shell className="npm-run-test:ci" />
        <Shell className="npm-run-test:smoke" />
      </ElseIf>

      <Else>
        <Shell className="npm-run-test:unit" />
      </Else>
    </IF>
  );
}

export default EnvironmentBasedDeployment;
