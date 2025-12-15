
/**
 * Fast Fourier Transform (FFT) Implementation
 * Uses Radix-2 Cooley-Tukey algorithm with precomputed tables.
 *
 * Supports only power-of-two sizes.
 */
export class FFT {
  private size: number;
  private reverseTable: Uint32Array;
  private sinTable: Float32Array;
  private cosTable: Float32Array;

  constructor(size: number) {
    if (!Number.isInteger(Math.log2(size))) {
      throw new Error("FFT size must be a power of two.");
    }
    this.size = size;
    this.reverseTable = new Uint32Array(size);
    this.sinTable = new Float32Array(size / 2);
    this.cosTable = new Float32Array(size / 2);
    this.precomputeTables();
  }

  private precomputeTables() {
    for (let i = 0; i < this.size; i++) {
      this.reverseTable[i] = this.reverseBits(i, Math.log2(this.size));
    }

    // Precompute twiddle factors
    // We need e^(-2*pi*i*k/N)
    // The tables below store cos/sin for k ranges.
    // However, the standard Cooley-Tukey loop uses trigonometric recurrence or direct lookup.
    // To match the loop structure:
    // We need values for different 'halfSize' stages.
    // A simpler approach for tables is to store all N/2 twiddle factors W_N^k.
    // W_N^k = cos(-2pi*k/N) + j*sin(-2pi*k/N)
    // k ranges from 0 to N/2-1.
    for (let i = 0; i < this.size / 2; i++) {
      this.cosTable[i] = Math.cos(-2 * Math.PI * i / this.size);
      this.sinTable[i] = Math.sin(-2 * Math.PI * i / this.size);
    }
  }

  private reverseBits(x: number, bits: number): number {
    let y = 0;
    for (let i = 0; i < bits; i++) {
      y = (y << 1) | (x & 1);
      x >>= 1;
    }
    return y;
  }

  /**
   * Performs FFT on the input data.
   *
   * @param real Input real part (modified in place)
   * @param imag Input imaginary part (modified in place)
   */
  public transform(real: Float32Array, imag: Float32Array) {
    if (real.length !== this.size || imag.length !== this.size) {
      throw new Error("Input arrays must match FFT size.");
    }

    // Bit-reversal permutation
    for (let i = 0; i < this.size; i++) {
      const rev = this.reverseTable[i];
      if (i < rev) {
        const tempReal = real[i];
        const tempImag = imag[i];
        real[i] = real[rev];
        imag[i] = imag[rev];
        real[rev] = tempReal;
        imag[rev] = tempImag;
      }
    }

    // Butterfly operations
    let halfSize = 1;
    while (halfSize < this.size) {
      // In each stage, we iterate through blocks of size 2*halfSize
      // For each block, we iterate through 'halfSize' pairs.
      // The twiddle factor depends on the index within the block (k).
      // The twiddle factor corresponds to W_N^k where N is the current stage size?
      // No, in Cooley-Tukey, the angle is -2*pi*k / (2*halfSize).
      // This is equivalent to -2*pi*(k * (size/(2*halfSize))) / size.
      // So the index into our master table (size N) is k * (size / (2*halfSize)).

      const step = this.size / (halfSize * 2);

      for (let i = 0; i < this.size; i += 2 * halfSize) {
        for (let k = 0; k < halfSize; k++) {
          const tableIdx = k * step;
          const currentPhaseShiftReal = this.cosTable[tableIdx];
          const currentPhaseShiftImag = this.sinTable[tableIdx];

          const j = i + k + halfSize;
          const tr = currentPhaseShiftReal * real[j] - currentPhaseShiftImag * imag[j];
          const ti = currentPhaseShiftReal * imag[j] + currentPhaseShiftImag * real[j];

          real[j] = real[i + k] - tr;
          imag[j] = imag[i + k] - ti;
          real[i + k] += tr;
          imag[i + k] += ti;
        }
      }
      halfSize <<= 1;
    }
  }
}
