import say from 'say';
import * as fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { InterventionHandler, InterventionPayloadMap, Interventions } from './types';
import type Clappy from '../clappy';
import { ClappyExpression } from '../types';

export default class SpeechInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.SPEAK_CLAPPY] as const; // TODO: add here

  clappy: Clappy;

  constructor(clappy: Clappy) {
    this.clappy = clappy;
  }

  async handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<void> {
    switch (intervention) {
      case Interventions.SPEAK_CLAPPY:
        await this.speakClappy(payload);
        break;
      default:
        throw new Error(`SpeechInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  async speakClappy(payload?: InterventionPayloadMap[Interventions.SPEAK_CLAPPY]) {
    const message = payload?.message ?? 'its biglet time its biglet time its biglet time its biglet time its biglet time';
    const estSpeechDuration = message.split(' ').length * 500 + 2000; // assume 0.5 seconds per word, plus 2 second buffer

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.handleIntervention(Interventions.POPUP_CLAPPY, {
      message: '',
      expression: ClappyExpression.Chomp,
      timeoutMs: estSpeechDuration,
    });
    await this.speak(message);
  }

  // record audio from the user's microphone, with optional detection of speech start and end
  // if autoDetect is false, then the recording begins immediately and lasts for maxDurationSeconds
  // if autoDetect is true, then the recording begins when speech is detected and ends when speech stops with a max duration of maxDurationSeconds
  // returns the file path of the recorded audio
  async recordAudio(maxDurationSeconds: number, autoDetect = true): Promise<string> {
    return new Promise((resolve) => {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const outputPath = path.join(this.clappy.getClappyTempPath(), `recording-${timestamp}.wav`);

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

  async transcribeAudio(audioPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const whisperArgs = ['-f', audioPath, '-otxt'];
        const whisperProcess = (() => {
          // if you get errors here, make sure whisper.cpp has been built (see README)
          if (process.platform === 'win32') {
            return spawn('./whisper.cpp/build/bin/Release/whisper-cli.exe', whisperArgs);
          }
          if (process.platform === 'darwin') {
            return spawn('./whisper.cpp/build/bin/whisper-cli', whisperArgs);
          }

          throw new Error('Unsupported platform for whisper');
        })();

        whisperProcess.on('exit', async () => {
          console.log('finished whisper');

          // Read the generated .txt file
          const txtPath = `${audioPath}.txt`;
          const transcript = await fs.promises.readFile(txtPath, 'utf8');
          console.log('Transcription text:', transcript);

          // Clean up files
          fs.unlinkSync(txtPath);

          resolve(transcript);
        });
      } catch (err) {
        console.error('[SPEECH] Error transcribing audio:', err);
        reject(err);
      }
    });
  }

  async speak(message: string) {
    console.log('[SPEECH] Speaking:', message);
    say.speak(message);
  }
}

// sox -d -c 1 -r 16000 -b 16 -e signed-integer ./test.wav silence 1 0.1 3% 1 2.0 3%
