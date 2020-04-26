
import resolve from "rollup-plugin-node-resolve"
import sourcemaps from 'rollup-plugin-sourcemaps'

export default {
    input: "Demo/out/Demo/index.js",
    external: ["fabric", "faker", "fabric/fabric-impl"],
    output: {
      file     : "Demo/js/index.js",
      format   : "iife",
      name     : "concept",
      sourcemap: "inline",
      globals: {
        fabric: "fabric",
        faker : "faker",
        "fabric/fabric-impl" : "fabric",
      }
    },
    plugins: [
        sourcemaps (),
        resolve ()
    ]
}
