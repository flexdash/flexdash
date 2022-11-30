// format values

// Format v using an appropriate ISO prefix, returns the scaled value and the prefix string
// https://www.nist.gov/pml/owm/metric-si-prefixes
export function toISO(v) {
    const sign = v < 0 ? -1 : 1
    v = v * sign
    if (v >= 1 || v == 0) {
        let prefix = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"]
        let i = 0
        while (v >= 1000 && i < prefix.length) {
            v /= 1000
            i++
        }
        return [sign*v, prefix[i]]
    } else if (v > 0) {
        let prefix = ["m", "µ", "n", "p", "f", "a", "z", "y"]
        let i = 0
        v *= 1000
        while (v < 1 && i < prefix.length) {
            v *= 1000
            i++
        }
        return [ sign*v, prefix[i] ]
    }
    return [ sign*v, "" ]
}
