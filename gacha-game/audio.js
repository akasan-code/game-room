/*
  ============================================================
  Web Audio API - 召喚SE
  ============================================================

  外部音声ファイルを使わず、ブラウザ上でリアルタイム合成する。

  SummonAudio.playDeviceStart()
    召喚装置の起動音

  SummonAudio.playCardReveal(rarity)
    カード取得時の決定音
*/

(() => {
  let context = null;
  let masterGain = null;
  let noiseBuffer = null;

  function getContext() {
    if (!context) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn('Web Audio APIに対応していないブラウザです。');
        return null;
      }

      context = new AudioContextClass();

      masterGain = context.createGain();
      masterGain.gain.value = 0.90;
      masterGain.connect(context.destination);
    }

    return context;
  }

  async function unlock() {
    const ctx = getContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (error) {
        console.warn('AudioContext resume failed:', error);
      }
    }

    return ctx.state === 'running';
  }

  function getNoiseBuffer(ctx) {
    if (
      noiseBuffer &&
      noiseBuffer.sampleRate === ctx.sampleRate
    ) {
      return noiseBuffer;
    }

    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(
      1,
      length,
      ctx.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseBuffer = buffer;
    return buffer;
  }

  function createPanner(ctx, pan = 0) {
    if (!ctx.createStereoPanner) return null;

    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    return panner;
  }

  /*
    ダークファンタジー系の低い魔力起動音。

    ・低域のサイン波
    ・少し歪んだ三角波
    ・フィルターを通したノイズ
    を重ねる。
  */
  async function playDeviceStart() {
    if (!(await unlock())) return;

    const ctx = context;
    const now = ctx.currentTime;

    /*
      「シューーーン」と魔力が集まっていく音。
      ノイズを上方向へスイープさせ、
      そこへ高域のサイン波を重ねる。
    */

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.95, now + 0.05);
    bus.gain.setValueAtTime(0.95, now + 1.05);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
    bus.connect(masterGain);

    // メインの「シューン」
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(420, now);
    band.frequency.exponentialRampToValueAtTime(2400, now + 1.18);
    band.Q.value = 2.4;

    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.setValueAtTime(180, now);
    high.frequency.exponentialRampToValueAtTime(760, now + 1.10);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.42, now + 0.10);
    noiseGain.gain.setValueAtTime(0.42, now + 0.88);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);

    noise.connect(band);
    band.connect(high);
    high.connect(noiseGain);
    noiseGain.connect(bus);

    // 魔力が集まる上昇トーン
    const rise = ctx.createOscillator();
    rise.type = 'sine';
    rise.frequency.setValueAtTime(220, now);
    rise.frequency.exponentialRampToValueAtTime(920, now + 1.22);

    const riseGain = ctx.createGain();
    riseGain.gain.setValueAtTime(0.0001, now);
    riseGain.gain.exponentialRampToValueAtTime(0.20, now + 0.16);
    riseGain.gain.exponentialRampToValueAtTime(0.10, now + 1.05);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);

    rise.connect(riseGain);
    riseGain.connect(bus);

    // 少しだけ倍音を足して「魔法」感
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(520, now);
    shimmer.frequency.exponentialRampToValueAtTime(1800, now + 1.18);

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.08, now + 0.28);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(bus);

    // 最後に少し締まる「ン」
    const endTone = ctx.createOscillator();
    endTone.type = 'sine';
    endTone.frequency.setValueAtTime(980, now + 1.14);
    endTone.frequency.exponentialRampToValueAtTime(720, now + 1.42);

    const endGain = ctx.createGain();
    endGain.gain.setValueAtTime(0.0001, now + 1.10);
    endGain.gain.exponentialRampToValueAtTime(0.14, now + 1.18);
    endGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.50);

    endTone.connect(endGain);
    endGain.connect(bus);

    noise.start(now);
    rise.start(now);
    shimmer.start(now);
    endTone.start(now + 1.10);

    noise.stop(now + 1.6);
    rise.stop(now + 1.6);
    shimmer.stop(now + 1.5);
    endTone.stop(now + 1.55);
  }

  /*
    カード取得時の気持ちいい決定音。

    レア度が上がるほど、
    ・倍音を追加
    ・余韻を少し伸ばす
    ・URは金属的な高音を追加
  */
  async function playCardReveal(rarity = 'N') {
    if (!(await unlock())) return;

    const ctx = context;
    const now = ctx.currentTime;

    const config = {
      N:  { root: 660,  volume: 0.34, tail: 0.34 },
      R:  { root: 740,  volume: 0.38, tail: 0.40 },
      SR: { root: 880,  volume: 0.43, tail: 0.55 },
      UR: { root: 988,  volume: 0.48, tail: 0.72 }
    }[rarity] || {
      root: 660,
      volume: 0.34,
      tail: 0.34
    };

    const bus = ctx.createGain();
    bus.gain.value = config.volume;
    bus.connect(masterGain);

    function chime(
      frequency,
      startOffset,
      duration,
      volume,
      pan = 0
    ) {
      const start = now + startOffset;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        volume,
        start + 0.008
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

      const panner = createPanner(ctx, pan);

      osc.connect(gain);

      if (panner) {
        gain.connect(panner);
        panner.connect(bus);
      } else {
        gain.connect(bus);
      }

      osc.start(start);
      osc.stop(start + duration + 0.03);
    }

    // 一発目の「キン」
    chime(
      config.root,
      0,
      config.tail,
      0.92,
      -0.08
    );

    // 上の倍音
    chime(
      config.root * 1.5,
      0.025,
      config.tail * 0.82,
      0.42,
      0.10
    );

    // 少し遅れてキラッ
    chime(
      config.root * 2,
      0.072,
      config.tail * 0.62,
      0.24,
      0.20
    );

    if (rarity === 'SR' || rarity === 'UR') {
      chime(
        config.root * 1.25,
        0.105,
        config.tail * 0.78,
        0.28,
        -0.18
      );
    }

    if (rarity === 'UR') {
      // URだけ黄金感のある高い余韻
      chime(
        config.root * 2.5,
        0.14,
        config.tail * 0.72,
        0.18,
        0.24
      );
      chime(
        config.root * 3,
        0.21,
        config.tail * 0.55,
        0.11,
        -0.22
      );
    }
  }

  function setVolume(value) {
    if (!masterGain) {
      getContext();
    }

    if (!masterGain) return;

    const volume = Math.max(
      0,
      Math.min(1, Number(value) || 0)
    );

    masterGain.gain.value = volume;
  }

  window.SummonAudio = {
    unlock,
    playDeviceStart,
    playCardReveal,
    setVolume
  };
})();
