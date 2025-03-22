import say from 'say';
import * as fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { InterventionHandler, InterventionPayloadMap, Interventions, SpeakClappyPayload } from './types';
import type Clappy from '../clappy';
import { ClappyExpression } from '../types';

export default class SpeechInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.SPEAK_CLAPPY] as const;

  messageHistory: string[]; // store message history in memory because there's no benefit to persist it
  clappy: Clappy;

  constructor(clappy: Clappy) {
    this.clappy = clappy;
    this.messageHistory = [];
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

  async speakClappy(payload?: SpeakClappyPayload) {
    const message = payload?.message ?? (await this.determineClappySpeech(payload));
    const estimatedSpeechDuration = message.split(' ').length * 450 + 2000; // assume 0.45 seconds per word, plus 2 second buffer

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.popupClappySpecified(
      ClappyExpression.Chomp,
      message,
      estimatedSpeechDuration,
    );
    await this.speak(message);
  }

  // record audio from the user's microphone, with optional detection of speech start and end
  // if autoDetect is false, then the recording begins immediately and lasts for maxDurationSeconds
  // if autoDetect is true, then the recording begins when speech is detected and ends when speech stops with a max duration of maxDurationSeconds
  // returns the file path of the recorded audio
  async recordAudio(maxDurationSeconds: number = 10, autoDetect = true): Promise<string> {
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

  async transcribeAudio(audioPath: string): Promise<string> {
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

  async speak(message: string) {
    console.log('[SPEECH] Speaking:', message);
    say.speak(message);
  }

  async determineClappySpeech(payload?: SpeakClappyPayload): Promise<string> {
    const defaultSpeech = 'Get back to work!';

    if (!this.clappy.openai) {
      return defaultSpeech;
    }

    const userTask =
      payload?.userTask !== undefined
        ? `You are given that the user is currently trying to accomplish: ${payload.userTask}`
        : 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';

    const historyString =
      this.messageHistory.length === 0
        ? 'This is the first message that you are sending to the user.'
        : `The past few messages that you have spoken are:\n${this.messageHistory.join('\n')}`;

    const unproductiveReasoning = payload?.justification
      ? `The user is currently unproductive with the following reasoning: ${payload.justification}`
      : 'The user has been determined to be currently unproductive';

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. ${userTask}.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.

      ${unproductiveReasoning}. You asked to write a message that will be verbally spoken to the user to encourage them to be more productive.

      ${historyString}

      Write a short one to two sentence message to the user. Try to avoid repeating exactly what you have said in the past and utilize the reasoning if applicable.

      Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
      { message: <some helpful message>" }
    `;

    const response = await this.clappy.openai?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      max_tokens: 500,
    });

    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      console.log('[SPEECH] Failed to determine clappy message');
      return defaultSpeech;
    }

    const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
    const outputEnd = responseText.indexOf('</OUTPUT>');
    const output = responseText.slice(outputStart, outputEnd);
    const outputJson = JSON.parse(output);

    if (outputJson.message.length === 0) {
      console.log('[SPEECH] Empty message selected');
      return defaultSpeech;
    }

    this.messageHistory.push(outputJson.message);
    if (this.messageHistory.length > 5) {
      this.messageHistory.shift();
    }

    return outputJson.message;
  }
}

// sox -d -c 1 -r 16000 -b 16 -e signed-integer ./test.wav silence 1 0.1 3% 1 2.0 3%
