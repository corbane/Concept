
import alias from "@rollup/plugin-alias"
import resolve from "@rollup/plugin-node-resolve"
import sourcemaps from "rollup-plugin-sourcemaps"

const outDir = __dirname + "/Demo/out/"

/**
 * @type {import("rollup").RollupOptions}
 */
const options = {
     input   : outDir + "Demo/index.js",
     external: [ "fabric", "faker" ],
     output  : {
          file: "Demo/js/index.js",
          format: "iife",
          name: "concept",
          sourcemap: "inline",
          globals: {
               faker: "faker",
               fabric: "fabric"
          },

     },
     plugins: [
          alias ({
               entries: [
                 { find: "@lib"     , replacement: outDir + "Lib" },
                 { find: "@data"    , replacement: outDir + "Data" },
                 { find: "@ui"      , replacement: outDir + "Ui" },
                 { find: "@elements", replacement: outDir + "Ui/Elements" },
                 { find: "@aspect"  , replacement: outDir + "Aspect" },
                 { find: "@api"     , replacement: outDir + "Api" },
                 { find: "@app"     , replacement: outDir + "Application" },
               ]
          }),
          sourcemaps(),
          resolve()
     ]
}
export default options
