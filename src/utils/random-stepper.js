/* RandomStepper - produce a pseudo-random sequence that trends in one direction or another instead
   of jumping around completely randomly.
   Originally from https://stackoverflow.com/a/22080644 with many changes...
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

// randomStepper returns a function that, when called, produces the next pseudo-random value
// in the interval [min..max] in the sequence.
export default function(min, max, round) {
  if (min === undefined) min = 0
  if (max === undefined) max = 100
  if (round === undefined) round = 10

  function roundVal(val) { return Math.round(val*round)/round }

  let value = (max-min) * Math.random() + min // starting value
  let phase=0, w=0, x2=0

  return () => {
    function step() {
      let z
      if (!phase) {
          let x1
          do {
              x1 = 2.0 * Math.random() - 1.0;
              x2 = 2.0 * Math.random() - 1.0;
              w = x1 * x1 + x2 * x2;
          } while (w >= 1.0);
          w = Math.sqrt((-2.0 * Math.log(w)) / w);
          z = x1 * w;
      } else {
          z = x2 * w;
      }
      phase ^= 1;

      return z;
    }
    let r
    do { r = step(); } while (value + r < min || value + r > max);
    value += r;
    return roundVal(value)
  }
}
