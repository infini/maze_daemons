import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, 'assets', 'sounds');
const sourceDir = join(outputDir, 'sources');
const recordedCoinBurpPath = join(sourceDir, 'bigsoundbank-burp-1710.wav');
const sampleRate = 44100;

const SPOOKY_VOWELS = {
  ee: [
    { frequency: 330, bandwidth: 100, gain: 0.48 },
    { frequency: 1600, bandwidth: 260, gain: 0.48 },
    { frequency: 2200, bandwidth: 430, gain: 0.11 },
  ],
  er: [
    { frequency: 520, bandwidth: 135, gain: 0.62 },
    { frequency: 1180, bandwidth: 250, gain: 0.32 },
    { frequency: 1650, bandwidth: 420, gain: 0.1 },
  ],
  uh: [
    { frequency: 470, bandwidth: 120, gain: 0.72 },
    { frequency: 980, bandwidth: 240, gain: 0.38 },
    { frequency: 1780, bandwidth: 430, gain: 0.12 },
  ],
};

mkdirSync(outputDir, { recursive: true });

writeSound('maze-tap.wav', createTapSound());
writeSound('coin-yummy.wav', createCoinBurpSound());
writeSound('clear-dragon.wav', createClearHauntSound());
writeSound('daemon-ambient-loop.wav', createDaemonAmbientLoop());

function createTapSound() {
  return finalize(
    synthesize(0.095, (time) => {
      const thump = sine(220, time) * Math.exp(-time * 55) * 0.22;
      const wood = sine(560, time) * Math.exp(-time * 36) * 0.34;
      const click = filteredNoise(time, 13, 0.0012) * Math.exp(-time * 125) * 0.11;
      return thump + wood + click;
    }),
    0.4,
  );
}

function createCoinBurpSound() {
  const recordedBurp = loadRecordedCoinBurp();
  if (!recordedBurp) {
    return createSyntheticCoinBurpSound();
  }

  const preparedBurp = normalize(lowPass(resampleSpeed(trimSilence(recordedBurp, 0.006), 0.78), 3200), 0.82);
  const dry = synthesize(0.8, (time) => {
    const swallow =
      (sine(glide(time, 0.018, 0.12, 132, 82), time) * 0.13 +
        sine(glide(time, 0.018, 0.12, 264, 164), time) * 0.035) *
      attackRelease(time - 0.018, 0.018, 0.16, 1.65);
    const realBurp = sampleAt(preparedBurp, time, 0.1) * 0.82;
    const chest = bellyPressure(time, 0.09, 0.48, 0.18);
    const fullTail =
      sine(glide(time, 0.48, 0.22, 58, 42), time) * attackRelease(time - 0.48, 0.04, 0.22, 1.35) * 0.09;

    return swallow + realBurp + chest + fullTail;
  });

  return finalize(
    addShortRoom(lowPass(dry, 3400), [
      { delaySeconds: 0.032, gain: 0.055 },
      { delaySeconds: 0.061, gain: 0.032 },
    ]),
    0.58,
  );
}

function createSyntheticCoinBurpSound() {
  const dry = synthesize(0.96, (time) => {
    const onset = softBurpPlosive(time, 0.018, 0.09, 0.16, 211);
    const pressure = bellyPressure(time, 0.035, 0.72, 0.23);
    const mainBurp = roundedBurpVoice(time, 0.07, 0.62, 104, 48, 0.72);
    const lowAftertaste = roundedBurpVoice(time, 0.38, 0.28, 67, 43, 0.2);
    const closedMouthTail =
      sine(glide(time, 0.62, 0.24, 48, 38), time) * attackRelease(time - 0.62, 0.045, 0.24, 1.4) * 0.08;
    const release = softBurpPlosive(time, 0.58, 0.12, 0.08, 227);

    return onset + pressure + mainBurp + lowAftertaste + closedMouthTail + release;
  });

  return finalize(
    addShortRoom(lowPass(dry, 2400), [
      { delaySeconds: 0.043, gain: 0.08 },
      { delaySeconds: 0.078, gain: 0.045 },
    ]),
    0.54,
  );
}

function createClearHauntSound() {
  const voice = createSpeechSamples({
    rate: 96,
    text: 'clear',
    voice: 'Grandpa',
  });
  const clearVoice = voice ? prepareClearVoice(voice) : null;

  return finalize(
    synthesize(2.34, (time) => {
      const firstHit = doomDrum(time, 0, 0.34, 54, 0.44);
      const secondHit = doomDrum(time, 0.34, 0.4, 48, 0.5);
      const thirdHit = doomDrum(time, 0.72, 0.58, 42, 0.62);
      const heavyGate = attackRelease(time - 0.18, 0.08, 1.76, 1.25);
      const lowDrone =
        (sine(glide(time, 0.18, 1.76, 78, 48), time) * 0.27 +
          sine(glide(time, 0.18, 1.76, 117, 72), time) * 0.08) *
        heavyGate;
      const clearChord =
        darkResonantBell(time, 0.8, 174.61, 0.7, 0.14) +
        darkResonantBell(time, 1.02, 130.81, 0.76, 0.17) +
        darkResonantBell(time, 1.24, 98, 0.72, 0.12);
      const finalDrop =
        (sine(glide(time, 1.42, 0.56, 84, 42), time) * 0.18 +
          sine(glide(time, 1.42, 0.56, 168, 84), time) * 0.045) *
        attackRelease(time - 1.42, 0.06, 0.62, 1.6);
      const air = smoothNoise(time, 109, 15) * attackRelease(time - 0.22, 0.2, 1.52, 2.1) * 0.009;
      const spokenClear = clearVoice ? sampleAt(clearVoice, time, 1.03) * 0.5 : ghostClearWord(time, 1.08) * 0.24;
      const voiceBody = clearVoice ? sampleAt(clearVoice, time, 1.03) * sine(66, time) * 0.026 : 0;
      const voiceShadow = clearVoice ? sampleAt(clearVoice, time, 1.1) * 0.09 : 0;
      return firstHit + secondHit + thirdHit + lowDrone + clearChord + finalDrop + air + spokenClear + voiceBody + voiceShadow;
    }),
    0.66,
  );
}

function loadRecordedCoinBurp() {
  if (!existsSync(recordedCoinBurpPath)) {
    return null;
  }

  try {
    return readWavSamples(recordedCoinBurpPath);
  } catch {
    return null;
  }
}

function prepareClearVoice(samples) {
  const trimmed = trimSilence(samples, 0.012);
  const lowered = resampleSpeed(trimmed, 0.82);
  const rounded = lowPass(lowered, 4200);
  return normalize(
    addShortRoom(rounded, [
      { delaySeconds: 0.052, gain: 0.07 },
      { delaySeconds: 0.104, gain: 0.04 },
    ]),
    0.72,
  );
}

function createDaemonAmbientLoop() {
  const duration = 16;
  return synthesize(duration, (time) => {
    const phase = time / duration;
    const slowGate = 0.62 + Math.sin(2 * Math.PI * 4 * phase) * 0.08;
    const drone =
      Math.sin(2 * Math.PI * 55 * time) * 0.13 +
      Math.sin(2 * Math.PI * 82.5 * time) * 0.08 +
      Math.sin(2 * Math.PI * 110 * time) * 0.035;
    const pulse = Math.max(0, Math.sin(2 * Math.PI * 2 * time)) ** 9;
    const tick = Math.sin(2 * Math.PI * 220 * time) * pulse * 0.035;
    const distant =
      Math.sin(2 * Math.PI * 165 * time + Math.sin(2 * Math.PI * 0.25 * time) * 0.8) *
      0.026;
    return (drone * slowGate + tick + distant) * 0.75;
  });
}

function synthesize(durationSeconds, sampleAt) {
  const length = Math.floor(durationSeconds * sampleRate);
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const sample = sampleAt(time);
    samples[index] = Number.isFinite(sample) ? clamp(sample, -1, 1) : 0;
  }
  return samples;
}

function finalize(samples, peak) {
  const faded = applyFade(samples, 0.004, 0.014);
  return normalize(faded, peak);
}

function normalize(samples, peak) {
  let max = 0;
  for (const sample of samples) {
    if (Number.isFinite(sample)) {
      max = Math.max(max, Math.abs(sample));
    }
  }
  if (max === 0) {
    return samples;
  }
  const scale = peak / max;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Number.isFinite(samples[index]) ? samples[index] * scale : 0;
  }
  return samples;
}

function applyFade(samples, fadeInSeconds, fadeOutSeconds) {
  const fadeInSamples = Math.max(1, Math.floor(fadeInSeconds * sampleRate));
  const fadeOutSamples = Math.max(1, Math.floor(fadeOutSeconds * sampleRate));
  for (let index = 0; index < samples.length; index += 1) {
    const fadeIn = Math.min(1, index / fadeInSamples);
    const fadeOut = Math.min(1, (samples.length - index - 1) / fadeOutSamples);
    samples[index] *= Math.min(fadeIn, fadeOut);
  }
  return samples;
}

function lowPass(samples, cutoffFrequency) {
  const output = new Float32Array(samples.length);
  const rc = 1 / (2 * Math.PI * cutoffFrequency);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let previous = samples[0] ?? 0;

  for (let index = 0; index < samples.length; index += 1) {
    previous += alpha * ((samples[index] ?? 0) - previous);
    output[index] = previous;
  }

  return output;
}

function addShortRoom(samples, taps) {
  const output = new Float32Array(samples.length);

  for (let index = 0; index < samples.length; index += 1) {
    let sample = samples[index] ?? 0;
    for (const tap of taps) {
      const delaySamples = Math.floor(tap.delaySeconds * sampleRate);
      if (index >= delaySamples) {
        sample += (samples[index - delaySamples] ?? 0) * tap.gain;
      }
    }
    output[index] = sample;
  }

  return lowPass(output, 2700);
}

function writeSound(filename, samples) {
  assertAudible(filename, samples);
  writeWav(join(outputDir, filename), samples);
}

function assertAudible(filename, samples) {
  let max = 0;
  let sum = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) {
      throw new Error(`${filename} contains a non-finite sample.`);
    }
    max = Math.max(max, Math.abs(sample));
    sum += sample * sample;
  }
  const rms = Math.sqrt(sum / samples.length);
  if (max < 0.02 || rms < 0.002) {
    throw new Error(`${filename} is effectively silent. peak=${max.toFixed(4)} rms=${rms.toFixed(4)}`);
  }
}

function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Number.isFinite(samples[index]) ? samples[index] : 0;
    buffer.writeInt16LE(Math.round(clamp(sample, -1, 1) * 32767), 44 + index * 2);
  }

  writeFileSync(path, buffer);
}

function createSpeechSamples({ rate, text, voice }) {
  if (process.platform !== 'darwin' || !existsSync('/usr/bin/say') || !existsSync('/usr/bin/afconvert')) {
    return null;
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'maze-daemons-speech-'));
  const aiffPath = join(tempDir, 'speech.aiff');
  const wavPath = join(tempDir, 'speech.wav');

  try {
    execFileSync('/usr/bin/say', ['-v', voice, '-r', String(rate), '-o', aiffPath, text], {
      stdio: 'ignore',
    });
    execFileSync('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', aiffPath, wavPath], {
      stdio: 'ignore',
    });
    return readWavSamples(wavPath);
  } catch {
    return null;
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

function readWavSamples(path) {
  const buffer = readFileSync(path);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${path} is not a supported WAV file.`);
  }

  let offset = 12;
  let channels = 1;
  let bitsPerSample = 16;
  let sourceSampleRate = sampleRate;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const payloadOffset = offset + 8;

    if (chunkId === 'fmt ') {
      channels = buffer.readUInt16LE(payloadOffset + 2);
      sourceSampleRate = buffer.readUInt32LE(payloadOffset + 4);
      bitsPerSample = buffer.readUInt16LE(payloadOffset + 14);
    }
    if (chunkId === 'data') {
      dataOffset = payloadOffset;
      dataSize = chunkSize;
      break;
    }

    offset = payloadOffset + chunkSize + (chunkSize % 2);
  }

  const bytesPerSample = bitsPerSample / 8;
  if (dataOffset < 0 || ![1, 2, 3, 4].includes(bytesPerSample) || channels < 1) {
    throw new Error(`${path} is not a supported PCM WAV file.`);
  }

  const frameCount = Math.floor(dataSize / (channels * bytesPerSample));
  const samples = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      sum += readPcmSample(buffer, dataOffset + (frame * channels + channel) * bytesPerSample, bitsPerSample);
    }
    samples[frame] = sum / channels;
  }
  return sourceSampleRate === sampleRate ? samples : resampleToSampleRate(samples, sourceSampleRate, sampleRate);
}

function readPcmSample(buffer, offset, bitsPerSample) {
  if (bitsPerSample === 8) {
    return (buffer.readUInt8(offset) - 128) / 128;
  }
  if (bitsPerSample === 16) {
    return buffer.readInt16LE(offset) / 32768;
  }
  if (bitsPerSample === 24) {
    return buffer.readIntLE(offset, 3) / 8388608;
  }
  if (bitsPerSample === 32) {
    return buffer.readInt32LE(offset) / 2147483648;
  }
  throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
}

function resampleToSampleRate(samples, fromRate, toRate) {
  const outputLength = Math.max(1, Math.floor((samples.length * toRate) / fromRate));
  const output = new Float32Array(outputLength);
  const ratio = fromRate / toRate;
  for (let index = 0; index < outputLength; index += 1) {
    output[index] = interpolateSample(samples, index * ratio);
  }
  return output;
}

function trimSilence(samples, threshold) {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }

  const padding = Math.floor(sampleRate * 0.035);
  const paddedStart = Math.max(0, start - padding);
  const paddedEnd = Math.min(samples.length - 1, end + padding);
  return samples.slice(paddedStart, paddedEnd + 1);
}

function resampleSpeed(samples, speed) {
  const outputLength = Math.max(1, Math.floor(samples.length / speed));
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    output[index] = interpolateSample(samples, index * speed);
  }
  return output;
}

function sampleAt(samples, time, start) {
  const sampleIndex = (time - start) * sampleRate;
  if (sampleIndex < 0 || sampleIndex >= samples.length - 1) {
    return 0;
  }
  const envelope = Math.min(1, sampleIndex / (sampleRate * 0.025), (samples.length - sampleIndex) / (sampleRate * 0.04));
  return interpolateSample(samples, sampleIndex) * Math.max(0, envelope);
}

function interpolateSample(samples, index) {
  const left = Math.floor(index);
  const right = Math.min(samples.length - 1, left + 1);
  const progress = index - left;
  return lerp(samples[left] ?? 0, samples[right] ?? 0, progress);
}

function eerieBell(time, start, frequency, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = Math.exp(-localTime * 3.6) * sineEnvelope(localTime / duration, 0.48);
  const detune = sine(frequency * 0.985, localTime) * 0.18;
  const tone =
    sine(frequency, localTime) * 0.5 +
    detune +
    sine(frequency * 1.5, localTime) * 0.08 +
    sine(frequency * 2, localTime) * 0.035;
  return Math.tanh(tone * 1.12) * envelope * amount;
}

function mutedCoinBell(time, start, frequency, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = Math.exp(-localTime * 8.5) * sineEnvelope(localTime / duration, 0.42);
  const tone =
    sine(frequency, localTime) * 0.48 +
    sine(frequency * 1.505, localTime) * 0.16 +
    sine(frequency * 2.01, localTime) * 0.045;
  return Math.tanh(tone * 1.1) * envelope * amount;
}

function darkResonantBell(time, start, frequency, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = Math.exp(-localTime * 3.2) * sineEnvelope(localTime / duration, 0.44);
  const tone =
    sine(frequency, localTime) * 0.52 +
    sine(frequency * 1.49, localTime) * 0.16 +
    sine(frequency * 2.01, localTime) * 0.07;
  return Math.tanh(tone * 1.18) * envelope * amount;
}

function doomDrum(time, start, duration, frequency, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const pitch = glide(localTime, 0, duration, frequency * 1.38, frequency);
  const envelope = Math.exp(-localTime * 4.1) * attackRelease(localTime, 0.012, duration, 1.15);
  const body =
    sine(pitch, localTime) * 0.62 +
    sine(pitch * 1.5, localTime) * 0.18 +
    sine(pitch * 2, localTime) * 0.06;
  const skin = smoothNoise(localTime, 131 + Math.floor(frequency), 28) * Math.exp(-localTime * 22) * 0.04;
  return Math.tanh((body + skin) * 1.3) * envelope * amount;
}

function burpVoice(time, start, duration, fromFrequency, toFrequency, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const progress = localTime / duration;
  const envelope = attackRelease(localTime, 0.065, duration, 0.72);
  const throatPulse = 0.82 + smoothNoise(localTime, 83, 9) * 0.12 + sine(7.4, localTime) * 0.04;
  const frequency = lerp(fromFrequency, toFrequency, progress) * (1 + smoothNoise(localTime, 89, 8) * 0.04);
  const throat =
    sine(frequency, localTime) * 0.42 +
    sine(frequency * 0.5, localTime) * 0.22 +
    sine(frequency * 1.52, localTime) * 0.12;
  const roundedMouth = formantVoice(frequency * 0.84, localTime, SPOOKY_VOWELS.er) * 0.38;
  const breath = smoothNoise(localTime, 97, 31) * 0.08;
  return Math.tanh((throat + roundedMouth + breath) * 1.45) * envelope * throatPulse * amount;
}

function organicBurpVoice(time, start, duration, fromFrequency, toFrequency, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const progress = localTime / duration;
  const envelope = attackRelease(localTime, 0.075, duration, 0.82);
  const wobble = 1 + smoothNoise(localTime, 151, 6) * 0.06 + sine(6.7, localTime) * 0.018;
  const frequency = lerp(fromFrequency, toFrequency, progress) * wobble;
  const throat =
    sine(frequency, localTime) * 0.38 +
    sine(frequency * 0.5, localTime) * 0.25 +
    sine(frequency * 1.48, localTime) * 0.09;
  const roundedMouth =
    softFormant(frequency, localTime, 430, 150, 0.55) +
    softFormant(frequency, localTime, 880, 260, 0.22);
  const bubble = smoothNoise(localTime, 157, 18) * 0.06 + smoothNoise(localTime, 163, 42) * 0.035;
  const gulpPulse = 0.84 + Math.max(0, sine(8.2, localTime)) * 0.08;
  return Math.tanh((throat + roundedMouth + bubble) * 1.42) * envelope * gulpPulse * amount;
}

function roundedBurpVoice(time, start, duration, fromFrequency, toFrequency, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const progress = localTime / duration;
  const envelope = attackRelease(localTime, 0.09, duration, 1.08);
  const pulse = 0.78 + Math.max(0, sine(8.6, localTime + 0.07)) * 0.13 + smoothNoise(localTime, 271, 7) * 0.07;
  const frequency =
    lerp(fromFrequency, toFrequency, progress) *
    (1 + smoothNoise(localTime, 277, 5) * 0.025 + sine(4.1, localTime) * 0.01);

  let throat = 0;
  for (let harmonic = 1; harmonic <= 9; harmonic += 1) {
    const rolloff = Math.exp(-harmonic * 0.31);
    const detune = 1 + smoothNoise(localTime + harmonic * 0.017, 281 + harmonic, 4) * 0.003;
    throat += sine(frequency * harmonic * detune, localTime) * rolloff;
  }

  const vowelBlend = sineEnvelope(progress, 0.55);
  const roundedMouth =
    softFormant(frequency, localTime, lerp(360, 520, vowelBlend), 145, 0.58) +
    softFormant(frequency, localTime, lerp(820, 960, vowelBlend), 250, 0.25) +
    softFormant(frequency, localTime, lerp(1280, 1480, vowelBlend), 420, 0.08);
  const warmAir = (smoothNoise(localTime, 293, 18) * 0.055 + smoothNoise(localTime, 307, 34) * 0.026) * (1 - progress * 0.35);

  return Math.tanh((throat * 0.34 + roundedMouth + warmAir) * 1.12) * envelope * pulse * amount;
}

function bellyPressure(time, start, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = attackRelease(localTime, 0.08, duration, 1.35);
  const frequency = glide(localTime, 0, duration, 76, 42);
  const tone =
    sine(frequency, localTime) * 0.48 +
    sine(frequency * 0.5, localTime) * 0.24 +
    sine(frequency * 1.5, localTime) * 0.07;
  return Math.tanh(tone * 1.18) * envelope * amount;
}

function softBurpPlosive(time, start, duration, amount, seed) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = Math.exp(-localTime * 25) * sineEnvelope(localTime / duration, 0.42);
  const knock = sine(88, localTime) * 0.52 + sine(176, localTime) * 0.14;
  const breath = smoothNoise(localTime, seed, 72) * 0.026 + smoothNoise(localTime, seed + 9, 31) * 0.018;
  return (knock + breath) * envelope * amount;
}

function softFormant(frequency, time, formantFrequency, bandwidth, gain) {
  let sample = 0;
  for (let harmonic = 1; harmonic <= 12; harmonic += 1) {
    const harmonicFrequency = frequency * harmonic;
    const distance = (harmonicFrequency - formantFrequency) / bandwidth;
    const weight = Math.exp(-distance * distance) * gain * (1 / harmonic) ** 1.05;
    sample += sine(harmonicFrequency, time) * weight;
  }
  return sample;
}

function eerieTone(time, start, duration, fromFrequency, toFrequency, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const progress = localTime / duration;
  const envelope = attackRelease(localTime, 0.08, duration, 1.25);
  const tremolo = 0.74 + sine(5.1, localTime) * 0.08 + sine(2.3, localTime) * 0.05;
  const noteFrequency = lerp(fromFrequency, toFrequency, progress) * (1 + sine(4.2, localTime) * 0.003);
  const tone =
    sine(noteFrequency, localTime) * 0.46 +
    sine(noteFrequency * 0.5, localTime) * 0.2 +
    sine(noteFrequency * 1.01, localTime) * 0.12;
  return Math.tanh(tone * 1.2) * envelope * tremolo * amount;
}

function hauntedBreathLaugh(time, start, duration, frequency, amount, seed) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = attackRelease(localTime, 0.035, duration, 1.1);
  const chuckle = 0.78 + smoothNoise(localTime, seed, 12) * 0.08;
  const wobble = 1 + smoothNoise(localTime, seed + 5, 7) * 0.022 + sine(5.2, localTime) * 0.006;
  const throat =
    sine(frequency * wobble, localTime) * 0.34 +
    sine(frequency * 0.5 * wobble, localTime) * 0.16 +
    formantVoice(frequency * wobble, localTime, SPOOKY_VOWELS.uh) * 0.34;
  const breath = smoothNoise(localTime, seed + 13, 38) * 0.08;
  return Math.tanh((throat + breath) * 1.28) * envelope * chuckle * amount;
}

function ghostClearWord(time, start) {
  return (
    ghostConsonant(time, start, 0.09, 0.055) +
    spookyVoice(time, start + 0.08, 0.36, 136, 128, SPOOKY_VOWELS.ee, SPOOKY_VOWELS.ee, 0.2) +
    spookyVoice(time, start + 0.36, 0.54, 122, 92, SPOOKY_VOWELS.ee, SPOOKY_VOWELS.er, 0.24) +
    ghostWhisper(time, start + 0.12, 0.78, 0.075)
  );
}

function spookyVoice(time, start, duration, fromFrequency, toFrequency, fromVowel, toVowel, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const progress = localTime / duration;
  const envelope = attackRelease(localTime, 0.08, duration, 0.9);
  const tremolo = 0.76 + smoothNoise(localTime, 41, 9) * 0.08 + sine(4.4, localTime) * 0.025;
  const frequency = lerp(fromFrequency, toFrequency, progress) * (1 + smoothNoise(localTime, 43, 8) * 0.008);
  const vowel = interpolateFormants(fromVowel, toVowel, progress);
  const breath = smoothNoise(localTime, 47, 42) * 0.045 + smoothNoise(localTime, 53, 17) * 0.035;
  return (formantVoice(frequency, localTime, vowel) * 0.72 + breath) * envelope * tremolo * amount;
}

function ghostConsonant(time, start, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = Math.exp(-localTime * 28);
  const knock = sine(118, localTime) * 0.5 + sine(236, localTime) * 0.18;
  const breath = filteredNoise(localTime, 31, 0.004) * 0.12;
  return (knock + breath) * envelope * amount;
}

function ghostWhisper(time, start, duration, amount) {
  if (time < start || time > start + duration) {
    return 0;
  }
  const localTime = time - start;
  const envelope = attackRelease(localTime, 0.12, duration, 1.5);
  const breath = smoothNoise(localTime, 59, 34) * 0.55 + smoothNoise(localTime, 61, 76) * 0.18;
  return breath * envelope * amount;
}

function formantVoice(frequency, time, formants) {
  let sample = 0;
  for (let harmonic = 1; harmonic <= 12; harmonic += 1) {
    const harmonicFrequency = frequency * harmonic;
    if (harmonicFrequency > 2200) {
      break;
    }
    const detune = 1 + smoothNoise(time + harmonic * 0.021, harmonic * 67, 6) * 0.004;
    const gain = formants.reduce((sum, formant) => {
      const distance = (harmonicFrequency * detune - formant.frequency) / formant.bandwidth;
      return sum + formant.gain * Math.exp(-distance * distance);
    }, 0.025);
    sample += sine(harmonicFrequency * detune, time) * gain * (1 / harmonic) ** 0.98;
  }
  return Math.tanh(sample * 1.18);
}

function interpolateFormants(fromVowel, toVowel, progress) {
  return fromVowel.map((formant, index) => {
    const target = toVowel[index];
    return {
      bandwidth: lerp(formant.bandwidth, target.bandwidth, progress),
      frequency: lerp(formant.frequency, target.frequency, progress),
      gain: lerp(formant.gain, target.gain, progress),
    };
  });
}

function attackRelease(time, attack, duration, releasePower = 1) {
  if (time < 0) {
    return 0;
  }
  if (time > duration) {
    return 0;
  }
  const attackAmount = Math.min(1, time / attack);
  const releaseAmount = Math.max(0, 1 - time / duration);
  return attackAmount * releaseAmount ** releasePower;
}

function glide(time, start, duration, fromValue, toValue) {
  const progress = clamp((time - start) / duration, 0, 1);
  return lerp(fromValue, toValue, progress);
}

function filteredNoise(time, seed, spreadSeconds) {
  return (
    noise(time, seed) * 0.48 +
    noise(time + spreadSeconds, seed + 11) * 0.32 +
    noise(time + spreadSeconds * 2, seed + 23) * 0.2
  );
}

function smoothNoise(time, seed, rate) {
  const scaled = time * rate;
  const left = Math.floor(scaled);
  const right = left + 1;
  const progress = scaled - left;
  const smoothProgress = progress * progress * (3 - 2 * progress);
  return lerp(hashNoise(left, seed), hashNoise(right, seed), smoothProgress);
}

function hashNoise(index, seed) {
  const value = Math.sin((index * 127.1 + seed * 311.7) * 43758.5453);
  return (value - Math.floor(value)) * 2 - 1;
}

function sine(frequency, time) {
  return Math.sin(2 * Math.PI * frequency * time);
}

function lerp(fromValue, toValue, progress) {
  return fromValue + (toValue - fromValue) * progress;
}

function sineEnvelope(progress, power) {
  return Math.max(0, Math.sin(Math.PI * clamp(progress, 0, 1))) ** power;
}

function noise(time, seed) {
  const value = Math.sin((time * 1234.567 + seed * 78.233) * 43758.5453);
  return (value - Math.floor(value)) * 2 - 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
