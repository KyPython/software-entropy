import { CodeSmell, ScanReport } from './types';

export interface CIAnnotation {
  file: string;
  line: number;
  severity: 'notice' | 'warning' | 'error';
  message: string;
  title: string;
}

export function generateCIAnnotations(report: ScanReport): CIAnnotation[] {
  const annotations: CIAnnotation[] = [];

  for (const result of report.results) {
    for (const smell of result.smells) {
      const severity = mapSeverityToCI(smell.severity);
      annotations.push({
        file: result.file,
        line: smell.line || 1,
        severity,
        message: smell.message,
        title: `${smell.rule}: ${smell.message}`
      });
    }
  }

  return annotations;
}

function mapSeverityToCI(severity: string): 'notice' | 'warning' | 'error' {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    default:
      return 'notice';
  }
}

export function outputGitHubAnnotations(annotations: CIAnnotation[]): void {
  if (process.env.CI !== 'true' || !process.env.GITHUB_ACTIONS) {
    return; // Only output in GitHub Actions
  }

  for (const annotation of annotations) {
    const file = annotation.file.replace(process.cwd() + '/', '');
    console.log(
      `::${annotation.severity} file=${file},line=${annotation.line}::${annotation.title}`
    );
  }
}

export function shouldFailBuild(
  report: ScanReport,
  failOnHigh: boolean = true,
  failOnMedium: boolean = false
): boolean {
  if (failOnHigh && report.summary.bySeverity.high > 0) {
    return true;
  }
  if (failOnMedium && report.summary.bySeverity.medium > 0) {
    return true;
  }
  return false;
}

