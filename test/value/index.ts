/* eslint
    "no-console": "off",
*/

import * as p20 from "../../src"

const val = p20.createValue<number>(() => {
    console.log("initial value set")
    return 42
})

//const val = p20.value(42)

const val2 = val.mapResult<string>(result => {
    console.log(`the value was ${result}`)
    return p20.value("fourty-two")
})

const val3 = val2.try<number, string>(result => {
    console.log(`the value was ${result}`)
    return p20.error("this went wrong")
})

console.log("starting")

//console.log(val3)

val3.handle(
    err => {
        console.log(`error, the value was '${err}'`)
    },
    success => {
        console.log(`success, the value was '${success}'`)
    }
)
