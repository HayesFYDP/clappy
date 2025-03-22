import * as fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import type Clappy from './clappy';

// record audio from the user's microphone, with optional detection of speech start and end
// if autoDetect is false, then the recording begins immediately and lasts for maxDurationSeconds
// if autoDetect is true, then the recording begins when speech is detected and ends when speech stops with a max duration of maxDurationSeconds
// returns the file path of the recorded audio
export async function recordAudio(clappy: Clappy, maxDurationSeconds: number = 10, autoDetect = true): Promise<string> {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const outputPath = path.join(clappy.getClappyTempPath(), `recording-${timestamp}.wav`);

    const argsManual = [
      '-d',
      '-c',
      '1',
      '-r',
      '16000',
      '-b',
      '16',
      '-e',
      'signed-integer',
      outputPath,
      'trim',
      '0',
      maxDurationSeconds.toString(),
    ];
    // uses sox's silence detection which waits for audio louder than 3% volume for 0.1 seconds to start and ends after 2 seconds of audio below 3%
    const argsAuto = [
      '-d',
      '-c',
      '1',
      '-r',
      '16000',
      '-b',
      '16',
      '-e',
      'signed-integer',
      outputPath,
      'silence',
      '1',
      '0.1',
      '3%',
      '1',
      '2.0',
      '3%',
    ];

    console.log('[SPEECH] starting audio recording');
    const recordProcess = spawn('sox', autoDetect ? argsAuto : argsManual);

    const timeoutId = setTimeout(() => {
      recordProcess.kill('SIGINT'); // send sox a signal to stop recording
    }, maxDurationSeconds * 1000);

    recordProcess.on('exit', async () => {
      clearTimeout(timeoutId);
      console.log('[SPEECH] finished recording');
      resolve(outputPath);
    });
  });
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const currentPath = process.cwd();
    process.chdir('./whisper.cpp');

    try {
      const whisperArgs = ['-f', audioPath, '-otxt'];
      const whisperProcess = (() => {
        // if you get errors here, make sure whisper.cpp has been built (see README)
        if (process.platform === 'win32') {
          return spawn('.\\build\\bin\\Release\\whisper-cli.exe', whisperArgs);
        }
        if (process.platform === 'darwin') {
          return spawn('./build/bin/whisper-cli', whisperArgs);
        }

        throw new Error('Unsupported platform for whisper');
      })();

      whisperProcess.on('exit', async () => {
        console.log('finished whisper');

        // Read the generated .txt file
        const txtPath = `${audioPath}.txt`;
        const transcript = await fs.promises.readFile(txtPath, 'utf8');
        console.log('[SPEECH] Transcription text:', transcript);

        // Clean up files
        fs.unlinkSync(txtPath);
        resolve(transcript.trim());
      });

      whisperProcess.on('error', (err) => {
        console.error('[SPEECH] Error running whisper:', err);
        reject(err);
      });
    } catch (err) {
      console.error('[SPEECH] Error transcribing audio:', err);
      reject(err);
    } finally {
      process.chdir(currentPath);
    }
  });
}
