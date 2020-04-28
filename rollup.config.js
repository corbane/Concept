
import resolve from "rollup-plugin-node-resolve"
import sourcemaps from 'rollup-plugin-sourcemaps'
import alias from "@rollup/plugin-alias"

const outDir = __dirname + "/Demo/out/"

export default {
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
          }
     },
     plugins: [
          alias ({
               entries: [
                 { find: "@ui"      , replacement: outDir + "Ui" },
                 { find: "@elements", replacement: outDir + "Ui/Elements" },
                 { find: "@app"     , replacement: outDir + "Application" },
                 { find: "@aspect"     , replacement: outDir + "Aspect" },
               ]
          }),
          sourcemaps(),
          resolve()
     ]
}
