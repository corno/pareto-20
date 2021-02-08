/* eslint
    "no-console": "off",
*/

import * as p20 from "../../src"

const val = p20.success<number, string>(42)

const val2 = val.catch(myError => {
    console.log(myError)
    return p20.value(33)
})

val2.handle(
    res => {
        console.log(res)

    }
)