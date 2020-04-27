
import resolve from "rollup-plugin-node-resolve"
import sourcemaps from 'rollup-plugin-sourcemaps'

export default {
    input: "Demo/out/Demo/index.js",
    external: ["fabric", "faker"],
    output: {
      file     : "Demo/js/index.js",
      format   : "iife",
      name     : "concept",
      sourcemap: "inline",
      globals: {
        faker : "faker",
        fabric: "fabric",
      }
    },
    plugins: [
        sourcemaps (),
        resolve ()
    ]
}
