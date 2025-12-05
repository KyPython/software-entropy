import { ScanReport } from '../types';
import * as fs from 'fs';

export class JsonReporter {
  generate(report: ScanReport): string {
    return JSON.stringify(report, null, 2);
  }

  writeToFile(report: ScanReport, filePath: string): void {
    fs.writeFileSync(filePath, this.generate(report), 'utf-8');
  }
}

