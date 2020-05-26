import * as sa from "../src/streams/streamifyArray"
import { wrapSafeFunction, result } from "../src"


function test(async: boolean, abortOn: number | null) {
    sa.streamifyArray(
        [
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ],
    )(
        null,
        data => {
            console.log(data)
            if (data === abortOn) {
                return result(true)
            }
            if (async) {
                return wrapSafeFunction(onResult => {
                    setTimeout(
                        () => {
                            onResult(false)
                        },
                        1000
                    )
                })
            } else {
                return result(false)
            }
        },
        _aborted => {
            //
            console.log("END REACHED")
        }
    )
}
test(false, null)
test(false, 5)
test(true, 6)
