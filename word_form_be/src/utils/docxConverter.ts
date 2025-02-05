import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface ConversionResult {
  inputPath: string;
  outputPath: string;
}

export const convertDocxToPdf = async (
  inputPath: string,
  outputPath: string
): Promise<ConversionResult> => {
  try {
    // Ensure paths are absolute
    const absoluteInputPath = path.resolve(inputPath);
    const absoluteOutputPath = path.resolve(outputPath);

    // Convert to PDF using LibreOffice
    const command = `soffice --headless --convert-to pdf --outdir "${path.dirname(absoluteOutputPath)}" "${absoluteInputPath}"`;

    await execAsync(command);

    return {
      inputPath: absoluteInputPath,
      outputPath: absoluteOutputPath
    };
  } catch (error) {
    throw new Error(`PDF conversion failed: ${error}`);
  }
};